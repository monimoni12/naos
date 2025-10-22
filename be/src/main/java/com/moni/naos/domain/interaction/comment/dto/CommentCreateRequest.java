package com.moni.naos.domain.interaction.comment.dto;

import lombok.*;

/** 댓글 생성 요청 DTO (REST) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentCreateRequest {
    private Long recipeId;
    private String content;
    private Long parentId;   // 대댓글이면 부모 ID
}
