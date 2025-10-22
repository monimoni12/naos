package com.moni.naos.domain.recipe.dto;

import lombok.*;

/**
 * 개별 클립(슬라이드) 생성 요청 DTO
 * - 업로드/편집 플로우에서 레시피 내부를 여러 클립으로 쪼갤 때 사용
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClipCreateRequest {
    private Long recipeId;      // 어떤 레시피의 클립인지
    private String title;       // 클립 제목(선택)
    private String description; // 클립 설명(선택)
    private Integer orderIndex; // 레시피 내 표시 순서(0..n)
}
