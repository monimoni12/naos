package com.moni.naos.domain.recipe.dto;

import lombok.*;

import java.util.List;

/**
 * 레시피 등록/수정 요청 DTO
 * 
 * 업로드 플로우 마지막 단계에서 사용:
 * - 제목, 설명, 카테고리
 * - 인분, 조리시간
 * - 공개 설정 (좋아요 숨김, 댓글 비활성화 등)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeRequest {

    private String title;           // 레시피 제목
    private String caption;         // 본문 설명
    private String category;        // 카테고리 (한식, 양식 등)
    private Integer servings;       // 인분 수
    private Integer cookTimeMin;    // 조리 시간 (분)
    private Integer priceEstimate;  // 1인분 가격 추정
    private Integer kcalEstimate;   // 1인분 칼로리 추정

    // 공개 설정
    private boolean hideLikeCount;
    private boolean hideShareCount;
    private boolean disableComments;

    private String thumbnailUrl;    // 썸네일 URL
    private List<String> dietTags;  // 식단 태그 (고단백, 저탄수 등)
}
