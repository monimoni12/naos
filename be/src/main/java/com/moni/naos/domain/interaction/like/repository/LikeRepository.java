package com.moni.naos.domain.interaction.like.repository;

import com.moni.naos.domain.interaction.like.entity.Like;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * LikeRepository
 * - 좋아요 추가/삭제/중복 체크
 */
public interface LikeRepository extends JpaRepository<Like, Long> {

    /** 좋아요 존재 여부 */
    boolean existsByUserAndRecipe(User user, Recipe recipe);

    /** 좋아요 삭제 */
    void deleteByUserAndRecipe(User user, Recipe recipe);

    /** 좋아요 조회 */
    Optional<Like> findByUserAndRecipe(User user, Recipe recipe);

    /** 레시피의 좋아요 수 */
    long countByRecipe(Recipe recipe);
}
