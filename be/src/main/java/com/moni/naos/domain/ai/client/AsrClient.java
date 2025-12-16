package com.moni.naos.domain.ai.client;

import com.moni.naos.domain.ai.dto.AsrRequest;
import com.moni.naos.domain.ai.dto.AsrResult;
import com.moni.naos.global.config.ExternalEndpointProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Whisper STT 클라이언트
 * - Flask AI 서버의 /api/whisper/transcribe 호출
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AsrClient {

    private final WebClient aiWebClient;
    private final ExternalEndpointProperties aiProperties;

    /**
     * 영상 URL로 STT 수행
     * @param videoUrl S3 영상 URL
     * @return STT 결과 (텍스트 + 타임스탬프)
     */
    public AsrResult transcribe(String videoUrl) {
        return transcribe(videoUrl, "ko");
    }

    /**
     * 영상 URL로 STT 수행 (언어 지정)
     * @param videoUrl S3 영상 URL
     * @param language 언어 코드 (ko, en 등)
     * @return STT 결과
     */
    public AsrResult transcribe(String videoUrl, String language) {
        AsrRequest request = AsrRequest.builder()
                .videoUrl(videoUrl)
                .language(language)
                .build();

        log.info("Whisper STT 요청: videoUrl={}, language={}", videoUrl, language);

        try {
            AsrResult result = aiWebClient.post()
                    .uri("/api/whisper/transcribe")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AsrResult.class)
                    .timeout(Duration.ofMillis(aiProperties.getTimeout()))
                    .block();

            log.info("Whisper STT 완료: segments={}, processingTime={}s",
                    result != null && result.getSegments() != null ? result.getSegments().size() : 0,
                    result != null ? result.getProcessingTime() : null);

            return result;

        } catch (WebClientResponseException e) {
            log.error("Whisper STT 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("STT 처리 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Whisper STT 오류", e);
            throw new RuntimeException("STT 처리 중 오류 발생", e);
        }
    }

    /**
     * 비동기 STT 수행
     * @param videoUrl S3 영상 URL
     * @return Mono<AsrResult>
     */
    public Mono<AsrResult> transcribeAsync(String videoUrl) {
        AsrRequest request = AsrRequest.builder()
                .videoUrl(videoUrl)
                .language("ko")
                .build();

        return aiWebClient.post()
                .uri("/api/whisper/transcribe")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AsrResult.class)
                .timeout(Duration.ofMillis(aiProperties.getTimeout()))
                .doOnSuccess(result -> log.info("Whisper STT 비동기 완료"))
                .doOnError(e -> log.error("Whisper STT 비동기 실패", e));
    }
}
