/**
 * 미디어 업로드 API
 * 위치: src/features/upload/api/uploadMedia.ts
 *
 * BE MediaController 경로에 맞게 수정:
 * - POST /api/media/presigned-url/video?fileName=...&contentType=...
 * - POST /api/media/presigned-url/thumbnail?fileName=...&contentType=...
 * - POST /api/media/presigned-url/image?fileName=...&contentType=...
 */

import { authFetch } from '@/lib/auth';
import type { PresignedUrlResponse } from '../types/upload.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

/**
 * 영상 Presigned URL 발급
 * BE: POST /api/media/presigned-url/video
 */
export async function getVideoPresignedUrl(
  fileName: string,
  contentType: string = 'video/mp4'
): Promise<PresignedUrlResponse> {
  const params = new URLSearchParams({ fileName, contentType });

  const response = await authFetch(
    `${API_BASE_URL}/api/media/presigned-url/video?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `영상 Presigned URL 발급 실패: ${response.status} - ${error}`
    );
  }

  return response.json();
}

/**
 * 썸네일 Presigned URL 발급
 * BE: POST /api/media/presigned-url/thumbnail
 */
export async function getThumbnailPresignedUrl(
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<PresignedUrlResponse> {
  const params = new URLSearchParams({ fileName, contentType });

  const response = await authFetch(
    `${API_BASE_URL}/api/media/presigned-url/thumbnail?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `썸네일 Presigned URL 발급 실패: ${response.status} - ${error}`
    );
  }

  return response.json();
}

/**
 * 이미지 Presigned URL 발급
 * BE: POST /api/media/presigned-url/image
 */
export async function getImagePresignedUrl(
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<PresignedUrlResponse> {
  const params = new URLSearchParams({ fileName, contentType });

  const response = await authFetch(
    `${API_BASE_URL}/api/media/presigned-url/image?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `이미지 Presigned URL 발급 실패: ${response.status} - ${error}`
    );
  }

  return response.json();
}

/**
 * Presigned URL로 파일 직접 업로드 (S3)
 * ⚠️ 수정: Content-Type 헤더 제거 (CORS preflight 문제 해결)
 */
export async function uploadFileToS3(
  presignedUrl: string,
  file: File | Blob,
  _contentType?: string, // 더 이상 사용하지 않음
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 업로드 실패: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('네트워크 오류'));
    });

    xhr.open('PUT', presignedUrl);
    // Content-Type 헤더 제거: Presigned URL 서명과 불일치 방지
    xhr.send(file);
  });
}

/**
 * 비디오 업로드 (Presigned URL 발급 + S3 업로드)
 */
export async function uploadVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const contentType = file.type || 'video/mp4';

  // 1. Presigned URL 발급
  const { uploadUrl, publicUrl } = await getVideoPresignedUrl(
    file.name,
    contentType
  );

  // 2. S3에 직접 업로드
  await uploadFileToS3(uploadUrl, file, contentType, onProgress);

  // 3. 최종 파일 URL 반환
  return publicUrl;
}

/**
 * 썸네일 업로드
 */
export async function uploadThumbnail(
  blob: Blob,
  fileName: string
): Promise<string> {
  const contentType = 'image/jpeg';

  // 1. Presigned URL 발급
  const { uploadUrl, publicUrl } = await getThumbnailPresignedUrl(
    fileName,
    contentType
  );

  // 2. S3에 직접 업로드
  await uploadFileToS3(uploadUrl, blob, contentType);

  // 3. 최종 파일 URL 반환
  return publicUrl;
}

/**
 * 이미지 업로드
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const contentType = file.type || 'image/jpeg';

  // 1. Presigned URL 발급
  const { uploadUrl, publicUrl } = await getImagePresignedUrl(
    file.name,
    contentType
  );

  // 2. S3에 직접 업로드
  await uploadFileToS3(uploadUrl, file, contentType, onProgress);

  // 3. 최종 파일 URL 반환
  return publicUrl;
}

/**
 * 업로드 완료 콜백 (DB 저장)
 * BE: POST /api/media/complete
 */
export async function completeUpload(
  recipeId: number,
  type: 'VIDEO' | 'THUMB',
  url: string
): Promise<void> {
  const params = new URLSearchParams({
    recipeId: recipeId.toString(),
    type,
    url,
  });

  const response = await authFetch(
    `${API_BASE_URL}/api/media/complete?${params.toString()}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error(`업로드 완료 처리 실패: ${response.status}`);
  }
}

/**
 * 비디오에서 썸네일 캡처
 */
export function captureThumbnailFromVideo(
  video: HTMLVideoElement,
  time: number,
  width: number = 640,
  height: number = 360
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context 생성 실패'));
      return;
    }

    const originalTime = video.currentTime;
    video.currentTime = time;

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, width, height);
      video.currentTime = originalTime;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob 생성 실패'));
          }
        },
        'image/jpeg',
        0.9
      );
    };

    video.onerror = () => {
      reject(new Error('비디오 시크 실패'));
    };
  });
}

/**
 * 하위 호환용 (기존 코드에서 사용)
 */
export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  _token?: string
): Promise<PresignedUrlResponse> {
  if (contentType.startsWith('video')) {
    return getVideoPresignedUrl(fileName, contentType);
  } else {
    return getImagePresignedUrl(fileName, contentType);
  }
}
