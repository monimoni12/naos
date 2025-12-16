package com.moni.naos.domain.interaction.comment.dto;

import com.moni.naos.domain.interaction.comment.entity.Comment;
import lombok.*;

import java.time.Instant;
import java.util.List;

/**
 * 댓글 응답 DTO
 * - 좋아요 수, 프로필 이미지, 대댓글 포함
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private Long id;
    private Long recipeId;
    private Long authorId;
    private String authorName;          // 성명 (fullName)
    private String authorUsername;      // @username
    private String authorProfileUrl;    // 프로필 이미지 URL
    private String content;
    private Long parentId;
    private Instant createdAt;

    // 좋아요 관련
    private long likeCount;
    private boolean liked;              // 현재 사용자가 좋아요 눌렀는지

    // 대댓글 목록 (루트 댓글인 경우)
    private List<CommentResponse> replies;

    /**
     * Entity → DTO 변환 (기본)
     */
    public static CommentResponse fromEntity(Comment comment) {
        String authorName = null;
        String authorUsername = null;
        String authorProfileUrl = null;

        if (comment.getUser() != null && comment.getUser().getProfile() != null) {
            authorName = comment.getUser().getProfile().getFullName();  // ⭐ 변경
            authorUsername = comment.getUser().getProfile().getUsername();
            authorProfileUrl = comment.getUser().getProfile().getAvatarUrl();
        }

        return CommentResponse.builder()
                .id(comment.getId())
                .recipeId(comment.getRecipe().getId())
                .authorId(comment.getUser().getId())
                .authorName(authorName)
                .authorUsername(authorUsername)
                .authorProfileUrl(authorProfileUrl)
                .content(comment.getText())
                .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                .createdAt(comment.getCreatedAt())
                .likeCount(0)
                .liked(false)
                .replies(null)
                .build();
    }

    /**
     * Entity → DTO 변환 (좋아요 정보 포함)
     */
    public static CommentResponse fromEntity(Comment comment, long likeCount, boolean liked) {
        CommentResponse response = fromEntity(comment);
        response.setLikeCount(likeCount);
        response.setLiked(liked);
        return response;
    }
}
