package com.moni.naos.domain.ai.dto;

import lombok.*;

/**
 * AI 작업 생성 요청 DTO
 * - kind: "RECIPE_SUMMARY" | "SCRIPT_GENERATE" | ...
 * - payload: 프롬프트/파라미터 JSON 문자열
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiJobRequest {
    private String kind;
    private String payload; // JSON string
}
