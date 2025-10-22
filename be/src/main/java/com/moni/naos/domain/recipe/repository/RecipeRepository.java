package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * RecipeRepository
 * - 레시피 기본 CRUD
 * - 제목 검색 / 작성자별 조회
 */
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByAuthor(User author);
    List<Recipe> findByTitleContainingIgnoreCase(String keyword);
}
