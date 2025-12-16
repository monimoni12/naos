package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeClipSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * RecipeClipSegmentRepository
 * - 조리 단계별 텍스트/타임코드 관리 (전사 세그먼트)
 */
public interface RecipeClipSegmentRepository extends JpaRepository<RecipeClipSegment, Long> {

    /** 레시피의 세그먼트 목록 (순서대로) */
    List<RecipeClipSegment> findByRecipeOrderByIndexOrdAsc(Recipe recipe);

    /** 레시피의 세그먼트 전체 삭제 */
    @Modifying
    @Query("DELETE FROM RecipeClipSegment s WHERE s.recipe = :recipe")
    void deleteByRecipe(@Param("recipe") Recipe recipe);
}
