'use client';

/**
 * 레시피 업로드 페이지
 * 위치: src/app/(main)/upload/page.tsx
 *
 * 업로드 플로우:
 * 1. upload: 파일 선택
 * 2. clipping: 비디오 클립 분할
 * 3. thumbnail: 썸네일 선택
 * 4. details: 레시피 상세 정보 입력
 */

import { useState } from 'react';

import VideoUploadStep from '@/features/upload/components/VideoUploadStep';
import ClippingStep from '@/features/upload/components/ClippingStep';
import ThumbnailSelectorStep from '@/features/upload/components/ThumbnailSelectorStep';
import RecipeDetailsStep from '@/features/upload/components/RecipeDetailsStep';

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

  // ===== Step 1: Upload =====

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
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
  };

  const handleUploadNext = async () => {
    if (!file) return;

    // 비디오: 클리핑 스텝으로
    // 이미지: 바로 썸네일 스텝으로 (이미지 자체가 썸네일)
    if (file.type.startsWith('video')) {
      // TODO: 실제로는 여기서 Whisper STT 호출해서
      // hasAudio와 transcriptionSegments 받아옴
      // 지금은 음성 없음으로 가정
      setHasAudio(false);
      setTranscriptionSegments([]);
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

  if (step === 'upload') {
    return (
      <VideoUploadStep
        file={file}
        previewUrl={previewUrl}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        onNext={handleUploadNext}
      />
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
