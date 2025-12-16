package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeProgress;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * RecipeProgressRepository
 * - 사용자의 레시피 진행률 추적
 */
public interface RecipeProgressRepository extends JpaRepository<RecipeProgress, Long> {

    Optional<RecipeProgress> findByUserAndRecipe(User user, Recipe recipe);

    List<RecipeProgress> findByUser(User user);

    List<RecipeProgress> findByUserAndCompletedAtIsNotNull(User user);

    List<RecipeProgress> findByUserAndCompletedAtIsNull(User user);
}
