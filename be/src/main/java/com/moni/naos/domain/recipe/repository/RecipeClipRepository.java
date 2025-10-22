package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.RecipeClip;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * RecipeClipRepository
 * - 클립(조리 구간) 단위 CRUD
 */
public interface RecipeClipRepository extends JpaRepository<RecipeClip, Long> {}
