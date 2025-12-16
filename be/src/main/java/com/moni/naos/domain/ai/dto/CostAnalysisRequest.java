package com.moni.naos.domain.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * GPT 가성비 분석 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostAnalysisRequest {

    /** 레시피 ID */
    private Long recipeId;

    /** 레시피 제목 */
    private String title;

    /** 재료 목록 */
    private List<Ingredient> ingredients;

    /** 조리 시간 (분) */
    private Integer cookingTimeMinutes;

    /** 난이도 (EASY, MEDIUM, HARD) */
    private String difficulty;

    /** 1인분 기준 칼로리 (선택) */
    private Integer caloriesPerServing;

    /**
     * 재료 정보
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Ingredient {
        
        /** 재료명 */
        private String name;
        
        /** 수량 */
        private String quantity;
        
        /** 단위 (g, ml, 개, 큰술 등) */
        private String unit;
        
        /** 예상 가격 (원) - 없으면 AI가 추정 */
        private Integer estimatedPrice;
    }
}
