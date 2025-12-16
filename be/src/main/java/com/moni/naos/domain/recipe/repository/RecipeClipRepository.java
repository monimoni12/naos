package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeClip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * RecipeClipRepository
 * - 클립(조리 구간) 단위 CRUD
 */
public interface RecipeClipRepository extends JpaRepository<RecipeClip, Long> {

    /** 레시피의 클립 목록 (순서대로) */
    List<RecipeClip> findByRecipeOrderByIndexOrdAsc(Recipe recipe);

    /** 레시피의 클립 수 */
    long countByRecipe(Recipe recipe);

    /** 레시피의 클립 전체 삭제 */
    @Modifying
    @Query("DELETE FROM RecipeClip c WHERE c.recipe = :recipe")
    void deleteByRecipe(@Param("recipe") Recipe recipe);
}
