package com.moni.naos.domain.feed.controller;

import com.moni.naos.domain.feed.dto.FeedFilterRequest;
import com.moni.naos.domain.feed.dto.FeedItemDto;
import com.moni.naos.domain.feed.service.FeedService;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.global.rsdata.ApiResponse;
import com.moni.naos.global.rsdata.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * FeedController - 피드 API
 * 
 * 피드 모드:
 * - GET /api/feed?mode=home       : 홈 피드 (추천)
 * - GET /api/feed?mode=following  : 팔로잉 피드
 * - GET /api/feed?mode=trending   : 트렌딩 피드 (인기순)
 * - GET /api/feed?mode=shorts     : 쇼츠(릴스) 피드
 * 
 * ⭐ 수정: @CurrentUser User → @AuthenticationPrincipal Long userId
 */
@Slf4j
@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
@Tag(name = "Feed", description = "피드 API")
public class FeedController {

    private final FeedService feedService;

    /**
     * 피드 조회 (통합 API)
     */
    @GetMapping
    @Operation(summary = "피드 조회", description = "모드별 피드를 조회합니다")
    public ResponseEntity<ApiResponse<CursorPage<FeedItemDto>>> getFeed(
            @Parameter(description = "피드 모드 (home, following, trending, shorts)")
            @RequestParam(defaultValue = "home") String mode,
            
            @Parameter(description = "최대 가격 (원)")
            @RequestParam(required = false) Integer maxPrice,
            
            @Parameter(description = "최대 조리시간 (분)")
            @RequestParam(required = false) Integer maxCookTime,
            
            @Parameter(description = "카테고리")
            @RequestParam(required = false) String category,
            
            @Parameter(description = "난이도 (EASY, MEDIUM, HARD)")
            @RequestParam(required = false) String difficulty,
            
            @Parameter(description = "정렬 (RECENT, COST_EFFICIENCY)")
            @RequestParam(defaultValue = "RECENT") String sortBy,
            
            @Parameter(description = "커서 (마지막 레시피 ID)")
            @RequestParam(required = false) Long cursor,
            
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "20") Integer size,
            
            @AuthenticationPrincipal Long userId  // ⭐ 수정: User → Long
    ) {
        // 필터 객체 생성
        FeedFilterRequest filter = FeedFilterRequest.builder()
                .maxPrice(maxPrice != null ? maxPrice : 50000)
                .maxCookTime(maxCookTime != null ? maxCookTime : 120)
                .category(category)
                .difficulty(parseDifficulty(difficulty))
                .sortBy(parseSortBy(sortBy))
                .cursor(cursor)
                .size(Math.min(size, 50))
                .build();

        CursorPage<FeedItemDto> result;

        switch (mode.toLowerCase()) {
            case "following":
                if (userId == null) {
                    return ResponseEntity.ok(ApiResponse.success(CursorPage.empty()));
                }
                result = feedService.getFollowingFeed(userId, filter);  // ⭐ Long 전달
                break;
                
            case "trending":
            case "hot":
                result = feedService.getTrendingFeed(userId, filter);
                break;
                
            case "shorts":
            case "reels":
                result = feedService.getShortsFeed(userId, filter);
                break;
                
            case "home":
            default:
                result = feedService.getHomeFeed(userId, filter);
                break;
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ==================== 단축 API ====================

    @GetMapping("/home")
    @Operation(summary = "홈 피드", description = "홈 피드를 조회합니다")
    public ResponseEntity<ApiResponse<CursorPage<FeedItemDto>>> getHomeFeed(
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Integer maxCookTime,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "RECENT") String sortBy,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") Integer size,
            @AuthenticationPrincipal Long userId  // ⭐ 수정
    ) {
        return getFeed("home", maxPrice, maxCookTime, category, difficulty, sortBy, cursor, size, userId);
    }

    @GetMapping("/following")
    @Operation(summary = "팔로잉 피드", description = "팔로잉한 유저들의 레시피를 조회합니다")
    public ResponseEntity<ApiResponse<CursorPage<FeedItemDto>>> getFollowingFeed(
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Integer maxCookTime,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "RECENT") String sortBy,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") Integer size,
            @AuthenticationPrincipal Long userId  // ⭐ 수정
    ) {
        return getFeed("following", maxPrice, maxCookTime, category, difficulty, sortBy, cursor, size, userId);
    }

    @GetMapping("/trending")
    @Operation(summary = "트렌딩 피드", description = "인기 레시피를 조회합니다")
    public ResponseEntity<ApiResponse<CursorPage<FeedItemDto>>> getTrendingFeed(
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Integer maxCookTime,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") Integer size,
            @AuthenticationPrincipal Long userId  // ⭐ 수정
    ) {
        return getFeed("trending", maxPrice, maxCookTime, category, difficulty, "RECENT", cursor, size, userId);
    }

    @GetMapping("/shorts")
    @Operation(summary = "쇼츠 피드", description = "쇼츠(릴스) 피드를 조회합니다")
    public ResponseEntity<ApiResponse<CursorPage<FeedItemDto>>> getShortsFeed(
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Integer maxCookTime,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") Integer size,
            @AuthenticationPrincipal Long userId  // ⭐ 수정
    ) {
        return getFeed("shorts", maxPrice, maxCookTime, category, difficulty, "RECENT", cursor, size, userId);
    }

    // ==================== 헬퍼 메서드 ====================

    private Recipe.Difficulty parseDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return null;
        }
        try {
            return Recipe.Difficulty.valueOf(difficulty.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private FeedFilterRequest.SortBy parseSortBy(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return FeedFilterRequest.SortBy.RECENT;
        }
        try {
            return FeedFilterRequest.SortBy.valueOf(sortBy.toUpperCase());
        } catch (IllegalArgumentException e) {
            return FeedFilterRequest.SortBy.RECENT;
        }
    }
}
