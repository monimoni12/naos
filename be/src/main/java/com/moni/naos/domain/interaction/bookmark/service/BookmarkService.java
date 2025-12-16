package com.moni.naos.domain.interaction.bookmark.service;

import com.moni.naos.domain.interaction.bookmark.entity.Bookmark;
import com.moni.naos.domain.interaction.bookmark.repository.BookmarkRepository;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.UserRepository;
import com.moni.naos.global.websocket.RedisPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * BookmarkService - 북마크(스크랩) 비즈니스 로직
 * - Redis Pub/Sub으로 실시간 브로드캐스트
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final RedisPublisher redisPublisher;  // ⭐ Redis

    /**
     * 북마크 토글 (있으면 삭제, 없으면 추가)
     * @return true: 북마크 추가됨, false: 북마크 취소됨
     */
    @Transactional
    public boolean toggle(Long userId, Long recipeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        boolean bookmarked;
        if (bookmarkRepository.existsByUserAndRecipe(user, recipe)) {
            bookmarkRepository.deleteByUserAndRecipe(user, recipe);
            log.info("북마크 취소: userId={}, recipeId={}", userId, recipeId);
            bookmarked = false;
        } else {
            Bookmark bookmark = Bookmark.builder()
                    .user(user)
                    .recipe(recipe)
                    .createdAt(Instant.now())
                    .build();
            bookmarkRepository.save(bookmark);
            log.info("북마크 추가: userId={}, recipeId={}", userId, recipeId);
            bookmarked = true;
        }

        // ⭐ 실시간 브로드캐스트
        long count = bookmarkRepository.countByRecipe(recipe);
        broadcastBookmark(recipeId, userId, bookmarked, count);

        return bookmarked;
    }

    public boolean isBookmarked(Long userId, Long recipeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        return bookmarkRepository.existsByUserAndRecipe(user, recipe);
    }

    public List<Long> getBookmarkedRecipeIds(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return bookmarkRepository.findRecipeIdsByUser(user);
    }

    public List<Bookmark> getBookmarks(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        return bookmarkRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public long getCount(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        return bookmarkRepository.countByRecipe(recipe);
    }

    private void broadcastBookmark(Long recipeId, Long userId, boolean bookmarked, long count) {
        BookmarkMessage message = new BookmarkMessage(recipeId, userId, bookmarked, count, bookmarked ? "BOOKMARKED" : "UNBOOKMARKED");
        redisPublisher.publishLike(recipeId, message);  // 같은 채널 사용
    }

    public record BookmarkMessage(Long recipeId, Long userId, boolean bookmarked, long count, String type) {}
}
