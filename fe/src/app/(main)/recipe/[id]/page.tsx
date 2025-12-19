"use client";

/**
 * 레시피 상세 페이지
 * /recipe/[id]
 * 
 * 상단: RecipeCard (홈피드와 동일한 UI)
 * 하단: RecipeDetailContainer (가성비 정보, 요리 시작, 조리 단계)
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUser } from "@/lib/auth";
import {
  getRecipeDetail,
  getRecipeClips,
} from "@/features/recipe/api/recipeApi";
import type { RecipeDetail, ClipWithText } from "@/features/recipe/types/recipe.types";
import { FeedItem } from "@/features/feed/types/feed.types";
import RecipeCard from "@/features/feed/components/RecipeCard";
import RecipeDetailContainer from "@/features/recipe/components/RecipeDetailContainer";
import CommentsSheet from "@/features/recipe/components/CommentsSheet";
import ShareDialog from "@/features/recipe/components/ShareDialog";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params?.id ? parseInt(params.id as string, 10) : null;

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [clips, setClips] = useState<ClipWithText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [currentStep, setCurrentStep] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isCooking, setIsCooking] = useState(false); // ⭐ 요리중 상태

  // 인증 체크 + 데이터 로드
  useEffect(() => {
    if (!recipeId) return;

    const user = getUser();
    if (!user) {
      router.push("/auth");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [recipeData, clipsData] = await Promise.all([
          getRecipeDetail(recipeId),
          getRecipeClips(recipeId),
        ]);

        setRecipe(recipeData);
        setClips(clipsData);
      } catch (err) {
        console.error("Error loading recipe:", err);
        setError("레시피를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [recipeId, router]);

  // ⭐ 요리중 상태 체크
  useEffect(() => {
    if (!recipeId || typeof window === 'undefined') return;
    
    const cookingRecipes = JSON.parse(localStorage.getItem('cookingRecipes') || '[]');
    setIsCooking(cookingRecipes.includes(recipeId.toString()));
  }, [recipeId]);

  // 뒤로가기
  const handleBack = () => {
    router.back();
  };

  // 로딩
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 에러
  if (error || !recipe || !recipeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "레시피를 찾을 수 없습니다"}</p>
        <Button variant="outline" onClick={handleBack}>
          돌아가기
        </Button>
      </div>
    );
  }

  // RecipeDetail → FeedItem 변환 (RecipeCard용)
  const feedItem: FeedItem = {
    id: recipe.id,
    title: recipe.title,
    caption: recipe.caption || null,
    category: recipe.category || null,
    dietTags: recipe.dietTags || null,
    servings: recipe.servings || null,
    cookTimeMin: recipe.cookTimeMin || null,
    priceEstimate: recipe.priceEstimate || null,
    kcalEstimate: recipe.kcalEstimate || null,
    difficulty: recipe.difficulty || null,
    scorePopular: null,
    scoreCost: null,
    costEfficiencyScore: recipe.costEfficiencyScore || null,
    thumbnailUrl: recipe.thumbnailUrl || null,
    videoUrl: recipe.videoUrl || null,
    videoDurationSec: recipe.videoDurationSec || null,
    firstClipStartSec: clips[0]?.startSec ?? null,
    firstClipEndSec: clips[0]?.endSec ?? null,
    firstClipCaption: clips[0]?.caption ?? null,
    totalClipCount: clips.length,
    clips: clips.map(c => ({
      id: c.id,
      indexOrd: c.indexOrd,
      startSec: c.startSec,
      endSec: c.endSec,
      caption: c.caption || null,
    })),
    authorId: recipe.authorId,
    authorUsername: recipe.authorUsername || null,
    authorFullName: recipe.authorName || null,
    authorAvatarUrl: recipe.authorAvatarUrl || null,
    likeCount: 0,
    commentCount: commentCount,
    bookmarkCount: 0,
    isLiked: recipe.liked || false,
    isBookmarked: recipe.bookmarked || false,
    isFollowing: false,
    hideLikeCount: recipe.hideLikeCount || false,
    disableComments: recipe.disableComments || false,
    createdAt: recipe.createdAt || new Date().toISOString(),
    updatedAt: recipe.updatedAt || new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - 제목 없이 뒤로가기/더보기만 */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowShare(true)}>
                공유하기
              </DropdownMenuItem>
              <DropdownMenuItem>신고하기</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ========== 상단: RecipeCard (홈피드 UI) ========== */}
      <div className="container max-w-2xl mx-auto">
        <RecipeCard
          item={feedItem}
          clips={clips}
          disableClick={true}
          onSlideChange={setCurrentStep}
        />
      </div>

      {/* ========== 하단: RecipeDetailContainer ========== */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <RecipeDetailContainer
          recipeId={recipeId}
          initialRecipe={recipe}
          initialClips={clips}
          currentStep={currentStep}
          isCooking={isCooking}
        />
      </div>

      {/* Comments Sheet */}
      {!recipe.disableComments && (
        <CommentsSheet
          open={showComments}
          onOpenChange={setShowComments}
          recipeId={recipeId}
          commentsCount={commentCount}
          onCommentsCountChange={setCommentCount}
        />
      )}

      {/* Share Dialog */}
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={recipe.title}
      />
    </div>
  );
}
