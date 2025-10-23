package com.moni.naos.domain.recipe.dto;

import com.moni.naos.domain.recipe.entity.Recipe;
import lombok.*;

/**
 * 레시피 상세/목록 응답 DTO
 * - caption: 전체 설명 (게시글 메시지)
 * - 각 클립 설명은 RecipeClipSegment.description 에 따로 저장됨
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeResponse {

    private Long id;                // DB PK
    private String title;           // 레시피 제목 (AI 자동 요약 or 사용자가 입력)
    private String caption;         // 전체 설명 (게시글 본문)
    private String category;        // 카테고리 (예: 한식, 양식)
    private String authorName;      // 작성자 닉네임 (User.name)
    private Integer servings;       // 인분 수 (AI 계산 or 수동)
    private Integer cookTimeMin;    // 조리 시간 (영상 길이 기반 추정)
    private Integer priceEstimate;  // 가격 추정 (AI 계산 예정)
    private Integer kcalEstimate;   // 칼로리 추정 (AI 계산 예정)
    private boolean hideLikeCount;  // 좋아요 수 숨김 (공개 설정)
    private boolean hideShareCount; // 공유 수 숨김 (공개 설정)
    private boolean disableComments;// 댓글 기능 해제 (공개 설정)
    private Double scorePopular;    // 인기 점수 (좋아요/북마크 수 기반)
    private Double scoreCost;       // 가성비 점수 (AI 계산 결과)
    private boolean liked;          // 현재 사용자 좋아요 여부
    private boolean bookmarked;     // 현재 사용자 북마크 여부

    // Entity → DTO 변환
    public static RecipeResponse fromEntity(Recipe recipe) {
        return RecipeResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle()) // “레시피 제목” 필드 — UI에는 아직 없지만 AI로 자동 생성될 가능성 대비
                .caption(recipe.getCaption())
                .category(recipe.getCategory())
                .authorName(recipe.getAuthor() != null ? recipe.getAuthor().getUsername() : null)
                .servings(recipe.getServings())       // 인분 수 (AI 분석 or null 가능)
                .cookTimeMin(recipe.getCookTimeMin()) // 조리 시간 (영상 길이 기반)
                .priceEstimate(recipe.getPriceEstimate())
                .kcalEstimate(recipe.getKcalEstimate()) // AI 영양 분석 결과
                .hideLikeCount(recipe.isHideLikeCount())
                .hideShareCount(recipe.isHideShareCount())
                .disableComments(recipe.isDisableComments())
                .scorePopular(recipe.getScorePopular())
                .scoreCost(recipe.getScoreCost())
                .liked(false)
                .bookmarked(false)
                .build();
    }
}
