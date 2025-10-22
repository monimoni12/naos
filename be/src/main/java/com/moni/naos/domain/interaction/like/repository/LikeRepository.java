package com.moni.naos.domain.interaction.like.repository;

import com.moni.naos.domain.interaction.like.entity.Like;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * LikeRepository
 * - 좋아요 추가/삭제/중복 체크
 */
public interface LikeRepository extends JpaRepository<Like, Long> {
    boolean existsByUserAndRecipe(User user, Recipe recipe);
    void deleteByUserAndRecipe(User user, Recipe recipe);
}
