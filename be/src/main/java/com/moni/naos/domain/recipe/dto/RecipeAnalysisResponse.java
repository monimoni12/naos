package com.moni.naos.domain.recipe.dto;

import lombok.*;

import java.util.Map;

/**
 * AI 분석 결과 응답 DTO
 * - Flask AI 서버에서 가성비 분석 후 반환
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeAnalysisResponse {

    private Long recipeId;
    private Integer costEfficiencyScore;   // 가성비 점수 (0-100)
    private Integer kcalEstimate;
    private Integer proteinG;
    private Integer carbsG;
    private Integer fatG;
    private Integer priceEstimate;
    private Map<String, Integer> breakdown;  // 세부 점수
    private String status;   // PENDING, COMPLETED, FAILED
    private String message;
}
