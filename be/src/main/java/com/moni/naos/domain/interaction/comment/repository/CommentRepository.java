package com.moni.naos.domain.interaction.comment.repository;

import com.moni.naos.domain.interaction.comment.entity.Comment;
import com.moni.naos.domain.recipe.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * CommentRepository
 * - 댓글 CRUD 및 레시피별 조회
 */
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByRecipe(Recipe recipe);
}
