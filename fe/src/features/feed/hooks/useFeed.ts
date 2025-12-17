'use client';

import { useState, useEffect, useCallback } from 'react';
import { feedApi } from '../api/feedApi';
import type { FeedItem, FeedMode, FilterValues, CursorPage } from '../types';

interface UseFeedOptions {
  mode?: FeedMode;
  initialFilters?: FilterValues;
}

export function useFeed({
  mode = 'home',
  initialFilters = {},
}: UseFeedOptions = {}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 피드 로드
  const loadFeed = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setItems([]);
        }
        setError(null);

        const response: CursorPage<FeedItem> = await feedApi.getFeed(mode, {
          maxPrice: filters.maxPrice,
          maxCookTime: filters.maxCookTime,
          category: filters.category,
          difficulty: filters.difficulty as
            | 'EASY'
            | 'MEDIUM'
            | 'HARD'
            | undefined,
          sortBy: filters.sortBy,
          cursor: isLoadMore ? cursor ?? undefined : undefined,
          size: 20,
        });

        if (isLoadMore) {
          setItems((prev) => [...prev, ...response.content]);
        } else {
          setItems(response.content);
        }
        setCursor(response.nextCursor);
        setHasNext(response.hasNext);
      } catch (err) {
        console.error('Feed load error:', err);
        setError('피드를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mode, filters, cursor]
  );

  // 초기 로드 & 필터 변경시 리로드
  useEffect(() => {
    setCursor(null);
    loadFeed(false);
  }, [mode, filters]);

  // 더 불러오기
  const loadMore = useCallback(() => {
    if (!loadingMore && hasNext) {
      loadFeed(true);
    }
  }, [loadingMore, hasNext, loadFeed]);

  // 새로고침
  const refresh = useCallback(() => {
    setCursor(null);
    loadFeed(false);
  }, [loadFeed]);

  // 필터 업데이트
  const updateFilters = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
  }, []);

  // 좋아요 토글
  const toggleLike = useCallback(async (recipeId: number) => {
    try {
      const result = await feedApi.toggleLike(recipeId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === recipeId
            ? { ...item, isLiked: result.liked, likeCount: result.likeCount }
            : item
        )
      );
      return result;
    } catch (err) {
      console.error('Like toggle error:', err);
      throw err;
    }
  }, []);

  // 북마크 토글
  const toggleBookmark = useCallback(async (recipeId: number) => {
    try {
      const result = await feedApi.toggleBookmark(recipeId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === recipeId
            ? { ...item, isBookmarked: result.bookmarked }
            : item
        )
      );
      return result;
    } catch (err) {
      console.error('Bookmark toggle error:', err);
      throw err;
    }
  }, []);

  // 팔로우 토글
  const toggleFollow = useCallback(async (userId: number) => {
    try {
      const result = await feedApi.toggleFollow(userId);
      setItems((prev) =>
        prev.map((item) =>
          item.authorId === userId
            ? { ...item, isFollowing: result.following }
            : item
        )
      );
      return result;
    } catch (err) {
      console.error('Follow toggle error:', err);
      throw err;
    }
  }, []);

  // 삭제
  const deleteRecipe = useCallback(async (recipeId: number) => {
    try {
      await feedApi.deleteRecipe(recipeId);
      setItems((prev) => prev.filter((item) => item.id !== recipeId));
    } catch (err) {
      console.error('Delete error:', err);
      throw err;
    }
  }, []);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasNext,
    filters,
    updateFilters,
    loadMore,
    refresh,
    toggleLike,
    toggleBookmark,
    toggleFollow,
    deleteRecipe,
  };
}

export default useFeed;
