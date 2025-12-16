package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeTranscriptMeta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * RecipeTranscriptMetaRepository
 * - 전사 메타데이터 CRUD
 */
public interface RecipeTranscriptMetaRepository extends JpaRepository<RecipeTranscriptMeta, Long> {

    /**
     * 레시피의 전사 메타 조회
     */
    Optional<RecipeTranscriptMeta> findByRecipe(Recipe recipe);

    /**
     * 레시피 ID로 전사 메타 조회
     */
    Optional<RecipeTranscriptMeta> findByRecipeId(Long recipeId);

    /**
     * 레시피의 전사 메타 존재 여부
     */
    boolean existsByRecipeId(Long recipeId);

    /**
     * 레시피의 전사 메타 삭제
     */
    void deleteByRecipe(Recipe recipe);
}
