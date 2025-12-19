package com.moni.naos.domain.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GPT 가성비 분석 응답 DTO
 * Flask /api/gpt/cost-analysis 응답 매핑
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
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

    /** 영양 정보 (추가!) */
    private Nutrition nutrition;

    /**
     * 세부 점수 (breakdown)
     * Flask 응답 필드명과 일치
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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

    /**
     * 영양 정보
     * Flask 응답 필드명과 일치 (camelCase)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Nutrition {

        /** 추정 칼로리 */
        private Integer kcalEstimate;

        /** 단백질 (g) */
        private Integer proteinG;

        /** 탄수화물 (g) */
        private Integer carbsG;

        /** 지방 (g) */
        private Integer fatG;

        /** 식이섬유 (g) */
        private Integer fiberG;

        /** 나트륨 (mg) */
        private Integer sodiumMg;
    }
}
