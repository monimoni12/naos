package com.moni.naos.global.storage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * S3 Presigned URL 응답 DTO
 * - 클라이언트가 직접 S3에 업로드할 때 사용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignedUploadUrl {

    /** Presigned Upload URL */
    private String uploadUrl;

    /** 업로드 후 파일 접근 URL */
    private String fileUrl;

    /** S3 Key (경로) */
    private String key;

    /** 만료 시간 */
    private Instant expiresAt;

    /** 허용되는 Content-Type */
    private String contentType;

    /** 최대 파일 크기 (bytes) */
    private Long maxSize;
}
