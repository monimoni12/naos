package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.RecipeAsset;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * RecipeAssetRepository
 * - 영상, 썸네일 등 파일 메타데이터 관리
 */
public interface RecipeAssetRepository extends JpaRepository<RecipeAsset, Long> {}
