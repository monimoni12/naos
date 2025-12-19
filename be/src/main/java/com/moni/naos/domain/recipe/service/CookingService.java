package com.moni.naos.domain.recipe.service;

import com.moni.naos.domain.recipe.dto.CookingSessionResponse;
import com.moni.naos.domain.recipe.dto.RecipeProgressResponse;
import com.moni.naos.domain.recipe.entity.Cooking;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeProgress;
import com.moni.naos.domain.recipe.repository.CookingRepository;
import com.moni.naos.domain.recipe.repository.RecipeClipRepository;
import com.moni.naos.domain.recipe.repository.RecipeProgressRepository;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * CookingService - 요리 세션 비즈니스 로직
 * - 요리 시작/종료
 * - 진행 상황 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CookingService {

    private final CookingRepository cookingRepository;
    private final RecipeProgressRepository recipeProgressRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeClipRepository recipeClipRepository;
    private final UserRepository userRepository;

    /**
     * 요리 시작
     * ⭐ 수정: 같은 레시피만 중복 체크 (여러 레시피 동시 요리 가능)
     */
    @Transactional
    public CookingSessionResponse startCooking(Long userId, Long recipeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        // ⭐ 변경: 같은 레시피에 대해서만 활성 세션 체크
        Optional<Cooking> existingSession = cookingRepository.findByUserAndRecipeAndActiveTrue(user, recipe);
        if (existingSession.isPresent()) {
            // 이미 이 레시피를 요리 중이면 기존 세션 반환
            log.info("기존 요리 세션 반환: userId={}, recipeId={}", userId, recipeId);
            return CookingSessionResponse.fromEntity(existingSession.get());
        }

        // 새 세션 생성
        Cooking cooking = Cooking.builder()
                .user(user)
                .recipe(recipe)
                .startedAt(Instant.now())
                .active(true)
                .build();

        Cooking saved = cookingRepository.save(cooking);

        // 클립 수로 totalSteps 계산
        int totalSteps = (int) recipeClipRepository.countByRecipe(recipe);
        if (totalSteps == 0) totalSteps = 1;

        // 진행 상황 초기화
        final int finalTotalSteps = totalSteps;
        RecipeProgress progress = recipeProgressRepository.findByUserAndRecipe(user, recipe)
                .orElseGet(() -> RecipeProgress.builder()
                        .user(user)
                        .recipe(recipe)
                        .totalSteps(finalTotalSteps)
                        .progressStep(0)
                        .startedAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build());

        progress.setCooking(saved);
        progress.setProgressStep(0);
        progress.setStartedAt(Instant.now());
        progress.setCompletedAt(null);
        recipeProgressRepository.save(progress);

        log.info("요리 시작: userId={}, recipeId={}", userId, recipeId);
        return CookingSessionResponse.fromEntity(saved);
    }

    /**
     * 요리 종료
     */
    @Transactional
    public CookingSessionResponse endCooking(Long userId, Long sessionId) {
        Cooking cooking = cookingRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("세션을 찾을 수 없습니다."));

        if (!cooking.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 세션만 종료할 수 있습니다.");
        }

        cooking.endCooking();
        Cooking saved = cookingRepository.save(cooking);

        log.info("요리 종료: sessionId={}", sessionId);
        return CookingSessionResponse.fromEntity(saved);
    }

    /**
     * ⭐ 추가: 레시피 ID로 요리 종료 (세션 ID 모를 때)
     */
    @Transactional
    public CookingSessionResponse endCookingByRecipe(Long userId, Long recipeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        Cooking cooking = cookingRepository.findByUserAndRecipeAndActiveTrue(user, recipe)
                .orElseThrow(() -> new IllegalArgumentException("활성 세션을 찾을 수 없습니다."));

        cooking.endCooking();
        Cooking saved = cookingRepository.save(cooking);

        log.info("요리 종료 (by recipeId): userId={}, recipeId={}", userId, recipeId);
        return CookingSessionResponse.fromEntity(saved);
    }

    /**
     * 진행 상황 업데이트
     */
    @Transactional
    public RecipeProgressResponse updateProgress(Long userId, Long recipeId, int step) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        RecipeProgress progress = recipeProgressRepository.findByUserAndRecipe(user, recipe)
                .orElseThrow(() -> new IllegalArgumentException("먼저 요리를 시작하세요."));

        progress.setProgressStep(step);

        if (step >= progress.getTotalSteps()) {
            progress.complete();
        }

        return RecipeProgressResponse.fromEntity(recipeProgressRepository.save(progress));
    }

    /**
     * 진행 상황 조회
     */
    public RecipeProgressResponse getProgress(Long userId, Long recipeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        int totalSteps = (int) recipeClipRepository.countByRecipe(recipe);
        if (totalSteps == 0) totalSteps = 1;

        final int finalTotalSteps = totalSteps;

        return recipeProgressRepository.findByUserAndRecipe(user, recipe)
                .map(RecipeProgressResponse::fromEntity)
                .orElseGet(() -> RecipeProgressResponse.builder()
                        .recipeId(recipeId)
                        .totalSteps(finalTotalSteps)
                        .progressStep(0)
                        .completed(false)
                        .build());
    }

    /**
     * 활성 세션 조회 (단일 - 기존 호환)
     */
    public CookingSessionResponse getActiveSession(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        return cookingRepository.findByUserAndActiveTrue(user)
                .map(CookingSessionResponse::fromEntity)
                .orElse(null);
    }

    /**
     * ⭐ 추가: 활성 세션 목록 조회 (여러 개)
     */
    public List<CookingSessionResponse> getActiveSessions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        return cookingRepository.findByUserAndActiveTrueOrderByStartedAtDesc(user)
                .stream()
                .map(CookingSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * ⭐ 추가: 특정 레시피의 요리 상태 확인
     */
    public boolean isCooking(Long userId, Long recipeId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;

        Recipe recipe = recipeRepository.findById(recipeId).orElse(null);
        if (recipe == null) return false;

        return cookingRepository.findByUserAndRecipeAndActiveTrue(user, recipe).isPresent();
    }

    /**
     * 요리 기록 조회
     */
    public List<CookingSessionResponse> getCookingHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        return cookingRepository.findByUserOrderByStartedAtDesc(user)
                .stream()
                .map(CookingSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
