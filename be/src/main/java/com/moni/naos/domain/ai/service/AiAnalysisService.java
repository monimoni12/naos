package com.moni.naos.domain.ai.service;

import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.ai.dto.*;
import com.moni.naos.domain.ai.client.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * AI 분석 통합 서비스
 * - Whisper STT
 * - GPT 가성비 분석
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiAnalysisService {

    private final AsrClient asrClient;
    private final LlmClient llmClient;
    private final RecipeRepository recipeRepository;

    /**
     * 영상 STT 수행
     */
    public AsrResult transcribeVideo(String videoUrl) {
        return asrClient.transcribe(videoUrl);
    }

    /**
     * 레시피 가성비 분석 및 저장
     * @param recipeId 레시피 ID
     * @param ingredients 재료 목록 (프론트에서 전달)
     */
    @Transactional
    public CostAnalysisResult analyzeAndSaveCostScore(Long recipeId, List<CostAnalysisRequest.Ingredient> ingredients) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        // 이미 분석된 경우 스킵
        if (recipe.getScoreCost() != null && recipe.getScoreCost() > 0) {
            log.info("이미 가성비 분석 완료: recipeId={}, score={}", recipeId, recipe.getScoreCost());
            return CostAnalysisResult.builder()
                    .recipeId(recipeId)
                    .overallScore(recipe.getScoreCost().intValue())
                    .build();
        }

        // 요청 생성 (Recipe 필드 사용)
        CostAnalysisRequest request = CostAnalysisRequest.builder()
                .recipeId(recipe.getId())
                .title(recipe.getTitle())
                .ingredients(ingredients)
                .cookingTimeMinutes(recipe.getCookTimeMin())
                .difficulty(recipe.getDifficulty() != null ? recipe.getDifficulty().name() : null)
                .caloriesPerServing(recipe.getKcalEstimate())
                .build();

        // AI 분석 호출
        CostAnalysisResult result = llmClient.analyzeCost(request);

        // 결과 저장
        if (result != null && result.getOverallScore() != null) {
            recipe.setScoreCost(result.getOverallScore().doubleValue());
            recipeRepository.save(recipe);
            log.info("가성비 점수 저장: recipeId={}, score={}", recipeId, result.getOverallScore());
        }

        return result;
    }

    /**
     * 레시피 가성비 분석 (재료 없이, 기본 정보만)
     */
    @Transactional
    public CostAnalysisResult analyzeAndSaveCostScore(Long recipeId) {
        return analyzeAndSaveCostScore(recipeId, null);
    }

    /**
     * 비동기 가성비 분석
     */
    @Async
    @Transactional
    public CompletableFuture<CostAnalysisResult> analyzeAndSaveCostScoreAsync(Long recipeId, List<CostAnalysisRequest.Ingredient> ingredients) {
        try {
            CostAnalysisResult result = analyzeAndSaveCostScore(recipeId, ingredients);
            return CompletableFuture.completedFuture(result);
        } catch (Exception e) {
            log.error("비동기 가성비 분석 실패: recipeId={}", recipeId, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * AI 서버 상태 확인
     */
    public boolean isAiServerHealthy() {
        return llmClient.healthCheck();
    }
}
