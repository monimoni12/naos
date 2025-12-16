package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Cooking;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * CookingRepository
 * - "요리 시작하기" 버튼 기반 세션 관리
 */
public interface CookingRepository extends JpaRepository<Cooking, Long> {

    /** 특정 유저 + 레시피의 활성 세션 */
    Optional<Cooking> findByUserAndRecipeAndActiveTrue(User user, Recipe recipe);

    /** 유저의 활성 세션 (레시피 무관) - CookingService.startCooking에서 사용 */
    Optional<Cooking> findByUserAndActiveTrue(User user);

    /** 유저의 요리 기록 (최신순) - CookingService.getCookingHistory에서 사용 */
    List<Cooking> findByUserOrderByStartedAtDesc(User user);

    /** 유저의 완료된 요리 수 */
    long countByUserAndActiveFalse(User user);
}
