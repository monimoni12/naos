package com.moni.naos.domain.ai.client;

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

    /**
     * 가성비 분석 요청
     * @param request 레시피 정보 (재료, 시간, 난이도 등)
     * @return 가성비 분석 결과 (점수 + breakdown)
     */
    public CostAnalysisResult analyzeCost(CostAnalysisRequest request) {
        log.info("가성비 분석 요청: recipeId={}, ingredients={}",
                request.getRecipeId(),
                request.getIngredients() != null ? request.getIngredients().size() : 0);

        try {
            CostAnalysisResult result = aiWebClient.post()
                    .uri("/api/gpt/cost-analysis")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(CostAnalysisResult.class)
                    .timeout(Duration.ofMillis(aiProperties.getTimeout()))
                    .block();

            log.info("가성비 분석 완료: recipeId={}, score={}",
                    request.getRecipeId(),
                    result != null ? result.getOverallScore() : null);

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
