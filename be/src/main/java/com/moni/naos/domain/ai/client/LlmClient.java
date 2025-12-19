package com.moni.naos.domain.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moni.naos.domain.ai.dto.CostAnalysisRequest;
import com.moni.naos.domain.ai.dto.CostAnalysisResult;
import com.moni.naos.global.config.ExternalEndpointProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * GPT LLM 클라이언트
 * - Flask AI 서버의 /api/gpt/cost-analysis 호출
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LlmClient {

    private final WebClient aiWebClient;
    private final ExternalEndpointProperties aiProperties;
    private final ObjectMapper objectMapper;

    /**
     * 가성비 분석 요청
     * @param request 레시피 정보 (재료, 시간, 난이도 등)
     * @return 가성비 분석 결과 (점수 + breakdown + nutrition)
     */
    public CostAnalysisResult analyzeCost(CostAnalysisRequest request) {
        log.info("가성비 분석 요청: recipeId={}, ingredients={}",
                request.getRecipeId(),
                request.getIngredients() != null ? request.getIngredients().size() : 0);

        try {
            // ⭐ 먼저 raw JSON으로 받아서 로그 찍기
            String rawJson = aiWebClient.post()
                    .uri("/api/gpt/cost-analysis")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(aiProperties.getTimeout()))
                    .block();

            log.info("Flask 응답 (raw): {}", rawJson);

            // ⭐ 수동으로 파싱
            CostAnalysisResult result = objectMapper.readValue(rawJson, CostAnalysisResult.class);

            log.info("가성비 분석 완료: recipeId={}, score={}",
                    request.getRecipeId(),
                    result != null ? result.getOverallScore() : null);

            // ⭐ 디버깅: breakdown 확인
            if (result != null && result.getBreakdown() != null) {
                log.info("Breakdown 파싱 성공: priceEfficiency={}, timeEfficiency={}, nutritionBalance={}, ingredientAccessibility={}",
                        result.getBreakdown().getPriceEfficiency(),
                        result.getBreakdown().getTimeEfficiency(),
                        result.getBreakdown().getNutritionBalance(),
                        result.getBreakdown().getIngredientAccessibility());
            } else {
                log.warn("Breakdown이 null입니다!");
            }

            // ⭐ 디버깅: nutrition 확인
            if (result != null && result.getNutrition() != null) {
                log.info("Nutrition 파싱 성공: kcal={}, protein={}g, carbs={}g, fat={}g",
                        result.getNutrition().getKcalEstimate(),
                        result.getNutrition().getProteinG(),
                        result.getNutrition().getCarbsG(),
                        result.getNutrition().getFatG());
            } else {
                log.warn("Nutrition이 null입니다!");
            }

            return result;

        } catch (WebClientResponseException e) {
            log.error("가성비 분석 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("가성비 분석 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("가성비 분석 오류", e);
            throw new RuntimeException("가성비 분석 중 오류 발생", e);
        }
    }

    /**
     * 비동기 가성비 분석
     * @param request 레시피 정보
     * @return Mono<CostAnalysisResult>
     */
    public Mono<CostAnalysisResult> analyzeCostAsync(CostAnalysisRequest request) {
        return aiWebClient.post()
                .uri("/api/gpt/cost-analysis")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(CostAnalysisResult.class)
                .timeout(Duration.ofMillis(aiProperties.getTimeout()))
                .doOnSuccess(result -> log.info("가성비 분석 비동기 완료: score={}", result.getOverallScore()))
                .doOnError(e -> log.error("가성비 분석 비동기 실패", e));
    }

    /**
     * AI 서버 헬스 체크
     * @return true: 정상, false: 비정상
     */
    public boolean healthCheck() {
        try {
            String response = aiWebClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            log.debug("AI 서버 헬스 체크: {}", response);
            return true;

        } catch (Exception e) {
            log.warn("AI 서버 헬스 체크 실패: {}", e.getMessage());
            return false;
        }
    }
}
