package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.RecipeTranscriptMeta;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * TranscriptResponse - 전사 결과 응답 DTO
 * 
 * 포함 내용:
 * - 전사 메타데이터 (상태, 언어, 영상 길이)
 * - 전체 전사 텍스트
 * - 세그먼트 목록
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptResponse {

    private Long id;
    private Long recipeId;

    /**
     * 전체 전사 텍스트
     */
    private String fullText;

    /**
     * 세그먼트 목록
     */
    @Builder.Default
    private List<TranscriptSegmentDto> segments = new ArrayList<>();

    /**
     * 감지된 언어
     */
    private String detectedLanguage;

    /**
     * 영상 길이 (초)
     */
    private Double durationSec;

    /**
     * 세그먼트 개수
     */
    private Integer segmentCount;

    /**
     * 전사 상태
     * PENDING, PROCESSING, COMPLETED, FAILED, NO_AUDIO
     */
    private String status;

    /**
     * 에러 메시지
     */
    private String errorMessage;

    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Meta Entity → Response 변환 (세그먼트 없이)
     */
    public static TranscriptResponse fromMeta(RecipeTranscriptMeta meta) {
        return TranscriptResponse.builder()
                .id(meta.getId())
                .recipeId(meta.getRecipe().getId())
                .fullText(meta.getFullText())
                .detectedLanguage(meta.getDetectedLanguage())
                .durationSec(meta.getDurationSec())
                .segmentCount(meta.getSegmentCount())
                .status(meta.getStatus().name())
                .errorMessage(meta.getErrorMessage())
                .createdAt(meta.getCreatedAt())
                .updatedAt(meta.getUpdatedAt())
                .segments(new ArrayList<>())
                .build();
    }

    /**
     * Meta + Segments → Response 변환
     */
    public static TranscriptResponse fromMetaWithSegments(
            RecipeTranscriptMeta meta,
            List<TranscriptSegmentDto> segments
    ) {
        TranscriptResponse response = fromMeta(meta);
        response.setSegments(segments != null ? segments : new ArrayList<>());
        return response;
    }

    /**
     * 빈 응답 (전사 없음)
     */
    public static TranscriptResponse notFound(Long recipeId) {
        return TranscriptResponse.builder()
                .recipeId(recipeId)
                .status("NOT_FOUND")
                .segments(new ArrayList<>())
                .build();
    }

    /**
     * 전사 완료 여부
     */
    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }

    /**
     * 전사 처리중 여부
     */
    public boolean isProcessing() {
        return "PROCESSING".equals(status);
    }

    /**
     * 수동 입력 필요 여부
     */
    public boolean needsManualInput() {
        return "NO_AUDIO".equals(status) || "FAILED".equals(status);
    }
}
