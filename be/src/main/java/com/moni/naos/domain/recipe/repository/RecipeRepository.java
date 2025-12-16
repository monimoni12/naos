package com.moni.naos.domain.recipe.repository;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * RecipeRepository
 * - 레시피 기본 CRUD
 * - visibility 기반 조회 (PUBLIC, FOLLOWERS, PRIVATE)
 */
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    // ==================== 기존 메서드 ====================

    List<Recipe> findByAuthor(User author);

    List<Recipe> findByTitleContainingIgnoreCase(String keyword);

    // ==================== Visibility 기반 조회 ====================

    List<Recipe> findByVisibilityOrderByCreatedAtDesc(Recipe.Visibility visibility);

    List<Recipe> findByVisibilityOrderByCreatedAtDesc(Recipe.Visibility visibility, Pageable pageable);

    // ==================== 작성자별 조회 ====================

    List<Recipe> findByAuthorAndVisibilityOrderByCreatedAtDesc(User author, Recipe.Visibility visibility);

    List<Recipe> findByAuthorOrderByCreatedAtDesc(User author);

    // ==================== 카테고리별 조회 ====================

    List<Recipe> findByCategoryAndVisibilityOrderByCreatedAtDesc(String category, Recipe.Visibility visibility);

    // ==================== 검색 ====================

    List<Recipe> findByTitleContainingAndVisibilityOrderByCreatedAtDesc(String keyword, Recipe.Visibility visibility);

    @Query("SELECT r FROM Recipe r WHERE r.visibility = :visibility AND (r.title LIKE %:keyword% OR r.caption LIKE %:keyword%) ORDER BY r.createdAt DESC")
    List<Recipe> searchByKeyword(@Param("keyword") String keyword, @Param("visibility") Recipe.Visibility visibility);

    // ==================== 정렬 ====================

    @Query("SELECT r FROM Recipe r WHERE r.visibility = 'PUBLIC' ORDER BY r.scorePopular DESC NULLS LAST")
    List<Recipe> findAllOrderByPopularity(Pageable pageable);

    @Query("SELECT r FROM Recipe r WHERE r.visibility = 'PUBLIC' ORDER BY r.scoreCost DESC NULLS LAST")
    List<Recipe> findAllOrderByCostEfficiency(Pageable pageable);

    // ==================== 피드 ====================

    @Query("SELECT r FROM Recipe r WHERE r.author.id IN :followingIds AND r.visibility = 'PUBLIC' ORDER BY r.createdAt DESC")
    List<Recipe> findByFollowingUsers(@Param("followingIds") List<Long> followingIds, Pageable pageable);

    // ==================== 통계 ====================

    long countByAuthorAndVisibility(User author, Recipe.Visibility visibility);
}
