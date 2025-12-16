package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.RecipeClip;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * ClipWithTextResponse - 클립 정보 + 해당 구간 텍스트
 *
 * 클립의 startSec~endSec 구간에 해당하는 전사 텍스트를 함께 반환
 * 
 * 표시 우선순위:
 * 1. caption (수동 입력된 캡션)
 * 2. transcriptText (자동 매핑된 전사 텍스트)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClipWithTextResponse {

    private Long id;
    private Long recipeId;

    /**
     * 클립 순서 (0부터 시작)
     */
    private Integer indexOrd;

    /**
     * 시작 시간 (초)
     */
    private Double startSec;

    /**
     * 종료 시간 (초)
     */
    private Double endSec;

    /**
     * 수동 입력된 캡션 (있으면 이걸 우선 사용)
     */
    private String caption;

    /**
     * 자동 매핑된 전사 텍스트 (해당 시간 구간)
     */
    private String transcriptText;

    /**
     * 해당 구간의 세그먼트들
     */
    @Builder.Default
    private List<TranscriptSegmentDto> segments = new ArrayList<>();

    /**
     * 클립 길이 (초)
     */
    private Double durationSec;

    /**
     * Entity → Response 변환 (텍스트 없이)
     */
    public static ClipWithTextResponse fromEntity(RecipeClip clip) {
        Double duration = null;
        if (clip.getStartSec() != null && clip.getEndSec() != null) {
            duration = clip.getEndSec() - clip.getStartSec();
        }

        return ClipWithTextResponse.builder()
                .id(clip.getId())
                .recipeId(clip.getRecipe().getId())
                .indexOrd(clip.getIndexOrd())
                .startSec(clip.getStartSec())
                .endSec(clip.getEndSec())
                .caption(clip.getCaption())
                .durationSec(duration)
                .segments(new ArrayList<>())
                .build();
    }

    /**
     * Entity + 텍스트 → Response 변환
     */
    public static ClipWithTextResponse fromEntityWithText(
            RecipeClip clip,
            String transcriptText,
            List<TranscriptSegmentDto> segments
    ) {
        ClipWithTextResponse response = fromEntity(clip);
        response.setTranscriptText(transcriptText);
        response.setSegments(segments != null ? segments : new ArrayList<>());
        return response;
    }

    /**
     * 표시할 텍스트 (caption 우선, 없으면 transcriptText)
     */
    public String getDisplayText() {
        if (caption != null && !caption.isBlank()) {
            return caption;
        }
        return transcriptText;
    }

    /**
     * 수동 캡션 여부
     */
    public boolean hasManualCaption() {
        return caption != null && !caption.isBlank();
    }

    /**
     * 전사 텍스트 존재 여부
     */
    public boolean hasTranscript() {
        return transcriptText != null && !transcriptText.isBlank();
    }
}
