package com.moni.naos.domain.recipe.dto;

import lombok.*;

/** 한 단계(세그먼트)의 텍스트 및 (선택) 타임코드 정보 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScriptSegmentRequest {
    private String instruction;   // 조리 지시문
    private Double startSec;      // 시작 초 (nullable)
    private Double endSec;        // 종료 초 (nullable)
}
