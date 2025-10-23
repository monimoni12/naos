package com.moni.naos.domain.recipe.dto;

import lombok.*;

/**
 * RecipeRequest
 * - 레시피 등록 요청 DTO
 * - RecipeService에서 사용하는 모든 필드 포함
 * - 일부 값은 null 가능 (AI/후처리 단계에서 채워짐)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeRequest {

    private String title;           // 레시피 제목 (AI 자동 or 수동 입력)
    private String caption;         // 본문 메시지 (게시글 설명)
    private String category;        // 카테고리 (예: 한식, 양식)
    private Integer servings;       // 인분 수 (optional)
    private Integer cookTimeMin;    // 조리 시간 (optional)
    private Integer priceEstimate;  // 1인분 가격 추정 (optional)
    private Integer kcalEstimate;   // 1인분 칼로리 추정 (optional)

    // 공개 설정 (UI의 toggle switch 세 가지)
    private boolean hideLikeCount;  // 좋아요 수 숨김
    private boolean hideShareCount; // 공유 수 숨김
    private boolean disableComments;// 댓글 기능 해제

    private String thumbnailUrl;    // 업로드된 썸네일 경로 (optional)

    // ⚙️ TODO: 추후 확장
    // - dietTags (List<String>) : 식단 필터 (예: 고단백, 저탄수 등)
    // - aiGenerated : AI 기반 생성 여부
}
