package com.moni.naos.domain.interaction.comment.entity;

import com.moni.naos.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * CommentLike - 댓글 좋아요
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "comment_likes",
        uniqueConstraints = @UniqueConstraint(name = "uq_comment_like", columnNames = {"user_id", "comment_id"}),
        indexes = @Index(name = "idx_comment_like_comment", columnList = "comment_id"))
public class CommentLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id")
    private Comment comment;

    @Builder.Default  // ✅ 추가됨
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
