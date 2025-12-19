'use client';

/**
 * 레시피 업로드 페이지
 * 위치: src/app/(main)/upload/page.tsx
 *
 * 업로드 플로우:
 * 1. upload: 파일 선택
 * 2. (비디오인 경우) Whisper STT 호출 → 전사
 * 3. clipping: 비디오 클립 분할
 * 4. thumbnail: 썸네일 선택
 * 5. details: 레시피 상세 정보 입력
 * 
 * 수정사항:
 * - Whisper STT 호출 연동 추가
 * - 로딩 상태 추가
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import VideoUploadStep from '@/features/upload/components/VideoUploadStep';
import ClippingStep from '@/features/upload/components/ClippingStep';
import ThumbnailSelectorStep from '@/features/upload/components/ThumbnailSelectorStep';
import RecipeDetailsStep from '@/features/upload/components/RecipeDetailsStep';
import { transcribeVideo } from '@/features/upload/api/transcribeVideo';

import type {
  UploadStep,
  VideoClip,
  TranscriptionSegment,
  ScriptSegment,
} from '@/features/upload/types/upload.types';

export default function UploadPage() {
  // 현재 스텝
  const [step, setStep] = useState<UploadStep>('upload');

  // 파일 관련
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // 클리핑 관련
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [hasAudio, setHasAudio] = useState(true);
  const [transcriptionSegments, setTranscriptionSegments] = useState<
    TranscriptionSegment[]
  >([]);

  // 썸네일 관련
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);

  // 로딩 상태 (STT 처리 중)
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  // ===== Step 1: Upload =====

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setTranscribeError(null);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl('');
    setStep('upload');
    setClips([]);
    setHasAudio(true);
    setTranscriptionSegments([]);
    setThumbnailBlob(null);
    setTranscribeError(null);
  };

  const handleUploadNext = async () => {
    if (!file) return;

    // 비디오: Whisper STT 호출 → 클리핑 스텝
    // 이미지: 바로 details 스텝 (클리핑/썸네일 불필요)
    if (file.type.startsWith('video')) {
      setIsTranscribing(true);
      setTranscribeError(null);

      try {
        // ⭐ Flask Whisper STT 호출
        const result = await transcribeVideo(file);
        
        setHasAudio(result.hasAudio);
        setTranscriptionSegments(result.segments);

        if (result.hasAudio && result.segments.length > 0) {
          console.log(`✅ 전사 완료: ${result.segments.length}개 세그먼트`);
        } else {
          console.log('ℹ️ 음성이 감지되지 않음, 수동 입력 필요');
        }
      } catch (error) {
        console.warn('⚠️ STT 실패, 수동 입력으로 진행:', error);
        setHasAudio(false);
        setTranscriptionSegments([]);
        setTranscribeError('음성 인식에 실패했습니다. 텍스트를 직접 입력해주세요.');
      } finally {
        setIsTranscribing(false);
      }

      setStep('clipping');
    } else {
      // 이미지는 클리핑/썸네일 선택 불필요
      setStep('details');
    }
  };

  // ===== Step 2: Clipping =====

  const handleClippingBack = () => {
    setStep('upload');
  };

  const handleClippingNext = (editedClips: VideoClip[]) => {
    setClips(editedClips);
    setStep('thumbnail');
  };

  // ===== Step 3: Thumbnail =====

  const handleThumbnailBack = () => {
    if (file?.type.startsWith('video')) {
      setStep('clipping');
    } else {
      setStep('upload');
    }
  };

  const handleThumbnailNext = (selectedTime: number, blob: Blob) => {
    setThumbnailTime(selectedTime);
    setThumbnailBlob(blob);
    setStep('details');
  };

  // ===== Step 4: Details =====

  const handleDetailsBack = () => {
    if (file?.type.startsWith('video')) {
      setStep('thumbnail');
    } else {
      setStep('upload');
    }
  };

  // clips → segments 변환 (RecipeDetailsStep용)
  const segments: ScriptSegment[] = clips.map((clip) => ({
    id: clip.id,
    text: clip.text,
    startTime: clip.startTime,
    endTime: clip.endTime,
  }));

  // ===== Render =====

  // 전사 처리 중 로딩 화면
  if (isTranscribing) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="bg-card rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold">음성 인식 중...</h1>
            <p className="text-muted-foreground mt-1">
              Whisper AI가 영상의 음성을 분석하고 있습니다
            </p>
          </div>
          <div className="p-12 flex flex-col items-center justify-center gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">영상 분석 중</p>
              <p className="text-sm text-muted-foreground">
                영상 길이에 따라 1~3분 정도 소요될 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'upload') {
    return (
      <>
        <VideoUploadStep
          file={file}
          previewUrl={previewUrl}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          onNext={handleUploadNext}
        />
        {/* STT 에러 표시 */}
        {transcribeError && (
          <div className="container max-w-2xl mx-auto px-4 mt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
              ⚠️ {transcribeError}
            </div>
          </div>
        )}
      </>
    );
  }

  if (step === 'clipping') {
    return (
      <ClippingStep
        file={file}
        previewUrl={previewUrl}
        transcriptionSegments={transcriptionSegments}
        hasAudio={hasAudio}
        onBack={handleClippingBack}
        onNext={handleClippingNext}
      />
    );
  }

  if (step === 'thumbnail') {
    return (
      <ThumbnailSelectorStep
        file={file}
        previewUrl={previewUrl}
        onBack={handleThumbnailBack}
        onNext={handleThumbnailNext}
      />
    );
  }

  // step === "details"
  return (
    <RecipeDetailsStep
      file={file}
      previewUrl={previewUrl}
      segments={segments}
      thumbnailTime={thumbnailTime}
      thumbnailBlob={thumbnailBlob}
      onBack={handleDetailsBack}
    />
  );
}
