package com.moni.naos.domain.interaction.comment.repository;

import com.moni.naos.domain.interaction.comment.entity.Comment;
import com.moni.naos.domain.recipe.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * CommentRepository
 * - 댓글 CRUD 및 레시피별 조회
 */
public interface CommentRepository extends JpaRepository<Comment, Long> {

    /** 레시피의 모든 댓글 */
    List<Comment> findByRecipe(Recipe recipe);

    /** 레시피의 루트 댓글만 (대댓글 제외) - 최신순 */
    List<Comment> findByRecipeAndParentIsNullOrderByCreatedAtDesc(Recipe recipe);

    /** 레시피의 루트 댓글만 (대댓글 제외) - 오래된순 */
    List<Comment> findByRecipeAndParentIsNullOrderByCreatedAtAsc(Recipe recipe);

    /** 특정 댓글의 대댓글들 */
    List<Comment> findByParentOrderByCreatedAtAsc(Comment parent);

    /** 레시피의 댓글 수 (삭제되지 않은 것만) */
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.recipe = :recipe AND c.deletedAt IS NULL")
    long countByRecipeAndNotDeleted(@Param("recipe") Recipe recipe);

    /** 레시피의 전체 댓글 수 */
    long countByRecipe(Recipe recipe);
}
