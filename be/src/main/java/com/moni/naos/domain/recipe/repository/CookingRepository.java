package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Cooking;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * CookingRepository
 * - “요리 시작하기” 버튼 기반 세션 관리
 */
public interface CookingRepository extends JpaRepository<Cooking, Long> {
    Optional<Cooking> findByUserAndRecipeAndActiveTrue(User user, Recipe recipe);
}
