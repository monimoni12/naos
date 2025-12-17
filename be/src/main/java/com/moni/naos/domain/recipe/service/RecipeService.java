package com.moni.naos.domain.recipe.service;

import com.moni.naos.domain.recipe.dto.*;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeAsset;
import com.moni.naos.domain.recipe.entity.RecipeClip;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.recipe.repository.RecipeAssetRepository;
import com.moni.naos.domain.recipe.repository.RecipeClipRepository;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * RecipeService - 레시피 업로드 플로우
 * 
 * 플로우:
 * 1. 영상 업로드 → createDraft
 * 2. 클리핑 완료 → saveClips
 * 3. 썸네일 선택 → setThumbnail
 * 4. 상세 정보 입력 → saveDetails
 * 5. AI 분석 요청 → requestAnalysis
 * 6. 발행 → publish
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeClipRepository recipeClipRepository;
    private final RecipeAssetRepository recipeAssetRepository;
    private final UserRepository userRepository;

    // ==================== 업로드 플로우 ====================

    /**
     * Step 1: 임시 레시피 생성 (DRAFT)
     */
    @Transactional
    public RecipeResponse createDraft(Long userId, DraftCreateRequest req) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        Recipe recipe = Recipe.builder()
                .author(author)
                .title(req.getTitle() != null ? req.getTitle() : "임시 저장")
                .visibility(Recipe.Visibility.PRIVATE)
                .build();

        Recipe saved = recipeRepository.save(recipe);

        // 영상 URL이 있으면 Asset으로 저장
        if (req.getVideoUrl() != null && !req.getVideoUrl().isBlank()) {
            RecipeAsset videoAsset = RecipeAsset.builder()
                    .recipe(saved)
                    .type(RecipeAsset.Type.VIDEO)
                    .url(req.getVideoUrl())
                    .build();
            recipeAssetRepository.save(videoAsset);
        }

        log.info("Draft 레시피 생성: id={}, userId={}", saved.getId(), userId);
        
        return toResponse(saved);
    }

    /**
     * Step 2: 클립 정보 저장
     */
    @Transactional
    public RecipeResponse saveClips(Long userId, Long recipeId, List<ClipCreateRequest> clips) {
        Recipe recipe = getRecipeWithOwnerCheck(userId, recipeId);

        // 기존 클립 삭제
        recipeClipRepository.deleteByRecipe(recipe);

        // 새 클립 저장
        for (int i = 0; i < clips.size(); i++) {
            ClipCreateRequest req = clips.get(i);
            RecipeClip clip = RecipeClip.builder()
                    .recipe(recipe)
                    .indexOrd(req.getOrderIndex() != null ? req.getOrderIndex() : i)
                    .caption(req.getDescription())
                    .startSec(req.getStartSec() != null ? req.getStartSec() : 0.0)
                    .endSec(req.getEndSec() != null ? req.getEndSec() : 0.0)
                    .build();
            recipeClipRepository.save(clip);
        }

        log.info("클립 저장 완료: recipeId={}, clipCount={}", recipeId, clips.size());
        
        return toResponse(recipe);
    }

    /**
     * Step 3: 썸네일 설정
     */
    @Transactional
    public RecipeResponse setThumbnail(Long userId, Long recipeId, AssetRequest req) {
        Recipe recipe = getRecipeWithOwnerCheck(userId, recipeId);

        // 기존 썸네일 삭제
        recipeAssetRepository.findByRecipeAndType(recipe, RecipeAsset.Type.THUMB)
                .forEach(asset -> recipeAssetRepository.delete(asset));

        // 새 썸네일 저장
        RecipeAsset thumbnail = RecipeAsset.builder()
                .recipe(recipe)
                .type(RecipeAsset.Type.THUMB)
                .url(req.getUrl())
                .build();
        recipeAssetRepository.save(thumbnail);

        log.info("썸네일 설정: recipeId={}, url={}", recipeId, req.getUrl());
        
        return toResponse(recipe);
    }

    /**
     * Step 4: 상세 정보 입력
     */
    @Transactional
    public RecipeResponse saveDetails(Long userId, Long recipeId, RecipeRequest req) {
        Recipe recipe = getRecipeWithOwnerCheck(userId, recipeId);

        if (req.getTitle() != null) recipe.setTitle(req.getTitle());
        if (req.getCaption() != null) recipe.setCaption(req.getCaption());
        if (req.getCategory() != null) recipe.setCategory(req.getCategory());
        if (req.getServings() != null) recipe.setServings(req.getServings());
        if (req.getCookTimeMin() != null) recipe.setCookTimeMin(req.getCookTimeMin());
        if (req.getPriceEstimate() != null) recipe.setPriceEstimate(req.getPriceEstimate());
        if (req.getKcalEstimate() != null) recipe.setKcalEstimate(req.getKcalEstimate());
        if (req.getDietTags() != null) recipe.setDietTags(req.getDietTags());
        recipe.setHideLikeCount(req.isHideLikeCount());
        recipe.setHideShareCount(req.isHideShareCount());
        recipe.setDisableComments(req.isDisableComments());

        Recipe saved = recipeRepository.save(recipe);
        log.info("상세 정보 저장: recipeId={}", recipeId);
        
        return toResponse(saved);
    }

    /**
     * Step 5: AI 분석 요청
     */
    @Transactional
    public RecipeAnalysisResponse requestAnalysis(Long userId, Long recipeId) {
        Recipe recipe = getRecipeWithOwnerCheck(userId, recipeId);

        // TODO: Flask AI 서버 호출

        return RecipeAnalysisResponse.builder()
                .recipeId(recipeId)
                .status("PENDING")
                .message("AI 분석이 요청되었습니다.")
                .build();
    }

    /**
     * Step 6: 최종 발행 (PRIVATE → PUBLIC)
     */
    @Transactional
    public RecipeResponse publish(Long userId, Long recipeId) {
        Recipe recipe = getRecipeWithOwnerCheck(userId, recipeId);

        recipe.setVisibility(Recipe.Visibility.PUBLIC);
        Recipe saved = recipeRepository.save(recipe);

        log.info("레시피 발행: recipeId={}", recipeId);
        
        return toResponse(saved);
    }

    // ==================== 기본 CRUD ====================

    @Transactional
    public RecipeResponse createRecipe(RecipeRequest req) {
        Recipe recipe = Recipe.builder()
                .title(req.getTitle())
                .caption(req.getCaption())
                .category(req.getCategory())
                .servings(req.getServings())
                .cookTimeMin(req.getCookTimeMin())
                .priceEstimate(req.getPriceEstimate())
                .kcalEstimate(req.getKcalEstimate())
                .hideLikeCount(req.isHideLikeCount())
                .hideShareCount(req.isHideShareCount())
                .disableComments(req.isDisableComments())
                .visibility(Recipe.Visibility.PUBLIC)
                .build();

        return toResponse(recipeRepository.save(recipe));
    }

    public List<RecipeResponse> getAllRecipes() {
        return recipeRepository.findByVisibilityOrderByCreatedAtDesc(Recipe.Visibility.PUBLIC)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RecipeResponse getRecipeById(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + id));
        return toResponse(recipe);
    }

    @Transactional
    public RecipeResponse updateRecipe(Long id, RecipeRequest req) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + id));

        if (req.getTitle() != null) recipe.setTitle(req.getTitle());
        if (req.getCaption() != null) recipe.setCaption(req.getCaption());
        if (req.getCategory() != null) recipe.setCategory(req.getCategory());
        recipe.setServings(req.getServings());
        recipe.setCookTimeMin(req.getCookTimeMin());
        recipe.setPriceEstimate(req.getPriceEstimate());
        recipe.setKcalEstimate(req.getKcalEstimate());
        recipe.setHideLikeCount(req.isHideLikeCount());
        recipe.setHideShareCount(req.isHideShareCount());
        recipe.setDisableComments(req.isDisableComments());

        return toResponse(recipeRepository.save(recipe));
    }

    @Transactional
    public void deleteRecipe(Long id) {
        recipeRepository.deleteById(id);
    }

    // ==================== 추가 조회 ====================

    public List<RecipeResponse> getByAuthor(Long userId) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        return recipeRepository.findByAuthorAndVisibilityOrderByCreatedAtDesc(author, Recipe.Visibility.PUBLIC)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 특정 유저의 모든 레시피 조회 (PUBLIC + PRIVATE)
     * - 프로필 페이지용
     */
    public List<RecipeResponse> getAllByAuthor(Long userId) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        return recipeRepository.findByAuthorOrderByCreatedAtDesc(author)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RecipeResponse> getDraftsByAuthor(Long userId) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

        return recipeRepository.findByAuthorAndVisibilityOrderByCreatedAtDesc(author, Recipe.Visibility.PRIVATE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RecipeResponse> getByCategory(String category) {
        return recipeRepository.findByCategoryAndVisibilityOrderByCreatedAtDesc(category, Recipe.Visibility.PUBLIC)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RecipeResponse> getFeed(Long userId, int page, int size) {
        // TODO: 팔로잉 유저의 레시피만 가져오기
        return recipeRepository.findByVisibilityOrderByCreatedAtDesc(Recipe.Visibility.PUBLIC, PageRequest.of(page, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ==================== Helper ====================

    private Recipe getRecipeWithOwnerCheck(Long userId, Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다: " + recipeId));

        if (recipe.getAuthor() != null && !recipe.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 레시피만 수정할 수 있습니다.");
        }

        return recipe;
    }

    /**
     * Recipe → RecipeResponse 변환 (assets 포함)
     */
    private RecipeResponse toResponse(Recipe recipe) {
        List<RecipeAsset> assets = recipeAssetRepository.findByRecipe(recipe);
        return RecipeResponse.fromEntity(recipe, assets);
    }
}
