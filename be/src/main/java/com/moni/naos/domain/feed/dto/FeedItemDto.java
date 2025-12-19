package com.moni.naos.domain.feed.dto;

import com.moni.naos.domain.recipe.entity.Recipe;
import lombok.*;

import java.time.Instant;
import java.util.List;

/**
 * FeedItemDto - 피드 카드 응답 DTO
 * 
 * 피드에서 레시피 카드 하나에 표시될 정보
 * 
 * ⭐ 수정: clips 배열 추가 (홈 피드에서 슬라이드별 구간 재생용)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedItemDto {

    // ==================== 레시피 기본 정보 ====================
    
    private Long id;
    private String title;
    private String caption;
    private String category;
    private List<String> dietTags;
    
    // ==================== 조리 정보 ====================
    
    private Integer servings;           // 인분
    private Integer cookTimeMin;        // 조리 시간 (분)
    private Integer priceEstimate;      // 예상 가격 (원)
    private Integer kcalEstimate;       // 예상 칼로리
    private String difficulty;          // EASY, MEDIUM, HARD
    
    // ==================== 점수 ====================
    
    private Double scorePopular;            // 인기 점수
    private Double costEfficiencyScore;     // 가성비 점수
    
    // ==================== 미디어 ====================
    
    private String thumbnailUrl;        // 썸네일 URL
    private String videoUrl;            // 영상 URL
    private Integer videoDurationSec;   // 영상 전체 길이 (초)
    
    // ==================== 첫 번째 클립 (쇼츠/릴스용 - 레거시) ====================
    
    private Double firstClipStartSec;   // 첫 클립 시작 시간
    private Double firstClipEndSec;     // 첫 클립 종료 시간
    private String firstClipCaption;    // 첫 클립 캡션/텍스트
    private Integer totalClipCount;     // 전체 클립 개수
    
    // ==================== ⭐ 전체 클립 목록 (홈 피드 슬라이드용) ====================
    
    private List<ClipInfo> clips;
    
    // ==================== 작성자 정보 ====================
    
    private Long authorId;
    private String authorUsername;      // @아이디 (라우팅용)
    private String authorFullName;      // 성명 (화면 표시용)
    private String authorAvatarUrl;
    
    // ==================== 상호작용 정보 ====================
    
    private Long likeCount;
    private Long commentCount;
    private Long bookmarkCount;
    
    // ==================== 현재 유저 상태 ====================
    
    private Boolean isLiked;            // 내가 좋아요 했는지
    private Boolean isBookmarked;       // 내가 북마크 했는지
    private Boolean isFollowing;        // 작성자를 팔로우 중인지
    
    // ==================== 옵션 ====================
    
    private Boolean hideLikeCount;      // 좋아요 수 숨김 여부
    private Boolean disableComments;    // 댓글 비활성화 여부
    
    // ==================== 메타 ====================
    
    private Instant createdAt;
    private Instant updatedAt;
    
    // ==================== ⭐ 클립 정보 내부 클래스 ====================
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClipInfo {
        private Long id;
        private Integer indexOrd;
        private Double startSec;
        private Double endSec;
        private String caption;
    }
    
    // ==================== 정적 팩토리 메서드 ====================
    
    /**
     * Recipe 엔티티로부터 기본 정보만 생성
     * (상호작용 정보, 클립 정보는 별도로 세팅)
     */
    public static FeedItemDto fromRecipe(Recipe recipe) {
        return FeedItemDto.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .caption(recipe.getCaption())
                .category(recipe.getCategory())
                .dietTags(recipe.getDietTags())
                .servings(recipe.getServings())
                .cookTimeMin(recipe.getCookTimeMin())
                .priceEstimate(recipe.getPriceEstimate())
                .kcalEstimate(recipe.getKcalEstimate())
                .difficulty(recipe.getDifficulty() != null ? recipe.getDifficulty().name() : null)
                .scorePopular(recipe.getScorePopular())
                .costEfficiencyScore(recipe.getCostEfficiencyScore())
                .authorId(recipe.getAuthor().getId())
                .hideLikeCount(recipe.isHideLikeCount())
                .disableComments(recipe.isDisableComments())
                .createdAt(recipe.getCreatedAt())
                .updatedAt(recipe.getUpdatedAt())
                .build();
    }
}
