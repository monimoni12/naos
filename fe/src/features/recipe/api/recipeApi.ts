/**
 * 레시피 상세 페이지 API
 */

import { authFetch } from "@/lib/auth";
import type { 
  RecipeDetail, 
  ClipWithText, 
  CookingSession, 
  RecipeProgress 
} from "../types/recipe.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

// ==================== Recipe ====================

/**
 * 레시피 상세 조회
 */
export async function getRecipeDetail(id: number): Promise<RecipeDetail> {
  const response = await authFetch(`/api/recipes/${id}`);
  
  if (!response.ok) {
    throw new Error("레시피를 불러올 수 없습니다.");
  }
  
  const json = await response.json();
  return json.data;
}

/**
 * 레시피 클립 + 텍스트 목록 조회
 */
export async function getRecipeClips(recipeId: number): Promise<ClipWithText[]> {
  const response = await authFetch(`/api/transcripts/${recipeId}/clips`);
  
  if (!response.ok) {
    // 클립이 없으면 빈 배열 반환
    return [];
  }
  
  return response.json();
}

// ==================== Interaction ====================

/**
 * 좋아요 토글
 */
export async function toggleLike(recipeId: number): Promise<{ liked: boolean; count: number }> {
  const response = await authFetch(`/api/likes/${recipeId}`, {
    method: "POST",
  });
  
  if (!response.ok) {
    throw new Error("좋아요 처리 실패");
  }
  
  return response.json();
}

/**
 * 북마크 토글
 */
export async function toggleBookmark(recipeId: number): Promise<{ bookmarked: boolean }> {
  const response = await authFetch(`/api/bookmarks/${recipeId}`, {
    method: "POST",
  });
  
  if (!response.ok) {
    throw new Error("북마크 처리 실패");
  }
  
  return response.json();
}

// ==================== Cooking Session ====================

/**
 * 요리 시작
 */
export async function startCooking(recipeId: number): Promise<CookingSession> {
  const response = await authFetch(`/api/cooking/start/${recipeId}`, {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "요리 시작 실패");
  }
  
  return response.json();
}

/**
 * 요리 종료 (세션 ID)
 */
export async function endCooking(sessionId: number): Promise<CookingSession> {
  const response = await authFetch(`/api/cooking/end/${sessionId}`, {
    method: "POST",
  });
  
  if (!response.ok) {
    throw new Error("요리 종료 실패");
  }
  
  return response.json();
}

/**
 * ⭐ 추가: 요리 종료 (레시피 ID)
 */
export async function endCookingByRecipe(recipeId: number): Promise<CookingSession> {
  const response = await authFetch(`/api/cooking/end/recipe/${recipeId}`, {
    method: "POST",
  });
  
  if (!response.ok) {
    throw new Error("요리 종료 실패");
  }
  
  return response.json();
}

/**
 * 진행 상황 업데이트
 */
export async function updateProgress(recipeId: number, step: number): Promise<RecipeProgress> {
  const response = await authFetch(`/api/cooking/progress/${recipeId}?step=${step}`, {
    method: "PUT",
  });
  
  if (!response.ok) {
    throw new Error("진행 상황 업데이트 실패");
  }
  
  return response.json();
}

/**
 * 진행 상황 조회
 */
export async function getProgress(recipeId: number): Promise<RecipeProgress | null> {
  const response = await authFetch(`/api/cooking/progress/${recipeId}`);
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

/**
 * ⭐ 추가: 특정 레시피 요리 상태 확인
 */
export async function getCookingStatus(recipeId: number): Promise<{
  recipeId: number;
  isCooking: boolean;
  progress: RecipeProgress;
} | null> {
  const response = await authFetch(`/api/cooking/${recipeId}/status`);
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

/**
 * 활성 세션 조회 (단일)
 */
export async function getActiveSession(): Promise<CookingSession | null> {
  const response = await authFetch(`/api/cooking/active`);
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

/**
 * ⭐ 추가: 활성 세션 목록 조회 (여러 개)
 */
export async function getActiveSessions(): Promise<CookingSession[]> {
  const response = await authFetch(`/api/cooking/active/all`);
  
  if (!response.ok) {
    return [];
  }
  
  return response.json();
}

// ==================== Recipe CRUD ====================

/**
 * 레시피 삭제
 */
export async function deleteRecipe(recipeId: number): Promise<void> {
  const response = await authFetch(`/api/recipes/${recipeId}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error("레시피 삭제 실패");
  }
}

// ==================== Comments ====================

/**
 * 댓글 목록 조회
 */
export async function getComments(recipeId: number): Promise<Comment[]> {
  const response = await authFetch(`/api/comments/${recipeId}`);
  
  if (!response.ok) {
    return [];
  }
  
  return response.json();
}

/**
 * 댓글 작성
 */
export async function createComment(
  recipeId: number, 
  content: string, 
  parentId?: string
): Promise<Comment> {
  const response = await authFetch(`/api/comments/${recipeId}`, {
    method: "POST",
    body: JSON.stringify({ content, parentId }),
  });
  
  if (!response.ok) {
    throw new Error("댓글 작성 실패");
  }
  
  return response.json();
}

/**
 * 댓글 좋아요 토글
 */
export async function toggleCommentLike(commentId: string): Promise<{ liked: boolean; count: number }> {
  const response = await authFetch(`/api/comments/${commentId}/like`, {
    method: "POST",
  });
  
  if (!response.ok) {
    throw new Error("좋아요 처리 실패");
  }
  
  return response.json();
}
