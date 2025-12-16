package com.moni.naos.domain.feed.dto;

import com.moni.naos.domain.recipe.entity.Recipe;
import lombok.*;

/**
 * FeedFilterRequest - 피드 필터 조건 DTO
 * 
 * UI 필터 탭에서 전달되는 조건들
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedFilterRequest {

    // ==================== 필터 조건 ====================
    
    /**
     * 최대 가격 (원)
     * 기본값: 50000
     * 슬라이더: 0 ~ 50,000원
     */
    @Builder.Default
    private Integer maxPrice = 50000;
    
    /**
     * 최대 조리 시간 (분)
     * 기본값: 120
     * 슬라이더: 0 ~ 120분
     */
    @Builder.Default
    private Integer maxCookTime = 120;
    
    /**
     * 카테고리
     * null 또는 빈 문자열 = 전체
     * 옵션: 반찬, 간식, 저탄수화물, 저염식, 고단백, 비건
     */
    private String category;
    
    /**
     * 난이도
     * null = 전체
     * 옵션: EASY(쉬움), MEDIUM(보통), HARD(어려움)
     */
    private Recipe.Difficulty difficulty;
    
    // ==================== 정렬 ====================
    
    /**
     * 정렬 기준
     * RECENT: 최신순 (기본값)
     * COST_EFFICIENCY: 가성비순
     */
    @Builder.Default
    private SortBy sortBy = SortBy.RECENT;
    
    // ==================== 커서 페이지네이션 ====================
    
    /**
     * 커서 (마지막으로 본 레시피 ID)
     * null이면 처음부터
     */
    private Long cursor;
    
    /**
     * 페이지 크기
     * 기본값: 20
     */
    @Builder.Default
    private Integer size = 20;
    
    // ==================== Enums ====================
    
    public enum SortBy {
        RECENT,          // 최신순
        COST_EFFICIENCY  // 가성비순
    }
    
    // ==================== 유틸리티 ====================
    
    /**
     * 카테고리 필터가 있는지 확인
     */
    public boolean hasCategory() {
        return category != null && !category.isBlank();
    }
    
    /**
     * 난이도 필터가 있는지 확인
     */
    public boolean hasDifficulty() {
        return difficulty != null;
    }
    
    /**
     * 기본 필터 생성
     */
    public static FeedFilterRequest defaults() {
        return FeedFilterRequest.builder().build();
    }
}
