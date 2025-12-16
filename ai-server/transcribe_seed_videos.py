"""
NAOS 시드 영상 일괄 전사 스크립트 (v2)

변경사항:
- Flask 새 응답 형식 (index, duration 필드)
- Spring 저장 옵션 추가
- 결과를 Spring TranscriptController로 전송 가능

실행 전 확인:
1. Flask 서버가 localhost:5000에서 실행 중인지 확인 (python app.py)
2. .env에 OpenAI API 키가 설정되어 있는지 확인

실행:
python transcribe_seed_videos.py              # 전사만
python transcribe_seed_videos.py --save       # 전사 + Spring 저장
"""

import requests
import json
import time
import argparse

# 서버 주소
FLASK_URL = "http://localhost:5000"
SPRING_URL = "http://localhost:8080"

# S3 영상 URL 목록 (RecipeDataInitializer와 동일한 순서)
VIDEO_DATA = [
    {"index": 0, "recipeId": 1, "name": "-12kg 유지어터의 존맛 다이어트 레시피 모음", "category": "LOSS",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/-12kg+%EC%9C%A0%EC%A7%80%EC%96%B4%ED%84%B0%EC%9D%98+%EC%A1%B4%EB%A7%9B+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EB%A0%88%EC%8B%9C%ED%94%BC+%EB%AA%A8%EC%9D%8Czip.mp4"},
    
    {"index": 1, "recipeId": 2, "name": "슬라이스 치즈 과자", "category": "SNACK",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%5B%EC%B4%88%EA%B0%84%EB%8B%A8+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D+%EB%A0%88%EC%8B%9C%ED%94%BC%5D+__+%EC%8A%AC%EB%9D%BC%EC%9D%B4%EC%8A%A4+%EC%B9%98%EC%A6%88+%EA%B3%BC%EC%9E%90+%EB%A7%8C%EB%93%A4%EA%B8%B0+2%EB%B6%84%EC%9D%B4%EB%A9%B4+%EB%81%9D.mp4"},
    
    {"index": 2, "recipeId": 3, "name": "바나나 통깨 쿠키", "category": "SNACK",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%F0%9F%8D%8C%EB%B0%94%EB%82%98%EB%82%98%EC%99%80+%ED%86%B5%EA%B9%A8%EB%A1%9C+%EB%A7%8C%EB%93%9C%EB%8A%94+%EC%BF%A0%ED%82%A4+_+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D+%EB%A0%88%EC%8B%9C%ED%94%BC+_+%EA%B7%B8%EB%A6%AD%EC%9A%94%EA%B1%B0%ED%8A%B8+%EC%B4%88%EC%BD%94%ED%95%84%EB%A7%81.mp4"},
    
    {"index": 3, "recipeId": 4, "name": "벌크업 식단", "category": "GAIN",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EA%B0%84%ED%8E%B8%ED%95%98%EA%B3%A0+%EB%A7%9B%EC%9E%88%EB%8A%94+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%8B%9D%EB%8B%A8+%EB%A7%8C%EB%93%A4%EA%B8%B0+%ED%8C%81!+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%8B%9D%EB%8B%A8%2C+%EB%B2%8C%ED%81%AC%EC%97%85+%EC%8B%9D%EB%8B%A8.mp4"},
    
    {"index": 4, "recipeId": 5, "name": "남궁민 벌크업", "category": "GAIN",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%82%A8%EA%B6%81%EB%AF%BC+%EB%B0%B0%EC%9A%B0%EC%9D%98+%EB%B2%8C%ED%81%AC%EC%97%85+%EC%8B%9D%EB%8B%A8+%EB%94%B0%EB%9D%BC%ED%95%B4%EB%B3%B4%EA%B8%B0.mp4"},
    
    {"index": 5, "recipeId": 6, "name": "야채수프", "category": "LOSS",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%82%B4+%EB%AA%B8%EC%9D%84+%ED%95%B4%EB%8F%85%ED%95%98%EB%8A%94+%EA%B1%B4%EA%B0%95%ED%95%9C+'%EC%95%BC%EC%B1%84%EC%88%98%ED%94%84'+%EB%A0%88%EC%8B%9C%ED%94%BC+%EB%8C%80%EA%B3%B5%EA%B0%9C!.mp4"},
    
    {"index": 6, "recipeId": 7, "name": "샐러드 레시피", "category": "BALANCE",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EB%90%98%EB%8A%94+%EB%8B%B9%EB%87%A8+%ED%98%88%EB%8B%B9+%EA%B4%80%EB%A6%AC+%EB%8F%84%EC%8B%9C%EB%9D%BD+%F0%9F%92%95+%EC%83%90%EB%9F%AC%EB%93%9C+%EB%A0%88%EC%8B%9C%ED%94%BC+3%EA%B0%80%EC%A7%80.mp4"},
    
    {"index": 7, "recipeId": 8, "name": "병아리콩 과자", "category": "SNACK",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8%EA%B0%84%EC%8B%9D%26%EC%A0%80%EC%86%8D%EB%85%B8%ED%99%94%EA%B3%BC%EC%9E%90%2C+%EB%B3%91%EC%95%84%EB%A6%AC%EC%BD%A9+%EA%B3%BC%EC%9E%90+%EB%A0%88%EC%8B%9C%ED%94%BC%2C+%EB%A7%A4%EC%9D%BC+%EB%A7%8C%EB%93%A4%EC%96%B4+%EB%A8%B9%EC%96%B4%EC%9A%94+%23%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8%EB%A0%88%EC%8B%9C%ED%94%BC+%23%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8%EA%B0%84%EC%8B%9D+%23%EB%B3%91%EC%95%84%EB%A6%AC%EC%BD%A9%EA%B3%BC%EC%9E%90.mp4"},
    
    {"index": 8, "recipeId": 9, "name": "오트밀 쑥떡", "category": "SNACK",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%8C%80%EB%B0%95%E2%80%BC%EF%B8%8F%EC%9D%B4%EB%96%A1%EC%9D%80+%EC%82%B4+%EC%95%88%EC%AA%84%EC%9A%94!++'%EC%A3%84%EC%B1%85%EA%B0%90+%EC%A0%9C%EB%A1%9C+%EB%96%A1'+%EB%A0%88%EC%8B%9C%ED%94%BC+(%EC%84%A4%ED%83%95X+%EC%8C%80X+%EC%B4%88%EA%B0%84%EB%8B%A8+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D%2C+%EC%98%A4%ED%8A%B8%EB%B0%80+%EC%91%A5%EB%96%A1+%EB%A8%B9%EA%B3%A0+%EC%91%A5%EB%9D%BC%EB%96%BC+%EB%A7%88%EC%8B%9C%EA%B8%B0).mp4"},
    
    {"index": 9, "recipeId": 10, "name": "두부 다이어트", "category": "LOSS",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%91%90%EB%B6%80%EB%A1%9C+6%EC%9D%BC+-5kg%F0%9F%AB%A2+7%EA%B0%80%EC%A7%80+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EB%A0%88%EC%8B%9C%ED%94%BC.mp4"},
    
    {"index": 10, "recipeId": 11, "name": "고구마빵", "category": "BALANCE",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%B0%80%EA%B0%80%EB%A3%A8%EB%B9%B5+%EB%A8%B9%EC%A7%80%EB%A7%90%EA%B3%A0+%EA%B3%A0%EA%B5%AC%EB%A7%88%EB%9E%91+%EA%B3%84%EB%9E%80%EB%A7%8C+%EC%A4%80%EB%B9%84%ED%95%98%EC%84%B8%EC%9A%94!+%EC%86%8D%ED%8E%B8%ED%95%98%EA%B2%8C+%EB%B1%83%EC%82%B4+%EC%8F%99+%EB%B9%A0%EC%A7%80%EB%8A%94+%EC%B4%88%EA%B0%84%EB%8B%A8+%EB%85%B8%EB%B0%80%EA%B0%80%EB%A3%A8+%EB%AC%B4%EC%84%A4%ED%83%95+%EA%B3%A0%EA%B5%AC%EB%A7%88%EB%B9%B5.mp4"},
    
    {"index": 11, "recipeId": 12, "name": "바나나 오트밀빵", "category": "SNACK",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%B0%94%EB%82%98%EB%82%981%EA%B0%9C%EB%A1%9C+%EB%A7%8C%EB%93%A0+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%98%A4%ED%8A%B8%EB%B0%80%EB%B9%B5+%EB%A0%88%EC%8B%9C%ED%94%BC!+%EB%B0%80%EA%B0%80%EB%A3%A8%EC%97%86%EC%9D%B4+%EA%B1%B4%EA%B0%95%ED%95%9C+%EA%B0%84%EC%8B%9D%EC%B6%94%EC%B2%9C!+(%EC%A2%85%EC%9D%B4%EC%BB%B5%EA%B3%84%EB%9F%89).mp4"},
    
    {"index": 12, "recipeId": 13, "name": "저당 프로틴바", "category": "GAIN",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EB%B3%B8%EA%B2%A9+%EC%97%AC%EB%A6%84%EB%A7%9E%EC%9D%B4%F0%9F%92%AA%F0%9F%8F%BB+%EC%A0%80%EB%8B%B9+%ED%94%84%EB%A1%9C%ED%8B%B4%EB%B0%94+%EB%A7%8C%EB%93%A4%EA%B8%B0+_+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B0%84%EC%8B%9D+%EB%A0%88%EC%8B%9C%ED%94%BC.mp4"},
    
    {"index": 13, "recipeId": 14, "name": "포케 레시피", "category": "GAIN",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EC%82%B4+%EC%89%BD%EA%B2%8C+%EB%B9%BC%EC%A3%BC%EB%8A%94+5%EA%B0%80%EC%A7%80+%ED%8F%AC%EC%BC%80+%EB%A0%88%EC%8B%9C%ED%94%BC%2C+4%EA%B0%80%EC%A7%80+%EC%86%8C%EC%8A%A4%2C+%EB%B0%80%ED%94%84%EB%9E%A9+%EB%A7%8C%EB%93%A4%EA%B8%B0%2C+%EB%84%88%EB%AC%B4+%EB%A7%9B%EC%9E%88%EC%96%B4%EC%84%9C+%EB%B0%9C%EC%9A%B0%EA%B3%B5%EC%96%91+%ED%95%98%EA%B2%8C%EB%8F%BC%EC%9A%94%F0%9F%98%8D(%EC%97%B0%EC%96%B4%ED%8F%AC%EC%BC%80%2C+%EC%96%91%EB%85%90%EB%AA%A9%EC%82%B4%ED%8F%AC%EC%BC%80%2C+%EA%B0%88%EB%A6%AD%EC%83%88%EC%9A%B0%ED%8F%AC%EC%BC%80%2C+%EC%B0%B8%EC%B9%98%EB%A7%88%EC%9A%94%ED%8F%AC%EC%BC%80%2C+%EB%B3%B4%EC%BD%94%EC%B9%98%EB%8B%88%ED%8F%AC%EC%BC%80).mp4"},
    
    {"index": 14, "recipeId": 15, "name": "토마토 계란 요리", "category": "LOSS",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EC%95%84%EC%B9%A8+%EC%A0%80%EB%85%81%EC%9C%BC%EB%A1%9C+%EB%B0%A5%EB%8C%80%EC%8B%A0+%EB%A8%B9%EC%9C%BC%EB%A9%B4+%EC%82%B4%EB%B9%A0%EC%A7%80%EB%8A%94+%ED%86%A0%EB%A7%88%ED%86%A0%EC%99%80+%EA%B3%84%EB%9E%80+%EC%9A%94%EB%A6%AC+5%EA%B0%80%EC%A7%80+%E2%80%BC%EF%B8%8F+%EC%97%BC%EC%A6%9D%EC%9D%B4+%EC%A4%84%EC%96%B4%EB%93%A4%EA%B3%A0+%ED%98%88%EA%B4%80%EC%9D%B4+%EA%B1%B4%EA%B0%95%ED%95%B4%EC%A7%80%EB%8A%94+%EC%9A%94%EB%A6%AC%F0%9F%92%AF%F0%9F%91%8D%F0%9F%8F%BB.mp4"},
    
    {"index": 15, "recipeId": 16, "name": "양배추 두부", "category": "LOSS",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EC%96%91%EB%B0%B0%EC%B6%94%EC%99%80+%EB%91%90%EB%B6%80%EB%A5%BC+%EC%9D%B4%EB%A0%87%EA%B2%8C+%EB%A8%B9%EC%9C%BC%EB%A9%B4+%EC%82%B4%EB%8F%84+%EC%95%88%EC%B0%8C%EA%B3%A0+%EB%84%88%EB%AC%B4+%EB%A7%9B%EC%9E%88%EC%96%B4%EC%9A%94%F0%9F%91%8D%F0%9F%8F%BB.mp4"},
    
    {"index": 16, "recipeId": 17, "name": "원플레이트 밀", "category": "BALANCE",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EC%9D%98%EC%82%AC%EB%93%A4%EA%B3%BC+%EC%98%81%EC%96%91+%EC%A0%84%EB%AC%B8%EA%B0%80%EB%93%A4%EC%9D%B4+%EA%B6%8C%EC%9E%A5%ED%95%98%EB%8A%94+%EC%9B%90%ED%94%8C%EB%A0%88%EC%9D%B4%ED%8A%B8+%EB%B0%80.+%ED%95%9C+%EC%A0%91%EC%8B%9C%EB%A9%B4+%EC%B6%A9%EB%B6%84%ED%95%A9%EB%8B%88%EB%8B%A4.+%ED%98%88%EB%8B%B9+%EC%95%88%EC%A0%95+%2B+%ED%8F%AC%EB%A7%8C%EA%B0%90+%2B+%EA%B7%A0%ED%98%95%2B+%EB%A7%9B!+%EC%9D%B4%EB%A0%87%EA%B2%8C%EB%A7%8C+%EB%A8%B9%EC%96%B4%EB%8F%84+%EC%9E%90%EC%97%B0%EC%8A%A4%EB%9F%BD%EA%B2%8C+%EC%B2%B4%EC%A4%91+%EA%B0%90%EC%86%8C!.mp4"},
    
    {"index": 17, "recipeId": 18, "name": "고구마케이크", "category": "BALANCE",
     "url": "https://naos-media.s3.ap-northeast-2.amazonaws.com/videos/seed/%EC%9D%B8%EC%8A%A4%ED%83%80+60%EB%A7%8C%EB%B7%B0+%EB%A0%88%EC%8B%9C%ED%94%BC!!+%EB%8B%A8+4%EA%B0%80%EC%A7%80+%EC%9E%AC%EB%A3%8C%EB%A1%9C+%EB%A7%8C%EB%93%9C%EB%8A%94+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EA%B3%A0%EA%B5%AC%EB%A7%88%EC%BC%80%EC%9D%B4%ED%81%AC+%E3%85%A3+%EB%85%B8%EB%B0%80%EA%B0%80%EB%A3%A8+%EB%85%B8%EC%84%A4%ED%83%95+%EB%8B%A4%EC%9D%B4%EC%96%B4%ED%8A%B8+%EC%8B%9D%EB%8B%A8.mp4"}
]


def check_flask_server():
    """Flask 서버 상태 확인"""
    try:
        response = requests.get(f"{FLASK_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Flask 서버 연결 OK")
            print(f"   Demucs: {'활성화' if data.get('demucs_enabled') else '비활성화'}")
            return True
        return False
    except Exception as e:
        print(f"❌ Flask 서버 연결 실패: {e}")
        return False


def check_spring_server():
    """Spring 서버 상태 확인"""
    try:
        response = requests.get(f"{SPRING_URL}/actuator/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Spring 서버 연결 OK")
            return True
        return False
    except:
        try:
            # actuator 없으면 기본 경로
            response = requests.get(f"{SPRING_URL}/api/recipes", timeout=5)
            if response.status_code in [200, 401, 403]:
                print(f"✅ Spring 서버 연결 OK (actuator 없음)")
                return True
        except:
            pass
        print(f"⚠️ Spring 서버 연결 실패 (전사만 진행)")
        return False


def transcribe_only(video_url: str) -> dict:
    """
    Flask /api/whisper/transcribe 호출 (전사만)
    
    Response: {
        "fullText": "...",
        "segments": [{"index": 0, "start": 0.0, "end": 5.2, "text": "..."}],
        "language": "ko",
        "duration": 120.5,
        "processingTime": 3.5
    }
    """
    try:
        response = requests.post(
            f"{FLASK_URL}/api/whisper/transcribe",
            json={"videoUrl": video_url, "language": "ko"},
            timeout=600
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"  ❌ HTTP {response.status_code}: {response.text[:200]}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"  ⏰ 타임아웃 (10분 초과)")
        return None
    except Exception as e:
        print(f"  ❌ 예외: {e}")
        return None


def transcribe_and_save(recipe_id: int, video_url: str) -> dict:
    """
    Flask /api/whisper/transcribe-save 호출 (전사 + Spring 저장)
    """
    try:
        response = requests.post(
            f"{FLASK_URL}/api/whisper/transcribe-save",
            json={
                "videoUrl": video_url,
                "recipeId": recipe_id,
                "language": "ko",
                "springUrl": SPRING_URL
            },
            timeout=600
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"  ❌ HTTP {response.status_code}: {response.text[:200]}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"  ⏰ 타임아웃 (10분 초과)")
        return None
    except Exception as e:
        print(f"  ❌ 예외: {e}")
        return None


def save_to_spring(recipe_id: int, result: dict) -> bool:
    """
    Spring /api/transcripts/{recipeId} 호출 (직접 저장)
    """
    try:
        payload = {
            "fullText": result.get("fullText", ""),
            "segments": result.get("segments", []),
            "language": result.get("language", "ko"),
            "duration": result.get("duration")
        }
        
        response = requests.post(
            f"{SPRING_URL}/api/transcripts/{recipe_id}",
            json=payload,
            timeout=30
        )
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"  ⚠️ Spring 저장 실패: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='NAOS 시드 영상 일괄 전사')
    parser.add_argument('--save', action='store_true', help='Spring에 저장')
    parser.add_argument('--start', type=int, default=0, help='시작 인덱스')
    parser.add_argument('--end', type=int, default=18, help='종료 인덱스')
    args = parser.parse_args()
    
    print("=" * 70)
    print("🎬 NAOS 시드 영상 일괄 전사 v2")
    print("=" * 70)
    
    # 서버 상태 확인
    if not check_flask_server():
        print("\n❌ Flask 서버를 먼저 실행하세요: python app.py")
        return
    
    spring_ok = False
    if args.save:
        spring_ok = check_spring_server()
        if not spring_ok:
            print("⚠️ Spring 저장 없이 전사만 진행합니다.")
    
    print()
    videos = VIDEO_DATA[args.start:args.end]
    print(f"📋 전사할 영상: {len(videos)}개 (인덱스 {args.start}~{args.end-1})")
    print(f"📦 저장 모드: {'Spring 저장' if args.save and spring_ok else '로컬 JSON만'}")
    print()
    
    results = []
    total_start = time.time()
    
    for video in videos:
        idx = video["index"]
        recipe_id = video["recipeId"]
        name = video["name"]
        category = video["category"]
        url = video["url"]
        
        print(f"[{idx+1:2d}/18] [{category:7s}] {name}")
        print(f"        🔄 전사 중...")
        
        start_time = time.time()
        
        # 전사 실행
        if args.save and spring_ok:
            result = transcribe_and_save(recipe_id, url)
            saved = result.get("success", False) if result else False
        else:
            result = transcribe_only(url)
            saved = False
            
            # 별도로 Spring 저장 시도
            if result and args.save and spring_ok:
                saved = save_to_spring(recipe_id, result)
        
        elapsed = time.time() - start_time
        
        if result:
            segments = result.get("segments", [])
            full_text = result.get("fullText", "")
            duration = result.get("duration")
            processing_time = result.get("processingTime", 0)
            
            status = "✅"
            if args.save:
                status = "✅💾" if saved else "✅⚠️"
            
            print(f"        {status} 완료! {len(segments)}개 세그먼트, {duration or '?'}초, {processing_time}초 처리")
            
            results.append({
                "index": idx,
                "recipeId": recipe_id,
                "name": name,
                "category": category,
                "url": url,
                "segments": segments,
                "fullText": full_text,
                "duration": duration,
                "saved": saved,
                "success": True
            })
        else:
            print(f"        ❌ 실패!")
            results.append({
                "index": idx,
                "recipeId": recipe_id,
                "name": name,
                "category": category,
                "url": url,
                "segments": [],
                "fullText": "",
                "duration": None,
                "saved": False,
                "success": False
            })
        
        print()
        
        # API 레이트 리밋 방지
        if idx < len(VIDEO_DATA) - 1:
            time.sleep(2)
    
    total_elapsed = time.time() - total_start
    
    # 결과 저장
    output_file = "transcription_results_v2.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("=" * 70)
    print(f"✅ 전사 완료! 총 {total_elapsed/60:.1f}분 소요")
    print(f"📄 결과 저장: {output_file}")
    print("=" * 70)
    
    # 요약
    success_count = sum(1 for r in results if r.get("success"))
    saved_count = sum(1 for r in results if r.get("saved"))
    
    print(f"\n📊 전사 성공: {success_count}/{len(videos)}")
    if args.save:
        print(f"💾 Spring 저장: {saved_count}/{len(videos)}")
    
    # 실패 목록
    failed = [r["name"] for r in results if not r.get("success")]
    if failed:
        print(f"\n❌ 실패 목록:")
        for name in failed:
            print(f"   - {name}")


if __name__ == "__main__":
    main()
