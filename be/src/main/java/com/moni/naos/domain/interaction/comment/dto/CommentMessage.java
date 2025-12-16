package com.moni.naos.domain.interaction.comment.dto;

import lombok.*;

import java.time.Instant;

/**
 * 실시간(WebSocket/STOMP) 브로드캐스트용 댓글 메시지 DTO
 * - 구독 채널: /topic/recipes/{recipeId}/comments
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentMessage {

    private Long id;
    private Long recipeId;
    private Long authorId;
    private String authorName;
    private String authorUsername;
    private String authorProfileUrl;
    private String content;
    private Long parentId;
    private Instant createdAt;
    private String type;  // CREATED, UPDATED, DELETED, LIKED
}
