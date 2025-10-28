"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import RecipeCard from "@/features/recipes/components/RecipeCard"; // 피드 렌더용 컴포넌트

// 타입 정의
type Recipe = {
    id: string;
    user_id?: string;
    title?: string | null;
    description?: string | null;
    image_url?: string | null;
    video_url?: string | null;
    thumbnail?: string | null;
    likes_count?: number | null;
    comments_count?: number | null;
    created_at?: string | null;
    profiles?: { username?: string | null; avatar_url?: string | null };
    steps?: any[];
};
  
type CookingProgressMap = Record<string, { completed: number[]; total: number }>;
  
type ShortsGridProps = {
    recipes: Recipe[];
    viewMode: "grid" | "feed"; // 누락된 props 추가
    setViewMode: (mode: "grid" | "feed") => void;
    selectedRecipeIndex: number;
    setSelectedRecipeIndex: (index: number) => void;
    profile?: any; // profile도 명시
};

const ShortsGrid = ({ 
    recipes,
    viewMode,
    setViewMode,
    selectedRecipeIndex,
    setSelectedRecipeIndex,
    profile,
}: ShortsGridProps) => {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [progress, setProgress] = useState<Record<string, { completed: number[]; total: number }>>({});

    useEffect(() => {
        // 로컬 저장된 조리 진행도 불러오기
        const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
        setProgress(cookingProgress);
      
        // Supabase 사용자 정보 불러오기
        supabase.auth.getUser().then(({ data } : {data: { user: any } }) => {
            if (data.user) {
            setCurrentUserId(data.user.id);
            }
        });
    }, []);

    if (recipes.length === 0) {
      return null;
    }

    // 삭제 로직 (RecipeGrid와 동일)
    const handleDelete = async (recipeId: string) => {
        if (!currentUserId) return;

        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', recipeId)
            .eq('user_id', currentUserId);

        if (!error) {
            window.location.reload();
        }
    };

    // Shorts 전용 — video_url이 있는 레시피만 표시
    const videoRecipes = recipes.filter(r => r.video_url);

    if (videoRecipes.length === 0) {
      return null;
    }

    // viewMode, selectedRecipeIndex, setViewMode 등은 외부 상태에서 내려받는 구조라 가정됨
    // (Profile 페이지에서 props로 넘겨주는 경우 그대로 유지)
    if (viewMode === 'grid') {
        return (
        <div className="grid grid-cols-3 gap-1">
            {videoRecipes.map((recipe, index) => (
            <button
              key={recipe.id}
              className="relative aspect-[2/3] bg-muted overflow-hidden group"
              onClick={() => {
                setSelectedRecipeIndex(index);
                setViewMode('feed');
                router.replace("/profile?view=feed");
              }}
            >
                {/* 이미지/영상 조건부 렌더링 */}
                {recipe.image_url ? (
                    <img
                        src={recipe.image_url ?? ""}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : recipe.video_url ? (
                    <video
                    src={recipe.video_url ?? ""}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    muted
                    playsInline
                    />
                ) : (
                    <img
                    src={recipe.thumbnail ?? ""}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                )}

                {/* ❤️ 좋아요 수 표시 영역 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                    <span className="text-white font-semibold flex items-center gap-1">
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="white"
                        strokeWidth="2"
                        >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    {(recipe.likes_count ?? 0).toLocaleString()}
                  </span>

                  {/* 조리 단계 진행도 표시 */}
                  {progress[recipe.id] && (
                    <span className="text-white text-sm font-semibold bg-mocha/80 px-2 py-1 rounded">
                      {progress[recipe.id].completed.length}/{progress[recipe.id].total} 단계
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    // 피드 뷰 모드 (RecipeCard 사용)
    return (
      <div className="space-y-6">
        {videoRecipes.slice(selectedRecipeIndex).map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            author={{
              name: recipe.profiles?.username || profile?.username || "익명",
              avatar: recipe.profiles?.avatar_url || profile?.avatar_url || "",
              isFollowing: false,
              userId: recipe.user_id,
            }}
            images={[recipe.video_url ?? ""]}
            title={recipe.title ?? ""}
            description={recipe.description || ""}
            likes={recipe.likes_count ?? 0}
            comments={recipe.comments_count || 0}
            timestamp={new Date(recipe.created_at ?? "").toLocaleDateString("ko-KR")}
            steps={recipe.steps}
            currentUserId={currentUserId || undefined}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  export default ShortsGrid;