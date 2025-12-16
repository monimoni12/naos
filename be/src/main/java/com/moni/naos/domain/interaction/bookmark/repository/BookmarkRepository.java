package com.moni.naos.domain.interaction.bookmark.repository;

import com.moni.naos.domain.interaction.bookmark.entity.Bookmark;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * BookmarkRepository
 * - 북마크 추가/삭제/조회
 */
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    /** 북마크 존재 여부 */
    boolean existsByUserAndRecipe(User user, Recipe recipe);

    /** 북마크 삭제 */
    void deleteByUserAndRecipe(User user, Recipe recipe);

    /** 북마크 조회 */
    Optional<Bookmark> findByUserAndRecipe(User user, Recipe recipe);

    /** 유저의 북마크 목록 */
    List<Bookmark> findByUserOrderByCreatedAtDesc(User user);

    /** 유저의 북마크 레시피 ID 목록 */
    @Query("SELECT b.recipe.id FROM Bookmark b WHERE b.user = :user ORDER BY b.createdAt DESC")
    List<Long> findRecipeIdsByUser(@Param("user") User user);

    /** 레시피의 북마크 수 */
    long countByRecipe(Recipe recipe);
}
