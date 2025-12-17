/**
 * Feed API - Spring Boot Feed API 호출
 */

import { authFetch } from '@/lib/auth';
import type { FeedItem, CursorPage, FeedFilterRequest, FeedMode, Comment } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

export const feedApi = {
  /**
   * 피드 조회 (통합)
   */
  getFeed: async (
    mode: FeedMode = 'home',
    filter: FeedFilterRequest = {}
  ): Promise<CursorPage<FeedItem>> => {
    const params = new URLSearchParams();
    params.append('mode', mode);
    
    if (filter.maxPrice) params.append('maxPrice', filter.maxPrice.toString());
    if (filter.maxCookTime) params.append('maxCookTime', filter.maxCookTime.toString());
    if (filter.category) params.append('category', filter.category);
    if (filter.difficulty) params.append('difficulty', filter.difficulty);
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.cursor) params.append('cursor', filter.cursor.toString());
    if (filter.size) params.append('size', filter.size.toString());

    const response = await authFetch(`${API_URL}/api/feed?${params.toString()}`);
    const json = await response.json();
    return json.data;
  },

  /**
   * 홈 피드
   */
  getHomeFeed: (filter?: FeedFilterRequest) => feedApi.getFeed('home', filter),

  /**
   * 팔로잉 피드
   */
  getFollowingFeed: (filter?: FeedFilterRequest) => feedApi.getFeed('following', filter),

  /**
   * 트렌딩 피드
   */
  getTrendingFeed: (filter?: FeedFilterRequest) => feedApi.getFeed('trending', filter),

  /**
   * 쇼츠 피드
   */
  getShortsFeed: (filter?: FeedFilterRequest) => feedApi.getFeed('shorts', filter),

  /**
   * 레시피 상세 조회
   */
  getRecipeDetail: async (id: number): Promise<FeedItem> => {
    const response = await authFetch(`${API_URL}/api/recipes/${id}`);
    const json = await response.json();
    return json.data;
  },

  /**
   * 좋아요 토글
   */
  toggleLike: async (recipeId: number): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await authFetch(`${API_URL}/api/recipes/${recipeId}/like`, {
      method: 'POST',
    });
    const json = await response.json();
    return json.data;
  },

  /**
   * 북마크 토글
   */
  toggleBookmark: async (recipeId: number): Promise<{ bookmarked: boolean }> => {
    const response = await authFetch(`${API_URL}/api/recipes/${recipeId}/bookmark`, {
      method: 'POST',
    });
    const json = await response.json();
    return json.data;
  },

  /**
   * 팔로우 토글
   */
  toggleFollow: async (userId: number): Promise<{ following: boolean }> => {
    const response = await authFetch(`${API_URL}/api/users/${userId}/follow`, {
      method: 'POST',
    });
    const json = await response.json();
    return json.data;
  },

  /**
   * 댓글 목록 조회
   */
  getComments: async (recipeId: number): Promise<Comment[]> => {
    const response = await authFetch(`${API_URL}/api/recipes/${recipeId}/comments`);
    const json = await response.json();
    return json.data;
  },

  /**
   * 댓글 작성
   */
  createComment: async (
    recipeId: number,
    content: string,
    parentId?: number
  ): Promise<Comment> => {
    const response = await authFetch(`${API_URL}/api/recipes/${recipeId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
    const json = await response.json();
    return json.data;
  },

  /**
   * 댓글 좋아요 토글
   */
  toggleCommentLike: async (commentId: number): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await authFetch(`${API_URL}/api/comments/${commentId}/like`, {
      method: 'POST',
    });
    const json = await response.json();
    return json.data;
  },

  /**
   * 레시피 삭제
   */
  deleteRecipe: async (recipeId: number): Promise<void> => {
    await authFetch(`${API_URL}/api/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  },
};

export default feedApi;
