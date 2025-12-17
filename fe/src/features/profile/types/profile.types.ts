/**
 * Profile 관련 타입 정의
 * 위치: src/features/profile/types/profile.types.ts
 */

// ==================== API Response Types ====================

/** 프로필 응답 (GET /api/profiles/me, GET /api/profiles/{username}) */
export interface ProfileResponse {
  id: number;
  userId: number;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  points: number;
  website: string | null;
  location: string | null;
  isPublic: boolean;
  recipeCount: number | null;
  followerCount: number | null;
  followingCount: number | null;
  primaryBadgeCode: string | null;
  primaryBadgeTitle: string | null;
}

/** 프로필 수정 요청 (PUT /api/profiles/me) */
export interface ProfileUpdateRequest {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  location?: string;
  isPublic?: boolean;
}

/** 팔로우 카운트 응답 */
export interface FollowCountsResponse {
  followerCount: number;
  followingCount: number;
}

/** 팔로우 유저 정보 */
export interface FollowUserResponse {
  userId: number;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isFollowing: boolean;
}

/** 팔로우 토글 응답 */
export interface FollowToggleResponse {
  following: boolean;
  followerCount: number;
}

/** 요리 세션 응답 */
export interface CookingSessionResponse {
  id: number;
  recipeId: number;
  recipeTitle: string;
  recipeThumbnail: string | null;
  startedAt: string;
  endedAt: string | null;
  completed: boolean;
}

/** 레시피 진행 상황 응답 */
export interface RecipeProgressResponse {
  recipeId: number;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  lastUpdated: string;
}

// ==================== Component Props Types ====================

export interface ProfileHeaderProps {
  profile: ProfileResponse;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onToggleFollow?: () => void;
  onNavigateToFollowers?: () => void;
  onNavigateToFollowing?: () => void;
}

export interface RecipeGridProps {
  recipes: RecipeGridItem[];
  onRecipeClick: (recipeId: string, index: number) => void;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export interface RecipeGridItem {
  id: string;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnail: string | null;
  likesCount: number;
  title?: string;
}

export interface ProfileShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

// ==================== Local State Types ====================

export interface CookingProgress {
  [recipeId: string]: {
    completed: number[];
    total: number;
  };
}

export type ProfileTab = 'recipes' | 'shorts' | 'saved' | 'cooking';
export type ViewMode = 'grid' | 'feed';
