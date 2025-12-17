/**
 * 미디어 업로드 API
 * 위치: src/features/upload/api/uploadMedia.ts
 * 
 * S3 Presigned URL을 통한 직접 업로드
 */

import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
} from "../types/upload.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

/**
 * Presigned URL 발급 요청
 */
export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  token?: string
): Promise<PresignedUrlResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/media/presigned-url`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fileName,
      contentType,
    } as PresignedUrlRequest),
  });

  if (!response.ok) {
    throw new Error(`Presigned URL 발급 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * Presigned URL로 파일 직접 업로드
 */
export async function uploadFileToS3(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`업로드 실패: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("네트워크 오류"));
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

/**
 * 비디오 업로드 (Presigned URL 발급 + S3 업로드)
 */
export async function uploadVideo(
  file: File,
  token?: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 1. Presigned URL 발급
  const { uploadUrl, fileUrl } = await getPresignedUrl(
    file.name,
    file.type,
    token
  );

  // 2. S3에 직접 업로드
  await uploadFileToS3(uploadUrl, file, onProgress);

  // 3. 최종 파일 URL 반환
  return fileUrl;
}

/**
 * 썸네일 이미지 업로드
 */
export async function uploadThumbnail(
  blob: Blob,
  fileName: string,
  token?: string
): Promise<string> {
  const file = new File([blob], fileName, { type: "image/jpeg" });

  const { uploadUrl, fileUrl } = await getPresignedUrl(
    fileName,
    "image/jpeg",
    token
  );

  await uploadFileToS3(uploadUrl, file);

  return fileUrl;
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
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context 생성 실패"));
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
            reject(new Error("Blob 생성 실패"));
          }
        },
        "image/jpeg",
        0.9
      );
    };

    video.onerror = () => {
      reject(new Error("비디오 시크 실패"));
    };
  });
}
