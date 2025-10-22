package com.moni.naos.domain.interaction.bookmark.repository;

import com.moni.naos.domain.interaction.bookmark.entity.Bookmark;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * BookmarkRepository
 * - 북마크 추가/삭제/조회
 */
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    boolean existsByUserAndRecipe(User user, Recipe recipe);
    void deleteByUserAndRecipe(User user, Recipe recipe);
}
