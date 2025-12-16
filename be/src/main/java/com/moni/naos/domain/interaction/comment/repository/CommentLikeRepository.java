package com.moni.naos.domain.interaction.comment.repository;

import com.moni.naos.domain.interaction.comment.entity.Comment;
import com.moni.naos.domain.interaction.comment.entity.CommentLike;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * CommentLikeRepository - 댓글 좋아요 Repository
 */
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    /** 좋아요 존재 여부 */
    boolean existsByUserAndComment(User user, Comment comment);

    /** 좋아요 삭제 */
    void deleteByUserAndComment(User user, Comment comment);

    /** 댓글의 좋아요 수 */
    long countByComment(Comment comment);
}
