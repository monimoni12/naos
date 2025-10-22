package com.moni.naos.domain.interaction.bookmark.dto;

import lombok.*;

/** 북마크 추가/해제 요청/응답 DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookmarkDto {
    private Long recipeId;
    private boolean bookmarked; // true=저장됨, false=해제
}
