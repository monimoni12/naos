package com.moni.naos.domain.interaction.like.dto;

import lombok.*;

/** 좋아요 토글 요청/응답 공용 DTO */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LikeDto {
    private Long recipeId;
    private boolean liked;     // true=좋아요됨, false=해제
    private long likeCount;    // 현재 총 좋아요 수
}
