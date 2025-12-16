package com.moni.naos.domain.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Whisper STT 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsrResult {

    /** 전체 텍스트 */
    private String fullText;

    /** 세그먼트 목록 (타임스탬프 포함) */
    private List<Segment> segments;

    /** 감지된 언어 */
    private String detectedLanguage;

    /** 처리 시간 (초) */
    private Double processingTime;

    /**
     * 세그먼트 (문장별 타임스탬프)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Segment {

        /** 세그먼트 ID */
        private Integer id;

        /** 시작 시간 (초) */
        private Double start;

        /** 종료 시간 (초) */
        private Double end;

        /** 텍스트 내용 */
        private String text;
    }
}
