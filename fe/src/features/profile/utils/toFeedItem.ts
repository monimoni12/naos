/**
 * Recipe를 FeedItem으로 변환하는 헬퍼 함수
 * 위치: src/features/profile/utils/toFeedItem.ts
 */

import type { FeedItem } from "@/features/feed/types";
import type { ProfileResponse } from "../types";

interface RecipeData {
  id: number;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  authorId?: number;
  authorName?: string;
  authorAvatar?: string;
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
  steps?: any[];
}

export const toFeedItem = (
  recipe: RecipeData,
  profile: ProfileResponse | null
): FeedItem => ({
  id: recipe.id,
  title: recipe.title || "",
  caption: recipe.description || null,
  category: null,
  dietTags: null,
  servings: null,
  cookTimeMin: null,
  priceEstimate: null,
  kcalEstimate: null,
  difficulty: null,
  scorePopular: null,
  scoreCost: null,
  thumbnailUrl: recipe.thumbnailUrl || recipe.imageUrl || null,
  videoUrl: recipe.videoUrl || null,
  videoDurationSec: null,
  firstClipStartSec: null,
  firstClipEndSec: null,
  firstClipCaption: null,
  totalClipCount: recipe.steps?.length || null,
  authorId: recipe.authorId || profile?.userId || 0,
  authorUsername: profile?.username || null,
  authorFullName: profile?.fullName || null,
  authorAvatarUrl: recipe.authorAvatar || profile?.avatarUrl || null,
  likeCount: recipe.likesCount || 0,
  commentCount: recipe.commentsCount || 0,
  bookmarkCount: 0,
  isLiked: false,
  isBookmarked: false,
  isFollowing: false,
  hideLikeCount: false,
  disableComments: false,
  createdAt: recipe.createdAt || new Date().toISOString(),
  updatedAt: recipe.createdAt || new Date().toISOString(),
});
