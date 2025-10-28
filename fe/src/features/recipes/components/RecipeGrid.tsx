"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import RecipeCard from "@/features/recipes/components/RecipeCard"; // Feed 뷰 렌더링용 컴포넌트 import

// 타입 정의: Recipe + CookingProgressMap
type Recipe = {
  id: string;
  user_id?: string;
  title?: string | null;
  description?: string;
  image_url?: string | null;
  video_url?: string | null;
  thumbnail?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  created_at?: string | null;
  profiles?: { username?: string; avatar_url?: string };
  steps?: any[];
};

type CookingProgressMap = Record<string, { completed: number[]; total: number }>;

// props 구조 명시 + 타입 강화
const RecipeGrid = ({
    recipes,
    viewMode,
    setViewMode,
    selectedRecipeIndex,
    setSelectedRecipeIndex,
    profile,
  }: {
    recipes: Recipe[];
    viewMode: "grid" | "feed";
    setViewMode: (mode: "grid" | "feed") => void;
    selectedRecipeIndex: number;
    setSelectedRecipeIndex: (index: number) => void;
    profile?: any;
  }) => {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [progress, setProgress] = useState<CookingProgressMap>({});


    // try/catch + async 로직 분리
    useEffect(() => {
      const loadUserAndProgress = async () => {
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
              console.error("[RecipeGrid] getUser error:", error);
              return; // 에러 발생 시 이후 로직 중단
            }
            if (data?.user) {
              setCurrentUserId(data.user.id); // 성공 시 현재 사용자 ID 저장
            }
        } catch (err) {
            // 예기치 못한 예외(네트워크, JSON 등) 방지
            console.error("[RecipeGrid] Unexpected error:", err);
            setProgress({}); // 안전한 기본값으로 초기화
        }
      };
      void loadUserAndProgress(); // void 키워드로 lint warning 방지 (fire-and-forget 명시)
    }, []);

    // 레시피가 없으면 렌더 X
    if (recipes.length === 0) {
      return null;
    }

    // 삭제 로직
    const handleDelete = async (recipeId: string) => {
      if (!currentUserId) return;

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', currentUserId);

        if (error) {
            console.error("[RecipeGrid] handleDelete error:", error);
            return;
        }
      
        // 원래처럼 삭제 후 강제 리로드 (간단하지만 UX 개선 여지 있음)
        window.location.reload();
    };

    // 그리드 뷰 UI
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-3 gap-1">
          {recipes.map((recipe, index) => (
            <button
              key={recipe.id}
              className="relative aspect-square bg-muted overflow-hidden group"
              onClick={() => {
                // 클릭 시 feed로 전환 + 선택 인덱스 업데이트
                setSelectedRecipeIndex(index);
                setViewMode('feed');
                router.replace('/profile?view=feed');
              }}
            >
                {/* 이미지 / 영상 조건부 렌더링 */}
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

    // viewMode === 'feed' 일 때의 UI
    return (
      <div className="space-y-6">
        {recipes.slice(selectedRecipeIndex).map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            author={{
              name: recipe.profiles?.username || profile?.username || "익명",
              avatar: recipe.profiles?.avatar_url || profile?.avatar_url || "",
              isFollowing: false,
              userId: recipe.user_id,
            }}
            images={recipe.image_url && recipe.video_url ? [recipe.image_url, recipe.video_url] : recipe.video_url ? [recipe.video_url] : recipe.image_url ? [recipe.image_url] : []}
            title={recipe.title ?? "제목 없음"} // null 방지
            description={recipe.description || ""}
            likes={recipe.likes_count || 0}
            comments={recipe.comments_count || 0}
            timestamp={
                recipe.created_at
                    ? new Date(recipe.created_at).toLocaleDateString("ko-KR")
                    : "" // undefined 방지
            }
            steps={recipe.steps}
            currentUserId={currentUserId || undefined}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  export default RecipeGrid;