package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.ai.dto.CostAnalysisResult;
import lombok.*;

/**
 * AI 분석 응답 DTO
 * Flask /api/gpt/cost-analysis 응답 → FE 전달
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeAnalysisResponse {

    private Long recipeId;
    private String status;      // PENDING, COMPLETED, FAILED
    private String message;

    // 가성비 점수
    private Integer costEfficiencyScore;
    private Integer priceEstimate;

    // AI 코멘트
    private String comment;

    // 세부 점수 (breakdown) - Flask 필드명과 일치!
    private Breakdown breakdown;

    // 영양 정보
    private Nutrition nutrition;

    /**
     * 세부 점수 DTO
     * Flask 응답 필드명: priceEfficiency, timeEfficiency, nutritionBalance, ingredientAccessibility
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Breakdown {
        private Integer priceEfficiency;
        private Integer timeEfficiency;
        private Integer nutritionBalance;
        private Integer ingredientAccessibility;
    }

    /**
     * 영양 정보 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Nutrition {
        private Integer kcalEstimate;
        private Integer proteinG;
        private Integer carbsG;
        private Integer fatG;
        private Integer fiberG;
        private Integer sodiumMg;
    }

    /**
     * CostAnalysisResult → RecipeAnalysisResponse 변환
     */
    public static RecipeAnalysisResponse fromCostAnalysisResult(Long recipeId, CostAnalysisResult result) {
        if (result == null) {
            return RecipeAnalysisResponse.builder()
                    .recipeId(recipeId)
                    .status("FAILED")
                    .message("AI 분석에 실패했습니다.")
                    .build();
        }

        // Breakdown 변환
        Breakdown breakdownDto = null;
        if (result.getBreakdown() != null) {
            CostAnalysisResult.Breakdown b = result.getBreakdown();
            breakdownDto = Breakdown.builder()
                    .priceEfficiency(b.getPriceEfficiency())
                    .timeEfficiency(b.getTimeEfficiency())
                    .nutritionBalance(b.getNutritionBalance())
                    .ingredientAccessibility(b.getIngredientAccessibility())
                    .build();
        }

        // Nutrition 변환
        Nutrition nutritionDto = null;
        if (result.getNutrition() != null) {
            CostAnalysisResult.Nutrition n = result.getNutrition();
            nutritionDto = Nutrition.builder()
                    .kcalEstimate(n.getKcalEstimate())
                    .proteinG(n.getProteinG())
                    .carbsG(n.getCarbsG())
                    .fatG(n.getFatG())
                    .fiberG(n.getFiberG())
                    .sodiumMg(n.getSodiumMg())
                    .build();
        }

        return RecipeAnalysisResponse.builder()
                .recipeId(recipeId)
                .status("COMPLETED")
                .costEfficiencyScore(result.getOverallScore())
                .priceEstimate(result.getEstimatedTotalCost())
                .comment(result.getComment())
                .breakdown(breakdownDto)
                .nutrition(nutritionDto)
                .build();
    }
}
