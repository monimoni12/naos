package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.RecipeClipSegment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * RecipeClipSegmentRepository
 * - 조리 단계별 텍스트/타임코드 관리
 */
public interface RecipeClipSegmentRepository extends JpaRepository<RecipeClipSegment, Long> {}
