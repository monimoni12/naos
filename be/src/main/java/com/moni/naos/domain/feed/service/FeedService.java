package com.moni.naos.domain.feed.service;

import com.moni.naos.domain.feed.dto.FeedFilterRequest;
import com.moni.naos.domain.feed.dto.FeedItemDto;
import com.moni.naos.domain.follow.repository.FollowRepository;
import com.moni.naos.domain.interaction.bookmark.repository.BookmarkRepository;
import com.moni.naos.domain.interaction.comment.repository.CommentRepository;
import com.moni.naos.domain.interaction.like.repository.LikeRepository;
import com.moni.naos.domain.recipe.entity.Recipe;
import com.moni.naos.domain.recipe.entity.RecipeAsset;
import com.moni.naos.domain.recipe.entity.RecipeClip;
import com.moni.naos.domain.recipe.repository.RecipeAssetRepository;
import com.moni.naos.domain.recipe.repository.RecipeClipRepository;
import com.moni.naos.domain.recipe.repository.RecipeRepository;
import com.moni.naos.domain.user.entity.User;
import com.moni.naos.domain.user.repository.ProfileRepository;
import com.moni.naos.global.rsdata.CursorPage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * FeedService - 피드 핵심 로직
 * 
 * 피드 모드:
 * - HOME: 전체 공개 레시피 (추천)
 * - FOLLOWING: 팔로잉한 유저의 레시피
 * - TRENDING: 인기순 정렬
 * - SHORTS: 쇼츠/릴스 (첫 번째 클립만 재생)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedService {

    private final RecipeRepository recipeRepository;
    private final RecipeAssetRepository recipeAssetRepository;
    private final RecipeClipRepository recipeClipRepository;
    private final FollowRepository followRepository;
    private final LikeRepository likeRepository;
    private final BookmarkRepository bookmarkRepository;
    private final CommentRepository commentRepository;
    private final ProfileRepository profileRepository;

    // ==================== 피드 모드별 조회 ====================

    /**
     * 홈 피드 (전체 공개 레시피)
     */
    public CursorPage<FeedItemDto> getHomeFeed(User currentUser, FeedFilterRequest filter) {
        List<Recipe> recipes = fetchRecipesWithFilter(filter, null);
        return buildFeedPage(recipes, currentUser, filter.getSize());
    }

    /**
     * 팔로잉 피드
     */
    public CursorPage<FeedItemDto> getFollowingFeed(User currentUser, FeedFilterRequest filter) {
        // 팔로잉 목록 조회
        List<Long> followingIds = followRepository.findFolloweeIdsByFollower(currentUser);
        
        if (followingIds.isEmpty()) {
            return CursorPage.empty();
        }
        
        List<Recipe> recipes = fetchRecipesWithFilter(filter, followingIds);
        return buildFeedPage(recipes, currentUser, filter.getSize());
    }

    /**
     * 트렌딩 피드 (인기순)
     */
    public CursorPage<FeedItemDto> getTrendingFeed(User currentUser, FeedFilterRequest filter) {
        List<Recipe> recipes = fetchTrendingRecipes(filter);
        return buildFeedPage(recipes, currentUser, filter.getSize());
    }

    /**
     * 쇼츠(릴스) 피드
     * - 기본적으로 트렌딩과 동일하지만 응답에 firstClip 정보 포함
     * - 프론트에서 firstClipStartSec ~ firstClipEndSec 구간만 재생
     */
    public CursorPage<FeedItemDto> getShortsFeed(User currentUser, FeedFilterRequest filter) {
        // 쇼츠는 인기순 + 짧은 영상 우선
        List<Recipe> recipes = fetchTrendingRecipes(filter);
        return buildFeedPage(recipes, currentUser, filter.getSize());
    }

    // ==================== 내부 메서드 ====================

    /**
     * 필터 조건에 맞는 레시피 조회
     */
    private List<Recipe> fetchRecipesWithFilter(FeedFilterRequest filter, List<Long> authorIds) {
        // TODO: QueryDSL 또는 Specification으로 동적 쿼리 최적화
        
        List<Recipe> allRecipes;
        
        if (authorIds != null && !authorIds.isEmpty()) {
            // 팔로잉 피드: 특정 작성자들의 레시피만
            allRecipes = recipeRepository.findAll().stream()
                    .filter(r -> r.getVisibility() == Recipe.Visibility.PUBLIC)
                    .filter(r -> authorIds.contains(r.getAuthor().getId()))
                    .collect(Collectors.toList());
        } else {
            // 홈 피드: 전체 공개 레시피
            allRecipes = recipeRepository.findByVisibilityOrderByCreatedAtDesc(Recipe.Visibility.PUBLIC);
        }
        
        // 필터 + 커서 + 정렬 적용
        return allRecipes.stream()
                .filter(r -> applyFilter(r, filter))
                .filter(r -> applyCursor(r, filter.getCursor(), filter.getSortBy()))
                .sorted(getComparator(filter.getSortBy()))
                .limit(filter.getSize() + 1) // +1 for hasNext check
                .collect(Collectors.toList());
    }

    /**
     * 트렌딩 레시피 조회 (인기순)
     */
    private List<Recipe> fetchTrendingRecipes(FeedFilterRequest filter) {
        List<Recipe> allRecipes = recipeRepository.findByVisibilityOrderByCreatedAtDesc(Recipe.Visibility.PUBLIC);
        
        return allRecipes.stream()
                .filter(r -> applyFilter(r, filter))
                .sorted(Comparator.comparing(Recipe::getScorePopular, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(filter.getSize() + 1)
                .collect(Collectors.toList());
    }

    /**
     * 필터 조건 적용
     */
    private boolean applyFilter(Recipe recipe, FeedFilterRequest filter) {
        // 가격 필터
        if (filter.getMaxPrice() != null && recipe.getPriceEstimate() != null) {
            if (recipe.getPriceEstimate() > filter.getMaxPrice()) {
                return false;
            }
        }
        
        // 조리시간 필터
        if (filter.getMaxCookTime() != null && recipe.getCookTimeMin() != null) {
            if (recipe.getCookTimeMin() > filter.getMaxCookTime()) {
                return false;
            }
        }
        
        // 카테고리 필터
        if (filter.hasCategory()) {
            if (!filter.getCategory().equals(recipe.getCategory())) {
                return false;
            }
        }
        
        // 난이도 필터
        if (filter.hasDifficulty()) {
            if (recipe.getDifficulty() != filter.getDifficulty()) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 커서 적용 (이미 본 레시피 제외)
     */
    private boolean applyCursor(Recipe recipe, Long cursor, FeedFilterRequest.SortBy sortBy) {
        if (cursor == null) {
            return true; // 커서 없으면 전부 포함
        }
        
        // 최신순: ID가 cursor보다 작은 것만
        return recipe.getId() < cursor;
    }

    /**
     * 정렬 기준 반환
     */
    private Comparator<Recipe> getComparator(FeedFilterRequest.SortBy sortBy) {
        if (sortBy == FeedFilterRequest.SortBy.COST_EFFICIENCY) {
            return Comparator.comparing(Recipe::getScoreCost, Comparator.nullsLast(Comparator.reverseOrder()));
        }
        // 기본: 최신순 (ID 역순)
        return Comparator.comparing(Recipe::getId, Comparator.reverseOrder());
    }

    /**
     * 피드 페이지 빌드
     */
    private CursorPage<FeedItemDto> buildFeedPage(List<Recipe> recipes, User currentUser, int pageSize) {
        boolean hasNext = recipes.size() > pageSize;
        
        if (hasNext) {
            recipes = recipes.subList(0, pageSize);
        }
        
        List<FeedItemDto> items = recipes.stream()
                .map(recipe -> enrichFeedItem(recipe, currentUser))
                .collect(Collectors.toList());
        
        Long nextCursor = hasNext && !items.isEmpty() 
                ? items.get(items.size() - 1).getId() 
                : null;
        
        return CursorPage.of(items, nextCursor, hasNext);
    }

    /**
     * 피드 아이템에 추가 정보 채우기
     */
    private FeedItemDto enrichFeedItem(Recipe recipe, User currentUser) {
        FeedItemDto item = FeedItemDto.fromRecipe(recipe);
        
        // 작성자 프로필 정보
        profileRepository.findByUser(recipe.getAuthor()).ifPresent(profile -> {
            item.setAuthorUsername(profile.getUsername());
            item.setAuthorFullName(profile.getFullName());
            item.setAuthorAvatarUrl(profile.getAvatarUrl());
        });
        
        // 미디어 정보
        recipeAssetRepository.findFirstByRecipeAndType(recipe, RecipeAsset.Type.THUMB)
                .ifPresent(asset -> item.setThumbnailUrl(asset.getUrl()));
        
        recipeAssetRepository.findFirstByRecipeAndType(recipe, RecipeAsset.Type.VIDEO)
                .ifPresent(asset -> {
                    item.setVideoUrl(asset.getUrl());
                    item.setVideoDurationSec(asset.getDurationS());
                });
        
        // 첫 번째 클립 정보 (쇼츠/릴스용)
        List<RecipeClip> clips = recipeClipRepository.findByRecipeOrderByIndexOrdAsc(recipe);
        item.setTotalClipCount(clips.size());
        
        if (!clips.isEmpty()) {
            RecipeClip firstClip = clips.get(0);
            item.setFirstClipStartSec(firstClip.getStartSec());
            item.setFirstClipEndSec(firstClip.getEndSec());
            item.setFirstClipCaption(firstClip.getCaption());
        }
        
        // 상호작용 수
        item.setLikeCount(likeRepository.countByRecipe(recipe));
        item.setBookmarkCount(bookmarkRepository.countByRecipe(recipe));
        item.setCommentCount(commentRepository.countByRecipe(recipe));
        
        // 현재 유저 상태
        if (currentUser != null) {
            item.setIsLiked(likeRepository.existsByUserAndRecipe(currentUser, recipe));
            item.setIsBookmarked(bookmarkRepository.existsByUserAndRecipe(currentUser, recipe));
            item.setIsFollowing(followRepository.existsByFollowerAndFollowee(currentUser, recipe.getAuthor()));
        } else {
            item.setIsLiked(false);
            item.setIsBookmarked(false);
            item.setIsFollowing(false);
        }
        
        return item;
    }
}
