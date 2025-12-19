/**
 * 레시피 상세 페이지 타입 정의
 * BE API 응답 구조에 맞춤
 * 
 * ⭐ 수정: page.tsx에서 사용하는 필드들 추가
 */

// ==================== Recipe ====================

export interface RecipeDetail {
  id: number;
  title: string;
  caption: string | null;
  category: string | null;
  dietTags: string | null;           // ⭐ 추가
  difficulty: string | null;         // ⭐ 추가
  authorId: number | null;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  servings: number | null;
  cookTimeMin: number | null;
  priceEstimate: number | null;
  kcalEstimate: number | null;
  hideLikeCount: boolean;
  hideShareCount: boolean;
  disableComments: boolean;
  scorePopular: number | null;
  scoreCost: number | null;
  costEfficiencyScore: number | null; // ⭐ 추가
  visibility: string;
  liked: boolean;
  bookmarked: boolean;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  videoDurationSec: number | null;   // ⭐ 추가
  createdAt: string | null;          // ⭐ 추가
  updatedAt: string | null;          // ⭐ 추가
}

// ==================== Clip ====================

export interface TranscriptSegment {
  id: number | null;
  index: number;
  start: number;
  end: number;
  text: string;
}

export interface ClipWithText {
  id: number;
  recipeId: number;
  indexOrd: number;
  startSec: number;
  endSec: number;
  durationSec: number | null;
  caption: string | null;
  transcriptText: string | null;
  segments: TranscriptSegment[];
}

// ==================== Cooking Session ====================

export interface CookingSession {
  id: number;
  userId: number;
  recipeId: number;
  recipeTitle: string;
  startedAt: string;
  endedAt: string | null;
  active: boolean;
  durationSeconds: number | null;
}

export interface RecipeProgress {
  id: number;
  recipeId: number;
  recipeTitle: string;
  totalSteps: number;
  progressStep: number;
  progressPercent: number;
  completed: boolean;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

// ==================== Value Score ====================

export interface ValueScoreBreakdown {
  priceEfficiency: number;
  timeEfficiency: number;
  nutritionBalance: number;
  ingredientAccessibility: number;
}

export interface RecipeAnalysis {
  recipeId: number;
  costEfficiencyScore: number | null;
  priceEstimate: number | null;
  comment: string | null;
  breakdown: ValueScoreBreakdown | null;
  nutrition: {
    kcalEstimate: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sodiumMg: number;
  } | null;
  status: string;
  message: string | null;
}

// ==================== Comments ====================

export interface CommentAuthor {
  name: string;
  avatar: string;
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  text: string;
  timestamp: string;
  parentId: string | null;
  replies: Comment[];
  likesCount: number;
  isLiked: boolean;
}

// ==================== Utility Types ====================

export function getClipDisplayText(clip: ClipWithText): string {
  if (clip.caption && clip.caption.trim()) {
    return clip.caption;
  }
  return clip.transcriptText || "";
}

export function hasManualCaption(clip: ClipWithText): boolean {
  return !!(clip.caption && clip.caption.trim());
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "최고";
  if (score >= 60) return "좋음";
  if (score >= 40) return "보통";
  return "낮음";
}

export function getScoreColorClass(score: number): string {
  if (score >= 80) return "bg-green-500 text-white";
  if (score >= 60) return "bg-yellow-500 text-white";
  return "bg-muted text-muted-foreground";
}
