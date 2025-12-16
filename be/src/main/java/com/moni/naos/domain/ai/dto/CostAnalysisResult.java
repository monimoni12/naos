package com.moni.naos.domain.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GPT 가성비 분석 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostAnalysisResult {

    /** 레시피 ID */
    private Long recipeId;

    /** 종합 가성비 점수 (0-100) */
    private Integer overallScore;

    /** 세부 점수 */
    private Breakdown breakdown;

    /** 예상 총 비용 (원) */
    private Integer estimatedTotalCost;

    /** AI 코멘트 */
    private String comment;

    /**
     * 세부 점수 (breakdown)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Breakdown {

        /** 가격 효율성 (0-100) */
        private Integer priceEfficiency;

        /** 시간 효율성 (0-100) */
        private Integer timeEfficiency;

        /** 영양 균형 (0-100) */
        private Integer nutritionBalance;

        /** 재료 접근성 (0-100) */
        private Integer ingredientAccessibility;
    }
}
