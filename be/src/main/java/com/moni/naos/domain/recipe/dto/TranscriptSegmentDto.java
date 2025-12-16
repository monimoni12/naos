package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.RecipeClipSegment;
import lombok.*;

/**
 * TranscriptSegmentDto - 전사 세그먼트 단위 DTO
 * 
 * Whisper가 반환하는 각 문장 단위
 * RecipeClipSegment 엔티티와 매핑
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptSegmentDto {

    /**
     * 세그먼트 ID (저장된 경우)
     */
    private Long id;

    /**
     * 순서 (0부터 시작)
     */
    private Integer index;

    /**
     * 시작 시간 (초)
     */
    private Double start;

    /**
     * 종료 시간 (초)
     */
    private Double end;

    /**
     * 전사된 텍스트
     */
    private String text;

    /**
     * Entity → DTO 변환
     */
    public static TranscriptSegmentDto fromEntity(RecipeClipSegment entity) {
        return TranscriptSegmentDto.builder()
                .id(entity.getId())
                .index(entity.getIndexOrd())
                .start(entity.getStartSec())
                .end(entity.getEndSec())
                .text(entity.getText())
                .build();
    }

    /**
     * Whisper 응답용 (id 없이)
     */
    public static TranscriptSegmentDto of(int index, Double start, Double end, String text) {
        return TranscriptSegmentDto.builder()
                .index(index)
                .start(start)
                .end(end)
                .text(text)
                .build();
    }

    /**
     * 세그먼트 길이 (초)
     */
    public Double getDuration() {
        if (start != null && end != null) {
            return end - start;
        }
        return null;
    }
}
