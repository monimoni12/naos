/**
 * Whisper STT API 호출
 * 위치: src/features/upload/api/transcribeVideo.ts
 * 
 * Flask AI 서버의 Whisper 전사 엔드포인트 호출
 */

import type { TranscriptionSegment } from "../types/upload.types";

// Flask AI 서버 URL
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:5000";

/**
 * STT 응답 타입 (Flask /api/stt 응답)
 */
export interface TranscribeResponse {
  success: boolean;
  segments: TranscriptionSegment[];
  full_text: string;
  duration?: number;
  detected_duration?: number;
  has_audio?: boolean;
  error?: string;
}

/**
 * Whisper 전사 응답 타입 (Flask /api/whisper/transcribe 응답)
 */
export interface WhisperTranscribeResponse {
  fullText: string;
  segments: Array<{
    index: number;
    start: number;
    end: number;
    text: string;
  }>;
  language: string;
  duration: number;
  processingTime: number;
}

/**
 * FE용 변환된 결과
 */
export interface TranscribeResult {
  hasAudio: boolean;
  segments: TranscriptionSegment[];
  fullText: string;
  duration: number;
}

/**
 * 비디오 파일을 Flask AI 서버에 업로드하여 전사
 * (파일 직접 업로드 방식 - 레거시 /api/stt 사용)
 */
export async function transcribeVideoFile(file: File): Promise<TranscribeResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${AI_API_URL}/api/stt`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`전사 요청 실패: ${response.status}`);
  }

  const data: TranscribeResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "전사 처리 실패");
  }

  // 세그먼트가 없거나 텍스트가 너무 짧으면 음성 없음으로 판단
  const hasAudio = data.segments.length > 0 && data.full_text.length >= 10;

  return {
    hasAudio,
    segments: data.segments.map((seg, index) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    })),
    fullText: data.full_text,
    duration: data.duration || data.detected_duration || 0,
  };
}

/**
 * S3 URL로 전사 요청
 * (URL 방식 - /api/whisper/transcribe 사용)
 */
export async function transcribeVideoUrl(
  videoUrl: string,
  language: string = "ko"
): Promise<TranscribeResult> {
  const response = await fetch(`${AI_API_URL}/api/whisper/transcribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      videoUrl,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error(`전사 요청 실패: ${response.status}`);
  }

  const data: WhisperTranscribeResponse = await response.json();

  // 세그먼트가 없거나 텍스트가 너무 짧으면 음성 없음으로 판단
  const hasAudio = data.segments.length > 0 && data.fullText.length >= 10;

  return {
    hasAudio,
    segments: data.segments.map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    })),
    fullText: data.fullText,
    duration: data.duration,
  };
}

/**
 * 비디오 전사 (파일 방식)
 * - 업로드 페이지에서 사용
 * - 파일을 직접 Flask에 전송
 */
export async function transcribeVideo(file: File): Promise<TranscribeResult> {
  try {
    return await transcribeVideoFile(file);
  } catch (error) {
    console.error("Whisper STT 실패:", error);
    // 실패 시 음성 없음으로 처리
    return {
      hasAudio: false,
      segments: [],
      fullText: "",
      duration: 0,
    };
  }
}

/**
 * 비디오 전사 + Spring 저장 (recipeId가 있는 경우)
 * - 레시피 생성 후 전사 결과를 DB에 저장
 */
export async function transcribeAndSave(
  videoUrl: string,
  recipeId: number,
  language: string = "ko"
): Promise<{
  success: boolean;
  segmentCount: number;
  error?: string;
}> {
  const response = await fetch(`${AI_API_URL}/api/whisper/transcribe-save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      videoUrl,
      recipeId,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error(`전사 저장 요청 실패: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: data.success,
    segmentCount: data.segmentCount || 0,
    error: data.error || data.reason,
  };
}
