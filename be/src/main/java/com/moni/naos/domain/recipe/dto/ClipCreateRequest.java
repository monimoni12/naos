package com.moni.naos.domain.recipe.dto;

import lombok.*;

/**
 * 클립 생성 요청 DTO
 * 
 * 클리핑 플로우:
 * 1. 프론트에서 Whisper STT로 전사
 * 2. 유저가 전사 텍스트 사이사이에 분할점 클릭
 * 3. 분할점 기준으로 클립 생성 → 이 DTO로 백엔드에 전달
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClipCreateRequest {

    private Integer orderIndex;     // 클립 순서 (0..n) → RecipeClip.indexOrd
    private String description;     // 해당 구간의 전사 텍스트 → RecipeClip.caption
    private Double startSec;        // 영상 시작 초 → RecipeClip.startSec
    private Double endSec;          // 영상 종료 초 → RecipeClip.endSec
}
