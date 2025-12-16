package com.moni.naos.domain.interaction.like.service;

import com.moni.naos.domain.interaction.like.entity.Like;
import com.moni.naos.domain.interaction.like.repository.LikeRepository;
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

/**
 * LikeService - 좋아요 비즈니스 로직
 * - Redis Pub/Sub으로 실시간 브로드캐스트
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final RedisPublisher redisPublisher;  // ⭐ Redis

    /**
     * 좋아요 토글 (있으면 삭제, 없으면 추가)
     * @return true: 좋아요 추가됨, false: 좋아요 취소됨
     */
    @Transactional
    public boolean toggle(Long userId, Long recipeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        boolean liked;
        if (likeRepository.existsByUserAndRecipe(user, recipe)) {
            likeRepository.deleteByUserAndRecipe(user, recipe);
            updateRecipeScore(recipe, -1);
            log.info("좋아요 취소: userId={}, recipeId={}", userId, recipeId);
            liked = false;
        } else {
            Like like = Like.builder()
                    .user(user)
                    .recipe(recipe)
                    .createdAt(Instant.now())
                    .build();
            likeRepository.save(like);
            updateRecipeScore(recipe, +1);
            log.info("좋아요 추가: userId={}, recipeId={}", userId, recipeId);
            liked = true;
        }

        // ⭐ 실시간 브로드캐스트
        long count = likeRepository.countByRecipe(recipe);
        broadcastLike(recipeId, userId, liked, count);

        return liked;
    }

    public boolean isLiked(Long userId, Long recipeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        return likeRepository.existsByUserAndRecipe(user, recipe);
    }

    public long getCount(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        return likeRepository.countByRecipe(recipe);
    }

    @Transactional
    protected void updateRecipeScore(Recipe recipe, int delta) {
        Double currentScore = recipe.getScorePopular();
        if (currentScore == null) currentScore = 0.0;
        recipe.setScorePopular(currentScore + delta);
        recipeRepository.save(recipe);
    }

    private void broadcastLike(Long recipeId, Long userId, boolean liked, long count) {
        LikeMessage message = new LikeMessage(recipeId, userId, liked, count, liked ? "LIKED" : "UNLIKED");
        redisPublisher.publishLike(recipeId, message);
    }

    public record LikeMessage(Long recipeId, Long userId, boolean liked, long count, String type) {}
}
