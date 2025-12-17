/**
 * Profile API 함수들
 * 위치: src/features/profile/api/profileApi.ts
 */

import { authFetch } from '@/lib/auth';
import type {
  ProfileResponse,
  ProfileUpdateRequest,
  FollowCountsResponse,
  FollowUserResponse,
  FollowToggleResponse,
  CookingSessionResponse,
  RecipeProgressResponse,
} from '../types';

// Feed에서 RecipeResponse 타입 가져오기
import type { RecipeResponse } from '@/features/feed/types';

// ==================== Profile API ====================

/** 내 프로필 조회 */
export async function getMyProfile(): Promise<ProfileResponse> {
  const response = await authFetch('/api/profiles/me');
  if (!response.ok) {
    throw new Error('프로필을 불러올 수 없습니다.');
  }
  return response.json();
}

/** 다른 유저 프로필 조회 (username으로) */
export async function getProfileByUsername(username: string): Promise<ProfileResponse> {
  const response = await authFetch(`/api/profiles/${username}`);
  if (!response.ok) {
    throw new Error('프로필을 찾을 수 없습니다.');
  }
  return response.json();
}

/** 프로필 수정 */
export async function updateProfile(data: ProfileUpdateRequest): Promise<ProfileResponse> {
  const response = await authFetch('/api/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '프로필 수정에 실패했습니다.');
  }
  return response.json();
}

/** 내 포인트 조회 */
export async function getMyPoints(): Promise<number> {
  const response = await authFetch('/api/profiles/me/points');
  if (!response.ok) {
    throw new Error('포인트를 불러올 수 없습니다.');
  }
  return response.json();
}

// ==================== Recipe API ====================

/** 내 레시피 목록 */
export async function getMyRecipes(): Promise<RecipeResponse[]> {
  const response = await authFetch('/api/recipes/me');
  if (!response.ok) {
    throw new Error('레시피를 불러올 수 없습니다.');
  }
  return response.json();
}

/** 특정 유저의 레시피 목록 (피드 API 활용) */
export async function getUserRecipes(userId: number): Promise<RecipeResponse[]> {
  // 백엔드에 유저별 레시피 조회 API가 없으면 전체에서 필터링 필요
  // 일단 피드 API 사용
  const response = await authFetch('/api/recipes/feed?page=0&size=100');
  if (!response.ok) {
    throw new Error('레시피를 불러올 수 없습니다.');
  }
  const recipes: RecipeResponse[] = await response.json();
  return recipes.filter(r => r.authorId === userId);
}

// ==================== Bookmark API ====================

/** 내 북마크 ID 목록 */
export async function getMyBookmarkIds(): Promise<number[]> {
  const response = await authFetch('/api/users/me/bookmarks');
  if (!response.ok) {
    throw new Error('북마크를 불러올 수 없습니다.');
  }
  return response.json();
}

/** 북마크된 레시피 상세 조회 */
export async function getBookmarkedRecipes(): Promise<RecipeResponse[]> {
  const bookmarkIds = await getMyBookmarkIds();
  if (bookmarkIds.length === 0) return [];
  
  // 각 레시피 상세 조회 (병렬)
  const recipes = await Promise.all(
    bookmarkIds.map(async (id) => {
      try {
        const response = await authFetch(`/api/recipes/${id}`);
        if (response.ok) {
          const data = await response.json();
          return data.data || data; // ApiResponse wrapper 처리
        }
        return null;
      } catch {
        return null;
      }
    })
  );
  
  return recipes.filter((r): r is RecipeResponse => r !== null);
}

// ==================== Follow API ====================

/** 팔로우 토글 */
export async function toggleFollow(targetUserId: number): Promise<FollowToggleResponse> {
  const response = await authFetch(`/api/users/${targetUserId}/follow`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('팔로우 처리에 실패했습니다.');
  }
  return response.json();
}

/** 팔로우 상태 확인 */
export async function checkFollowStatus(targetUserId: number): Promise<boolean> {
  const response = await authFetch(`/api/users/${targetUserId}/follow`);
  if (!response.ok) {
    return false;
  }
  const data = await response.json();
  return data.following;
}

/** 팔로워/팔로잉 수 조회 */
export async function getFollowCounts(userId: number): Promise<FollowCountsResponse> {
  const response = await authFetch(`/api/users/${userId}/follow/counts`);
  if (!response.ok) {
    throw new Error('팔로우 정보를 불러올 수 없습니다.');
  }
  return response.json();
}

/** 팔로워 목록 조회 */
export async function getFollowers(userId: number): Promise<FollowUserResponse[]> {
  const response = await authFetch(`/api/users/${userId}/followers`);
  if (!response.ok) {
    throw new Error('팔로워 목록을 불러올 수 없습니다.');
  }
  return response.json();
}

/** 팔로잉 목록 조회 */
export async function getFollowing(userId: number): Promise<FollowUserResponse[]> {
  const response = await authFetch(`/api/users/${userId}/following`);
  if (!response.ok) {
    throw new Error('팔로잉 목록을 불러올 수 없습니다.');
  }
  return response.json();
}

// ==================== Cooking API ====================

/** 요리 기록 조회 */
export async function getCookingHistory(): Promise<CookingSessionResponse[]> {
  const response = await authFetch('/api/cooking/history');
  if (!response.ok) {
    throw new Error('요리 기록을 불러올 수 없습니다.');
  }
  return response.json();
}

/** 레시피 진행 상황 조회 */
export async function getRecipeProgress(recipeId: number): Promise<RecipeProgressResponse | null> {
  const response = await authFetch(`/api/cooking/progress/${recipeId}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

/** 요리 중인 레시피들 조회 (로컬 스토리지 + API 조합) */
export async function getCookingRecipes(): Promise<RecipeResponse[]> {
  // 로컬 스토리지에서 진행 중인 레시피 ID 가져오기
  const cookingProgress = JSON.parse(localStorage.getItem('cookingProgress') || '{}');
  const recipeIds = Object.keys(cookingProgress);
  
  if (recipeIds.length === 0) return [];
  
  // 각 레시피 상세 조회 (병렬)
  const recipes = await Promise.all(
    recipeIds.map(async (id) => {
      try {
        const response = await authFetch(`/api/recipes/${id}`);
        if (response.ok) {
          const data = await response.json();
          return data.data || data;
        }
        return null;
      } catch {
        return null;
      }
    })
  );
  
  return recipes.filter((r): r is RecipeResponse => r !== null);
}
