package com.moni.naos.domain.recipe.dto;

import lombok.*;

/**
 * S3 Presigned URL 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresignedUrlResponse {

    private String uploadUrl;   // PUT 요청 보낼 URL
    private String publicUrl;   // 업로드 후 접근 가능한 URL
    private String key;         // S3 Key
    private int expiresIn;      // 만료 시간 (초)
}
