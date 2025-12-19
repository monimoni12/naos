/**
 * Feed Types - 백엔드 FeedItemDto 기반
 * 
 * ⭐ 수정사항: ValueScoreData breakdown 필드명을 BE 응답에 맞게 수정
 * ⭐ 수정사항: clips 배열 추가 (홈 피드 슬라이드 구간 재생용)
 */

// 피드 아이템 (레시피 카드)
export interface FeedItem {
  id: number;
  title: string;
  caption: string | null;
  category: string | null;
  dietTags: string[] | null;
  
  // 조리 정보
  servings: number | null;
  cookTimeMin: number | null;
  priceEstimate: number | null;
  kcalEstimate: number | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  
  // 점수
  scorePopular: number | null;
  scoreCost: number | null;
  costEfficiencyScore: number | null;  // ⭐ BE 실제 필드명 추가
  
  // 미디어
  thumbnailUrl: string | null;
  videoUrl: string | null;
  videoDurationSec: number | null;
  
  // 첫 번째 클립 (쇼츠/릴스용)
  firstClipStartSec: number | null;
  firstClipEndSec: number | null;
  firstClipCaption: string | null;
  totalClipCount: number | null;
  
  // ⭐ 전체 클립 배열 (홈 피드 슬라이드 구간 재생용)
  clips: ClipInfo[] | null;
  
  // 작성자 정보
  authorId: number;
  authorUsername: string | null;
  authorFullName: string | null;
  authorAvatarUrl: string | null;
  
  // 상호작용 수
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  
  // 현재 유저 상태
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing: boolean;
  
  // 옵션
  hideLikeCount: boolean;
  disableComments: boolean;
  
  // 메타
  createdAt: string;
  updatedAt: string;
}

// ⭐ 피드 API에서 내려오는 클립 정보
export interface ClipInfo {
  id: number;
  indexOrd: number;
  startSec: number;
  endSec: number;
  caption: string | null;
}

// 커서 페이지 응답
export interface CursorPage<T> {
  content: T[];
  nextCursor: number | null;
  hasNext: boolean;
}

// 피드 필터 요청
export interface FeedFilterRequest {
  maxPrice?: number;
  maxCookTime?: number;
  category?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  sortBy?: 'RECENT' | 'COST_EFFICIENCY';
  cursor?: number;
  size?: number;
}

// 피드 모드
export type FeedMode = 'home' | 'following' | 'trending' | 'shorts';

// 필터 UI용 값
export interface FilterValues {
  maxPrice?: number;
  maxCookTime?: number;
  category?: string;
  difficulty?: string;
  sortBy?: 'RECENT' | 'COST_EFFICIENCY';
}

// 레시피 상세 (추후 확장)
export interface RecipeDetail extends FeedItem {
  ingredients: Ingredient[];
  clips: RecipeClip[];
}

export interface Ingredient {
  id: number;
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeClip {
  id: number;
  indexOrd: number;
  startSec: number;
  endSec: number;
  caption: string;
}

// 댓글
export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  authorUsername: string;
  authorAvatarUrl: string | null;
  parentId: number | null;
  likesCount: number;
  isLiked: boolean;
  replies: Comment[];
}

// 가성비 점수 (백엔드에서 이미 계산)
// ⭐ BE 응답 필드명에 맞게 수정됨
export interface ValueScoreData {
  score: number;
  breakdown?: {
    priceEfficiency: number;        // 가격 효율 (0-100)
    timeEfficiency: number;         // 시간 효율 (0-100)
    nutritionBalance: number;       // 영양 균형 (0-100)
    ingredientAccessibility: number; // 재료 접근성 (0-100)
  };
  analysis?: string;
}
