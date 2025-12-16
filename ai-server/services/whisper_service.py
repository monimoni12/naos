"""
Whisper STT Service + Demucs 보컬 분리 (CLI) + 보컬 에너지 체크 + 환각 감지
- Demucs CLI로 배경음악 제거 (python -m demucs.separate)
- 보컬 에너지(RMS) 체크로 BGM only 영상 감지
- OpenAI Whisper API로 정확한 전사
- Windows 한글 경로 호환
"""

import os
import re
import sys
import wave
import struct
import math
import tempfile
import subprocess
import shutil
import requests
import json
from openai import OpenAI


class WhisperService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.use_demucs = self._check_demucs()
        
        # 보컬 에너지 임계값 (이 값 이하면 "음성 없음"으로 판정)
        self.vocal_energy_threshold = 0.01  # RMS 값
        
        # 환각 감지용 패턴
        self.hallucination_patterns = [
            'ultramarine', 'Studio', 'Frappe', 'goes to',
            'Subscribe', 'Thank you for watching',
            'MR', 'Instrumental', 'legend', 'called', 'eless',
        ]
        
        # 이모지 패턴
        self.emoji_pattern = re.compile(
            "["
            "\U0001F300-\U0001F9FF"
            "\U00002600-\U000027BF"
            "\U0001F600-\U0001F64F"
            "\U0001F680-\U0001F6FF"
            "\U0001F1E0-\U0001F1FF"
            "]+"
        )
    
    def _check_demucs(self) -> bool:
        """Demucs CLI 설치 여부 확인 (python -m 방식)"""
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'demucs.separate', '--help'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                print("    ✅ Demucs 사용 가능 - 보컬 분리 활성화")
                return True
            return False
        except Exception as e:
            print(f"    ⚠️ Demucs 미설치 - 보컬 분리 비활성화: {e}")
            return False
    
    def transcribe_file(self, file) -> dict:
        """업로드된 파일을 전사"""
        with tempfile.NamedTemporaryFile(delete=False, suffix=self._get_suffix(file.filename)) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            return self._process_and_transcribe(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    def transcribe_url(self, url: str) -> dict:
        """URL에서 파일 다운로드 후 전사"""
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        suffix = self._get_suffix_from_url(url)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
            tmp_path = tmp.name
        
        try:
            return self._process_and_transcribe(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    
    def _process_and_transcribe(self, file_path: str) -> dict:
        """
        전체 처리 파이프라인:
        1. 파일 크기 확인
        2. 영상 duration 추출
        3. 필요시 오디오 추출
        4. Demucs로 보컬 분리
        5. 보컬 에너지 체크 (BGM only 감지)
        6. Whisper로 전사
        7. 환각 감지 및 처리
        """
        file_size = os.path.getsize(file_path)
        print(f"    📦 파일 크기: {file_size / (1024*1024):.1f}MB")
        
        # 영상 duration 추출
        duration = self._get_duration(file_path)
        print(f"    ⏱️ 영상 길이: {duration:.1f}초" if duration else "    ⏱️ 영상 길이: 알 수 없음")
        
        audio_path = None
        vocals_path = None
        demucs_output_dir = None
        
        try:
            # Step 1: 오디오 추출
            print(f"    🔊 오디오 추출 중...")
            audio_path = self._extract_audio(file_path)
            if not audio_path:
                raise Exception("오디오 추출 실패")
            
            # Step 2: Demucs 보컬 분리 (CLI)
            if self.use_demucs:
                print(f"    🎤 보컬 분리 중 (Demucs)...")
                vocals_path, demucs_output_dir = self._separate_vocals_cli(audio_path)
                
                if vocals_path:
                    vocals_size = os.path.getsize(vocals_path)
                    print(f"    ✅ 보컬 분리 완료: {vocals_size / (1024*1024):.1f}MB")
                    
                    # Step 3: 보컬 에너지 체크
                    vocal_energy = self._check_vocal_energy(vocals_path)
                    print(f"    🔊 보컬 에너지: {vocal_energy:.4f} (임계값: {self.vocal_energy_threshold})")
                    
                    if vocal_energy < self.vocal_energy_threshold:
                        print(f"    🔇 음성 없음 감지 - BGM only 영상")
                        return {
                            "segments": [],
                            "full_text": "",
                            "duration": duration,
                            "detected_duration": None,
                            "is_hallucination": False,
                            "no_speech": True,
                            "vocal_energy": vocal_energy
                        }
                    
                    transcribe_path = vocals_path
                else:
                    print(f"    ⚠️ 보컬 분리 실패, 원본 사용")
                    transcribe_path = audio_path
            else:
                transcribe_path = audio_path
            
            # Step 4: Whisper 전사
            print(f"    📝 Whisper 전사 중...")
            result = self._transcribe(transcribe_path)
            
            # Step 5: 환각 감지
            is_hallucination, reason = self._is_likely_hallucination(result, duration)
            if is_hallucination:
                print(f"    🚨 환각 감지됨 - {reason}")
                result = {
                    "segments": [],
                    "full_text": "",
                    "detected_duration": result.get('detected_duration'),
                    "is_hallucination": True,
                    "hallucination_reason": reason
                }
            else:
                result["is_hallucination"] = False
            
            result['duration'] = duration
            result['no_speech'] = False
            
            return result
            
        finally:
            # 임시 파일 정리
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)
            if demucs_output_dir and os.path.exists(demucs_output_dir):
                shutil.rmtree(demucs_output_dir, ignore_errors=True)
    
    def _separate_vocals_cli(self, audio_path: str) -> tuple:
        """
        Demucs CLI로 보컬 분리 (python -m 방식)
        Returns: (vocals_path, output_dir) or (None, None)
        """
        try:
            # 임시 출력 디렉토리 (영어 경로 사용)
            output_dir = tempfile.mkdtemp(prefix="demucs_")
            
            # Demucs CLI 실행 (python -m 방식)
            cmd = [
                sys.executable, '-m', 'demucs.separate',
                '--two-stems', 'vocals',  # vocals와 no_vocals만 분리
                '-n', 'htdemucs',          # 모델
                '-o', output_dir,          # 출력 디렉토리
                '--mp3',                   # MP3로 출력 (용량 절약)
                '--mp3-bitrate', '128',
                audio_path
            ]
            
            print(f"    🔄 Demucs 실행 중... (1-2분 소요)")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5분 타임아웃
            )
            
            if result.returncode != 0:
                print(f"    ❌ Demucs 에러: {result.stderr[:200]}")
                return None, None
            
            # 출력 파일 찾기
            # 구조: output_dir/htdemucs/track_name/vocals.mp3
            audio_name = os.path.splitext(os.path.basename(audio_path))[0]
            vocals_path = os.path.join(output_dir, 'htdemucs', audio_name, 'vocals.mp3')
            
            if os.path.exists(vocals_path):
                return vocals_path, output_dir
            
            # 다른 경로 시도 (wav 확장자)
            vocals_wav = os.path.join(output_dir, 'htdemucs', audio_name, 'vocals.wav')
            if os.path.exists(vocals_wav):
                return vocals_wav, output_dir
            
            print(f"    ❌ 보컬 파일을 찾을 수 없음")
            # 디버깅: 출력 디렉토리 구조 확인
            for root, dirs, files in os.walk(output_dir):
                for f in files:
                    print(f"    📄 {os.path.join(root, f)}")
            return None, None
            
        except subprocess.TimeoutExpired:
            print(f"    ❌ Demucs 타임아웃 (5분 초과)")
            return None, None
        except Exception as e:
            print(f"    ❌ Demucs 에러: {e}")
            return None, None
    
    def _check_vocal_energy(self, audio_path: str) -> float:
        """
        오디오 파일의 RMS(Root Mean Square) 에너지 계산
        낮은 값 = 음성 없음 (BGM only)
        """
        try:
            # ffmpeg로 WAV 변환 후 분석 (MP3 직접 분석 어려움)
            temp_wav = tempfile.mktemp(suffix='.wav')
            
            cmd = [
                'ffmpeg', '-i', audio_path,
                '-ar', '16000',  # 16kHz
                '-ac', '1',      # 모노
                '-y',
                temp_wav
            ]
            
            subprocess.run(cmd, capture_output=True, timeout=30)
            
            if not os.path.exists(temp_wav):
                return 1.0  # 변환 실패시 기본값 (음성 있음으로 처리)
            
            # WAV 파일 읽기
            try:
                with wave.open(temp_wav, 'rb') as wav:
                    n_frames = wav.getnframes()
                    n_channels = wav.getnchannels()
                    sample_width = wav.getsampwidth()
                    
                    # 샘플 읽기
                    frames = wav.readframes(n_frames)
                    
                    # 16bit PCM 가정
                    if sample_width == 2:
                        fmt = f'<{n_frames * n_channels}h'
                        samples = struct.unpack(fmt, frames)
                        
                        # RMS 계산
                        sum_squares = sum(s * s for s in samples)
                        rms = math.sqrt(sum_squares / len(samples)) / 32768.0  # 정규화
                        
                        return rms
            finally:
                if os.path.exists(temp_wav):
                    os.remove(temp_wav)
            
            return 1.0  # 기본값
            
        except Exception as e:
            print(f"    ⚠️ 에너지 체크 실패: {e}")
            return 1.0  # 실패시 음성 있음으로 처리
    
    def _is_likely_hallucination(self, result: dict, duration: float = None) -> tuple:
        """환각 감지"""
        segments = result.get('segments', [])
        full_text = result.get('full_text', '')
        
        if not full_text or len(full_text.strip()) < 5:
            return False, ""
        
        hallucination_score = 0
        reasons = []
        
        # 1. 이모지 검사
        emojis = self.emoji_pattern.findall(full_text)
        non_emoji_text = self.emoji_pattern.sub('', full_text).strip()
        
        if len(emojis) >= 3:
            if len(non_emoji_text) < 20:
                hallucination_score += 60
                reasons.append(f"이모지만 있음: {len(emojis)}개")
            else:
                hallucination_score += 30
                reasons.append(f"이모지 다수: {len(emojis)}개")
        
        # 2. 외국어 섞임
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', full_text))
        japanese_chars = len(re.findall(r'[\u3040-\u30ff]', full_text))
        thai_chars = len(re.findall(r'[\u0e00-\u0e7f]', full_text))
        russian_chars = len(re.findall(r'[\u0400-\u04ff]', full_text))
        
        foreign_chars = chinese_chars + japanese_chars + thai_chars + russian_chars
        if foreign_chars > 0:
            hallucination_score += 40
            reasons.append(f"외국어 섞임: {foreign_chars}자")
        
        # 3. 한영 혼합 단어
        korean_english_mixed = re.findall(r'[가-힣]+[a-zA-Z]+|[a-zA-Z]+[가-힣]+', full_text)
        if korean_english_mixed:
            hallucination_score += 35
            reasons.append(f"한영 혼합: {korean_english_mixed[:3]}")
        
        # 4. 환각 패턴
        found_patterns = [p for p in self.hallucination_patterns if p.lower() in full_text.lower()]
        if found_patterns:
            hallucination_score += 25
            reasons.append(f"환각 패턴: {found_patterns[:3]}")
        
        # 5. 단어 반복
        words = full_text.split()
        if len(words) >= 5:
            word_counts = {}
            for w in words:
                clean = self.emoji_pattern.sub('', w).strip()
                if clean:
                    word_counts[clean] = word_counts.get(clean, 0) + 1
            
            if word_counts:
                max_word = max(word_counts, key=word_counts.get)
                max_repeat = word_counts[max_word]
                
                if max_repeat >= 5 and max_repeat / len(words) >= 0.15:
                    hallucination_score += 40
                    reasons.append(f"단어 반복: '{max_word}' {max_repeat}회")
                
                if max_repeat >= 10:
                    hallucination_score += 30
                    reasons.append(f"심각한 반복: {max_repeat}회")
        
        # 6. 세그먼트 반복
        if len(segments) >= 5:
            seg_texts = [s.get('text', '').strip() for s in segments]
            seg_counts = {}
            for t in seg_texts:
                if t:
                    seg_counts[t] = seg_counts.get(t, 0) + 1
            
            if seg_counts:
                max_seg = max(seg_counts, key=seg_counts.get)
                max_seg_repeat = seg_counts[max_seg]
                
                if max_seg_repeat >= 5:
                    hallucination_score += 50
                    reasons.append(f"세그먼트 반복: '{max_seg}' {max_seg_repeat}회")
        
        # 7. 단일 문자/숫자 나열
        single_chars = re.findall(r'\b[0-9]\b|\b[ㄱ-ㅎㅏ-ㅣ]\b|\b[a-zA-Z]\b', full_text)
        if len(single_chars) >= 10:
            hallucination_score += 35
            reasons.append(f"단일 문자 나열: {len(single_chars)}개")
        
        # 8. 맥락 없는 영어
        english_words = re.findall(r'\b[a-zA-Z]{3,}\b', full_text)
        if english_words:
            cooking_english = ['sauce', 'chicken', 'cheese', 'cream', 'butter', 'oil', 'salt', 'sugar']
            non_cooking = [w for w in english_words if w.lower() not in cooking_english]
            
            if len(non_cooking) >= 3:
                hallucination_score += 30
                reasons.append(f"맥락 없는 영어: {non_cooking[:5]}")
        
        is_hallucination = hallucination_score >= 40
        
        if reasons:
            print(f"    🔍 환각 검사: 점수={hallucination_score}, 이유={reasons}")
        
        return is_hallucination, ", ".join(reasons)
    
    def _get_duration(self, file_path: str) -> float:
        """ffprobe로 영상 길이 추출"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet',
                '-print_format', 'json',
                '-show_format', file_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                duration = float(data.get('format', {}).get('duration', 0))
                return round(duration, 2)
            return None
        except:
            return None
    
    def _extract_audio(self, video_path: str) -> str:
        """ffmpeg로 오디오 추출"""
        temp_dir = tempfile.gettempdir()
        audio_path = os.path.join(temp_dir, 'naos_audio_temp.mp3')
        
        try:
            cmd = [
                'ffmpeg', '-i', video_path,
                '-vn', '-acodec', 'libmp3lame',
                '-ab', '128k', '-ar', '44100', '-ac', '2',
                '-y', audio_path
            ]
            result = subprocess.run(cmd, capture_output=True, timeout=120)
            
            if result.returncode == 0 and os.path.exists(audio_path):
                return audio_path
            return None
        except:
            return None
    
    def _transcribe(self, file_path: str) -> dict:
        """Whisper API 호출"""
        file_size = os.path.getsize(file_path)
        if file_size > 25 * 1024 * 1024:
            print(f"    ⚠️ 파일이 25MB 초과, 압축 중...")
            compressed = self._compress_audio(file_path)
            if compressed:
                file_path = compressed
        
        with open(file_path, 'rb') as f:
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                language="ko",
                timestamp_granularities=["segment"]
            )
        
        segments = []
        if hasattr(response, 'segments') and response.segments:
            for idx, seg in enumerate(response.segments):
                segments.append({
                    "index": idx,
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip()
                })
        
        detected_duration = segments[-1].get('end') if segments else None
        
        return {
            "segments": segments,
            "full_text": response.text.strip() if hasattr(response, 'text') else "",
            "detected_duration": detected_duration
        }
    
    def _compress_audio(self, audio_path: str) -> str:
        """오디오 압축"""
        temp_dir = tempfile.gettempdir()
        compressed = os.path.join(temp_dir, 'naos_compressed_temp.mp3')
        
        try:
            cmd = [
                'ffmpeg', '-i', audio_path,
                '-acodec', 'libmp3lame',
                '-ab', '64k', '-ar', '16000', '-ac', '1',
                '-y', compressed
            ]
            result = subprocess.run(cmd, capture_output=True, timeout=60)
            
            if result.returncode == 0 and os.path.exists(compressed):
                return compressed
            return None
        except:
            return None
    
    def _get_suffix(self, filename: str) -> str:
        if filename and '.' in filename:
            return '.' + filename.rsplit('.', 1)[1].lower()
        return '.mp4'
    
    def _get_suffix_from_url(self, url: str) -> str:
        path = url.split('?')[0]
        if '.' in path:
            return '.' + path.rsplit('.', 1)[1].lower()
        return '.mp4'
