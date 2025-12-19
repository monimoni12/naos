/**
 * Feed API - Spring Boot Feed API 호출
 * 위치: src/features/feed/api/feedApi.ts
 * 
 * ⭐ 수정사항:
 * - /like → /likes (BE 경로 일치)
 * - /bookmark → /bookmarks (BE 경로 일치)
 * - getRecipeClips 추가
 * - deleteComment 추가
 * - getComments, createComment에서 BE→FE 필드명 변환
 */

import { authFetch } from '@/lib/auth';
import type { FeedItem, CursorPage, FeedFilterRequest, FeedMode, Comment, RecipeClip } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

/**
 * ⭐ BE CommentResponse → FE Comment 변환 함수
 * BE 필드명을 FE 필드명으로 매핑
 */
const mapCommentToFE = (c: any): Comment => ({
  id: c.id,
  content: c.content,
  createdAt: c.createdAt,
  authorId: c.authorId,
  authorUsername: c.authorUsername || c.authorName || '익명',
  authorAvatarUrl: c.authorProfileUrl,  // BE: authorProfileUrl → FE: authorAvatarUrl
  parentId: c.parentId,
  likesCount: c.likeCount || 0,          // BE: likeCount → FE: likesCount
  isLiked: c.liked || false,             // BE: liked → FE: isLiked
  replies: c.replies ? c.replies.map(mapCommentToFE) : [],  // null → 빈 배열
});

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
   * 레시피 클립 조회
   */
  getRecipeClips: async (recipeId: number): Promise<RecipeClip[]> => {
    try {
      const response = await authFetch(`${API_URL}/api/transcripts/${recipeId}/clips`);
      if (!response.ok) return [];
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch clips:', error);
      return [];
    }
  },

  /**
   * 좋아요 토글
   */
  toggleLike: async (recipeId: number): Promise<{ liked: boolean; likeCount: number }> => {
    const response = await authFetch(`${API_URL}/api/recipes/${recipeId}/likes`, {
      method: 'POST',
    });
    const json = await response.json();
    return { liked: json.liked, likeCount: json.count };
  },

  /**
   * 북마크 토글
   */
  toggleBookmark: async (recipeId: number): Promise<{ bookmarked: boolean }> => {
    const response = await authFetch(`${API_URL}/api/recipes/${recipeId}/bookmarks`, {
      method: 'POST',
    });
    const json = await response.json();
    return json;
  },

  /**
   * 팔로우 토글
   */
  toggleFollow: async (userId: number): Promise<{ following: boolean }> => {
    const response = await authFetch(`${API_URL}/api/users/${userId}/follow`, {
      method: 'POST',
    });
    const json = await response.json();
    return json;
  },

  /**
   * 댓글 목록 조회
   * ⭐ BE→FE 필드명 변환 적용
   */
  getComments: async (recipeId: number): Promise<Comment[]> => {
    const response = await authFetch(`${API_URL}/api/recipes/${recipeId}/comments`);
    const json = await response.json();
    return (json || []).map(mapCommentToFE);
  },

  /**
   * 댓글 작성
   * ⭐ BE→FE 필드명 변환 적용
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
    return mapCommentToFE(json);
  },

  /**
   * ⭐ 댓글 삭제
   */
  deleteComment: async (commentId: number): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
  },

  /**
   * 댓글 좋아요 토글
   */
  toggleCommentLike: async (commentId: number): Promise<{ liked: boolean; count: number }> => {
    const response = await authFetch(`${API_URL}/api/comments/${commentId}/likes`, {
      method: 'POST',
    });
    const json = await response.json();
    return json;
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
