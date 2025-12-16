package com.moni.naos.domain.ai.controller;

import com.moni.naos.domain.ai.dto.AsrRequest;
import com.moni.naos.domain.ai.dto.AsrResult;
import com.moni.naos.domain.ai.dto.CostAnalysisRequest;
import com.moni.naos.domain.ai.dto.CostAnalysisResult;
import com.moni.naos.domain.ai.service.AiAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AiController - AI 분석 API
 * - Flask AI 서버 연동
 * - Whisper STT
 * - GPT 가성비 분석
 */
@Tag(name = "AI", description = "AI 분석 API (STT, 가성비)")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiAnalysisService aiAnalysisService;

    @Operation(summary = "AI 서버 상태 확인", description = "Flask AI 서버 연결 상태를 확인합니다.")
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        boolean healthy = aiAnalysisService.isAiServerHealthy();
        
        return ResponseEntity.ok(Map.of(
                "aiServerHealthy", healthy,
                "message", healthy ? "AI 서버 정상" : "AI 서버 연결 실패"
        ));
    }

    @Operation(summary = "레시피 가성비 분석", description = "레시피의 가성비 점수를 AI로 분석합니다.")
    @PostMapping("/analyze/cost/{recipeId}")
    public ResponseEntity<CostAnalysisResult> analyzeCost(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId,
            @RequestBody(required = false) List<CostAnalysisRequest.Ingredient> ingredients
    ) {
        CostAnalysisResult result = aiAnalysisService.analyzeAndSaveCostScore(recipeId, ingredients);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "영상 STT", description = "영상의 음성을 텍스트로 전사합니다.")
    @PostMapping("/stt")
    public ResponseEntity<AsrResult> transcribeVideo(
            @AuthenticationPrincipal Long userId,
            @RequestBody AsrRequest request
    ) {
        String videoUrl = request.getVideoUrl();
        
        if (videoUrl == null || videoUrl.isBlank()) {
            throw new IllegalArgumentException("videoUrl이 필요합니다.");
        }

        AsrResult result = aiAnalysisService.transcribeVideo(videoUrl);
        return ResponseEntity.ok(result);
    }
}
