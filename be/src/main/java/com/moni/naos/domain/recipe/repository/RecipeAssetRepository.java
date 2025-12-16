package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * RecipeAssetRepository
 * - 영상, 썸네일 등 파일 메타데이터 관리
 */
public interface RecipeAssetRepository extends JpaRepository<RecipeAsset, Long> {

    /** 레시피의 모든 자산 */
    List<RecipeAsset> findByRecipe(Recipe recipe);

    /** 레시피의 특정 타입 자산 (VIDEO, THUMB) */
    List<RecipeAsset> findByRecipeAndType(Recipe recipe, RecipeAsset.Type type);

    /** 레시피의 첫 번째 특정 타입 자산 */
    Optional<RecipeAsset> findFirstByRecipeAndType(Recipe recipe, RecipeAsset.Type type);
}
