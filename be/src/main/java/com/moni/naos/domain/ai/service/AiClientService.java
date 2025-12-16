package com.moni.naos.domain.ai.service;

import com.moni.naos.domain.recipe.dto.TranscriptResponse;
import com.moni.naos.domain.recipe.dto.TranscriptSegmentDto;
import com.moni.naos.domain.recipe.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AiClientService - Flask AI 서버 호출 클라이언트
 *
 * 기능:
 * 1. Whisper 전사 요청
 * 2. GPT 가성비 분석 요청
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientService {

    private final RestTemplate restTemplate;
    private final TranscriptService transcriptService;

    @Value("${ai.server.url:http://localhost:5000}")
    private String aiServerUrl;

    // ==================== Whisper 전사 ====================

    /**
     * 전사만 요청 (저장은 Spring에서 직접)
     *
     * @param videoUrl S3 영상 URL
     * @return 전사 결과
     */
    public TranscriptResult transcribe(String videoUrl) {
        String url = aiServerUrl + "/api/whisper/transcribe";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("videoUrl", videoUrl);
        requestBody.put("language", "ko");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                return parseTranscriptResult(body);
            }

            log.error("전사 요청 실패: {}", response.getStatusCode());
            return null;

        } catch (Exception e) {
            log.error("전사 요청 예외: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 전사 요청 + DB 저장 (한 번에)
     *
     * @param recipeId 레시피 ID
     * @param videoUrl S3 영상 URL
     * @return 저장된 전사 결과
     */
    public TranscriptResponse transcribeAndSave(Long recipeId, String videoUrl) {
        // Step 1: 전사 시작 상태로 변경
        transcriptService.startProcessing(recipeId);

        // Step 2: Flask에 전사 요청
        TranscriptResult result = transcribe(videoUrl);

        if (result == null) {
            transcriptService.markFailed(recipeId, "Flask 서버 호출 실패");
            return TranscriptResponse.notFound(recipeId);
        }

        // Step 3: 음성 없음 체크
        if (result.getSegments().isEmpty() || result.getFullText().length() < 10) {
            transcriptService.markNoAudio(recipeId);
            return transcriptService.getTranscript(recipeId);
        }

        // Step 4: DB에 저장
        return transcriptService.saveTranscript(
                recipeId,
                result.getFullText(),
                result.getSegments(),
                result.getLanguage(),
                result.getDuration()
        );
    }

    /**
     * Flask 응답 파싱
     */
    private TranscriptResult parseTranscriptResult(Map<String, Object> body) {
        String fullText = (String) body.getOrDefault("fullText", "");
        String language = (String) body.getOrDefault("language", "ko");
        Double duration = body.get("duration") != null
                ? ((Number) body.get("duration")).doubleValue()
                : null;

        List<TranscriptSegmentDto> segments = new ArrayList<>();
        List<Map<String, Object>> segmentList = (List<Map<String, Object>>) body.get("segments");

        if (segmentList != null) {
            for (Map<String, Object> seg : segmentList) {
                Integer index = seg.get("index") != null
                        ? ((Number) seg.get("index")).intValue()
                        : null;
                Double start = seg.get("start") != null
                        ? ((Number) seg.get("start")).doubleValue()
                        : null;
                Double end = seg.get("end") != null
                        ? ((Number) seg.get("end")).doubleValue()
                        : null;
                String text = (String) seg.getOrDefault("text", "");

                segments.add(TranscriptSegmentDto.builder()
                        .index(index)
                        .start(start)
                        .end(end)
                        .text(text)
                        .build());
            }
        }

        return TranscriptResult.builder()
                .fullText(fullText)
                .segments(segments)
                .language(language)
                .duration(duration)
                .build();
    }

    // ==================== GPT 가성비 분석 ====================

    /**
     * 가성비 분석 요청
     *
     * @param request 분석 요청 데이터
     * @return 가성비 점수 결과
     */
    public CostAnalysisResult analyzeCost(CostAnalysisRequest request) {
        String url = aiServerUrl + "/api/gpt/cost-analysis";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CostAnalysisRequest> httpRequest = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, httpRequest, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                return parseCostAnalysisResult(body);
            }

            log.error("가성비 분석 요청 실패: {}", response.getStatusCode());
            return null;

        } catch (Exception e) {
            log.error("가성비 분석 요청 예외: {}", e.getMessage());
            return null;
        }
    }

    private CostAnalysisResult parseCostAnalysisResult(Map<String, Object> body) {
        Integer overallScore = body.get("overallScore") != null
                ? ((Number) body.get("overallScore")).intValue()
                : 0;
        Integer totalCost = body.get("estimatedTotalCost") != null
                ? ((Number) body.get("estimatedTotalCost")).intValue()
                : 0;
        String comment = (String) body.getOrDefault("comment", "");

        Map<String, Integer> breakdown = new HashMap<>();
        Map<String, Object> breakdownMap = (Map<String, Object>) body.get("breakdown");
        if (breakdownMap != null) {
            for (Map.Entry<String, Object> entry : breakdownMap.entrySet()) {
                if (entry.getValue() instanceof Number) {
                    breakdown.put(entry.getKey(), ((Number) entry.getValue()).intValue());
                }
            }
        }

        return CostAnalysisResult.builder()
                .recipeId((Long) body.get("recipeId"))
                .overallScore(overallScore)
                .breakdown(breakdown)
                .estimatedTotalCost(totalCost)
                .comment(comment)
                .build();
    }

    // ==================== Health Check ====================

    /**
     * AI 서버 상태 확인
     */
    public boolean isHealthy() {
        String url = aiServerUrl + "/health";

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.warn("AI 서버 연결 실패: {}", e.getMessage());
            return false;
        }
    }

    // ==================== Inner Classes ====================

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TranscriptResult {
        private String fullText;
        private List<TranscriptSegmentDto> segments;
        private String language;
        private Double duration;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CostAnalysisRequest {
        private Long recipeId;
        private String title;
        private List<IngredientInfo> ingredients;
        private Integer cookingTimeMinutes;
        private String difficulty;
        private Integer caloriesPerServing;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class IngredientInfo {
        private String name;
        private String quantity;
        private String unit;
        private Integer estimatedPrice;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CostAnalysisResult {
        private Long recipeId;
        private Integer overallScore;
        private Map<String, Integer> breakdown;
        private Integer estimatedTotalCost;
        private String comment;
    }
}
