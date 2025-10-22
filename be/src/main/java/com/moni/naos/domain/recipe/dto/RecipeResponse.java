package com.moni.naos.domain.recipe.dto;

import lombok.*;

/** 레시피 상세/목록 응답 DTO (카드 공통 포맷에 맞춤) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecipeResponse {
    private Long id;
    private String title;
    private String description;
    private String authorName;
    private String thumbnailUrl;
    private boolean liked;       // 현재 사용자 좋아요 여부
    private boolean bookmarked;  // 현재 사용자 북마크 여부
}
