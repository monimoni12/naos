package com.moni.naos.domain.recipe.controller;

import com.moni.naos.domain.recipe.dto.ClipWithTextResponse;
import com.moni.naos.domain.recipe.dto.TranscriptResponse;
import com.moni.naos.domain.recipe.dto.TranscriptSegmentDto;
import com.moni.naos.domain.recipe.service.TranscriptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * TranscriptController - 전사(Transcript) API
 *
 * 기능:
 * 1. Whisper 전사 결과 저장 (Flask AI 서버에서 호출)
 * 2. 전사 결과 조회
 * 3. 클립별 텍스트 조회 (시간 구간 기반)
 * 4. 수동 텍스트 입력
 */
@Tag(name = "Transcript", description = "전사(STT) API")
@RestController
@RequestMapping("/api/transcripts")
@RequiredArgsConstructor
public class TranscriptController {

    private final TranscriptService transcriptService;

    // ==================== 전사 결과 저장 (AI 서버용) ====================

    @Operation(summary = "전사 결과 저장", description = "Whisper 전사 결과를 저장합니다. (AI 서버에서 호출)")
    @PostMapping("/{recipeId}")
    public ResponseEntity<TranscriptResponse> saveTranscript(
            @PathVariable Long recipeId,
            @RequestBody TranscriptSaveRequest request
    ) {
        TranscriptResponse response = transcriptService.saveTranscript(
                recipeId,
                request.getFullText(),
                request.getSegments(),
                request.getLanguage(),
                request.getDuration()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "전사 시작", description = "전사 처리 시작을 기록합니다.")
    @PostMapping("/{recipeId}/start")
    public ResponseEntity<Map<String, String>> startProcessing(
            @PathVariable Long recipeId
    ) {
        transcriptService.startProcessing(recipeId);
        return ResponseEntity.ok(Map.of("status", "processing", "message", "전사 처리 시작"));
    }

    @Operation(summary = "전사 실패 처리", description = "전사 실패를 기록합니다.")
    @PostMapping("/{recipeId}/fail")
    public ResponseEntity<Map<String, String>> markFailed(
            @PathVariable Long recipeId,
            @RequestBody Map<String, String> body
    ) {
        String errorMessage = body.getOrDefault("error", "Unknown error");
        transcriptService.markFailed(recipeId, errorMessage);
        return ResponseEntity.ok(Map.of("status", "failed", "message", errorMessage));
    }

    @Operation(summary = "음성 없음 처리", description = "영상에 음성이 없음을 기록합니다.")
    @PostMapping("/{recipeId}/no-audio")
    public ResponseEntity<Map<String, String>> markNoAudio(
            @PathVariable Long recipeId
    ) {
        transcriptService.markNoAudio(recipeId);
        return ResponseEntity.ok(Map.of("status", "no_audio", "message", "수동 입력이 필요합니다."));
    }

    // ==================== 전사 결과 조회 ====================

    @Operation(summary = "전사 결과 조회", description = "레시피의 전체 전사 결과를 조회합니다.")
    @GetMapping("/{recipeId}")
    public ResponseEntity<TranscriptResponse> getTranscript(
            @PathVariable Long recipeId
    ) {
        TranscriptResponse response = transcriptService.getTranscript(recipeId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "전사 상태 조회", description = "전사 처리 상태를 확인합니다.")
    @GetMapping("/{recipeId}/status")
    public ResponseEntity<Map<String, String>> getStatus(
            @PathVariable Long recipeId
    ) {
        String status = transcriptService.getTranscriptStatus(recipeId);
        return ResponseEntity.ok(Map.of("status", status));
    }

    @Operation(summary = "전사 완료 여부", description = "전사가 완료되었는지 확인합니다.")
    @GetMapping("/{recipeId}/completed")
    public ResponseEntity<Map<String, Boolean>> isCompleted(
            @PathVariable Long recipeId
    ) {
        boolean completed = transcriptService.hasCompletedTranscript(recipeId);
        return ResponseEntity.ok(Map.of("completed", completed));
    }

    // ==================== 시간 구간 → 텍스트 조회 ====================

    @Operation(summary = "시간 구간 텍스트 조회", description = "특정 시간 구간의 전사 텍스트를 조회합니다.")
    @GetMapping("/{recipeId}/range")
    public ResponseEntity<Map<String, Object>> getTextForRange(
            @PathVariable Long recipeId,
            @RequestParam Double startSec,
            @RequestParam Double endSec
    ) {
        String text = transcriptService.getTextForTimeRange(recipeId, startSec, endSec);
        List<TranscriptSegmentDto> segments = transcriptService.getSegmentsForTimeRange(recipeId, startSec, endSec);

        return ResponseEntity.ok(Map.of(
                "recipeId", recipeId,
                "startSec", startSec,
                "endSec", endSec,
                "text", text,
                "segments", segments,
                "segmentCount", segments.size()
        ));
    }

    // ==================== 클립 + 텍스트 조회 ====================

    @Operation(summary = "레시피 클립 + 텍스트 목록", description = "레시피의 모든 클립과 해당 구간 텍스트를 조회합니다.")
    @GetMapping("/{recipeId}/clips")
    public ResponseEntity<List<ClipWithTextResponse>> getClipsWithText(
            @PathVariable Long recipeId
    ) {
        List<ClipWithTextResponse> response = transcriptService.getClipsWithText(recipeId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "클립 + 텍스트 조회", description = "특정 클립과 해당 구간 텍스트를 조회합니다.")
    @GetMapping("/clips/{clipId}")
    public ResponseEntity<ClipWithTextResponse> getClipWithText(
            @PathVariable Long clipId
    ) {
        ClipWithTextResponse response = transcriptService.getClipWithText(clipId);
        return ResponseEntity.ok(response);
    }

    // ==================== 수동 텍스트 입력 ====================

    @Operation(summary = "클립 캡션 수정", description = "클립의 캡션을 수동으로 입력/수정합니다.")
    @PutMapping("/clips/{clipId}/caption")
    public ResponseEntity<ClipWithTextResponse> updateClipCaption(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long clipId,
            @RequestBody Map<String, String> body
    ) {
        String caption = body.get("caption");
        ClipWithTextResponse response = transcriptService.updateClipCaption(clipId, caption);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "전체 텍스트 수동 입력", description = "전체 전사 텍스트를 수동으로 입력/수정합니다.")
    @PutMapping("/{recipeId}/fulltext")
    public ResponseEntity<TranscriptResponse> updateFullText(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long recipeId,
            @RequestBody Map<String, String> body
    ) {
        String fullText = body.get("fullText");
        TranscriptResponse response = transcriptService.updateFullText(recipeId, fullText);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "세그먼트 텍스트 수정", description = "개별 세그먼트의 텍스트를 수정합니다.")
    @PutMapping("/segments/{segmentId}")
    public ResponseEntity<TranscriptSegmentDto> updateSegmentText(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long segmentId,
            @RequestBody Map<String, String> body
    ) {
        String text = body.get("text");
        TranscriptSegmentDto response = transcriptService.updateSegmentText(segmentId, text);
        return ResponseEntity.ok(response);
    }

    // ==================== Request DTO ====================

    @lombok.Data
    public static class TranscriptSaveRequest {
        private String fullText;
        private List<TranscriptSegmentDto> segments;
        private String language;
        private Double duration;
    }
}
