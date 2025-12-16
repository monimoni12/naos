package com.moni.naos.domain.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Whisper STT 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsrRequest {

    /** S3 영상 URL */
    private String videoUrl;

    /** 언어 코드 (ko, en 등) */
    @Builder.Default
    private String language = "ko";
}
