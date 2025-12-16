package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * RecipeIngredientRepository - 레시피 재료 저장소
 */
@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    /**
     * 레시피의 모든 재료 조회 (순서대로)
     */
    List<RecipeIngredient> findByRecipeOrderByOrderIndexAsc(Recipe recipe);

    /**
     * 레시피 ID로 재료 조회
     */
    List<RecipeIngredient> findByRecipeIdOrderByOrderIndexAsc(Long recipeId);

    /**
     * 레시피의 재료 삭제
     */
    void deleteByRecipe(Recipe recipe);

    /**
     * 레시피 ID로 재료 삭제
     */
    void deleteByRecipeId(Long recipeId);

    /**
     * 레시피의 재료 개수
     */
    int countByRecipeId(Long recipeId);
}
