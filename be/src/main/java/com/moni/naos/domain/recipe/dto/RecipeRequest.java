package com.moni.naos.domain.recipe.dto;

import lombok.*;

/**
 * RecipeRequest
 * - 레시피 등록 요청 DTO
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecipeRequest {
    private String title;
    private String description;
    private String thumbnailUrl;
    // TODO: 가격/식단유형 등 필터 파라미터 추후 확장
}
