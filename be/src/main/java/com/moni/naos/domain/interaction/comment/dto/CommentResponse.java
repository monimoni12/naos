package com.moni.naos.domain.interaction.comment.dto;

import lombok.*;
import java.time.Instant;

/** 댓글 조회 응답 DTO (REST) */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentResponse {
    private Long id;
    private Long recipeId;
    private Long authorId;
    private String authorName;
    private String content;
    private Long parentId;
    private Instant createdAt;
}
