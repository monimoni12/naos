"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// recipes 테이블 구조와 일치하도록 타입 정의
type Recipe = {
  id: string;
  image_url?: string | null;
  video_url?: string | null;
  thumbnail?: string | null;
  likes_count?: number | null;
};

// localStorage 내 진행 상태 구조
type CookingProgressMap = Record<
  string,
  { completed: number[]; total: number }
>;

const CookingRecipesGrid = () => {
    const router = useRouter();
    const [cookingRecipes, setCookingRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<CookingProgressMap>({});
    // 중복 실행 방지용 ref
    const loadedRef = useRef(false); 
  
    // JSON.parse 예외처리 + 중복 호출 방지
    useEffect(() => {
      void loadCookingRecipes(); // eslint 경고 방지용 void
    }, []);
  
    const loadCookingRecipes = async () => {
        // 중복 실행 방지
        if (loadedRef.current) return;
        loadedRef.current = true;

        try {
        // localStorage 파싱에 try/catch 추가
        const raw = localStorage.getItem("cookingProgress") || "{}";
        const cookingProgress = JSON.parse(raw) as CookingProgressMap;
        setProgress(cookingProgress);

        // Supabase 세션 구조분해 시 error까지 함께 받음
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("[CookingRecipesGrid] getSession error:", sessionError);
        }

        // 세션 없으면 로딩 중단
        if (!session) {
            setLoading(false);
            return;
        }

        // cookingProgress가 비었으면 바로 종료
        const recipeIds = Object.keys(cookingProgress);
        if (recipeIds.length === 0) {
            setLoading(false);
            return;
        }

        // Supabase 쿼리 시 error 포함 구조분해
        const { data: recipesData, error } = await supabase
            .from("recipes")
            .select("*")
            .in("id", recipeIds);

        // 쿼리 실패 시 로그 + 빈 배열 처리
        if (error) {
            console.error("[CookingRecipesGrid] loadCookingRecipes error:", error);
            setCookingRecipes([]);
            setLoading(false);
            return;
        }

        // 정상 데이터 세팅
        if (recipesData) {
            setCookingRecipes(recipesData);
        }
        } catch (err) {
        // JSON.parse 실패나 예외 처리
        console.error("[CookingRecipesGrid] Unexpected error:", err);
        setCookingRecipes([]);
        } finally {
        // 로딩 상태 해제
        setLoading(false);
        }
    };
  
    // 로딩 UI
    if (loading) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      );
    }
  
    // 요리 중인 레시피가 없을 때 UI
    if (cookingRecipes.length === 0) {
      return (
        <div className="text-center py-16 bg-card rounded-xl">
          <p className="text-muted-foreground">요리 중인 레시피가 없습니다</p>
        </div>
      );
    }
  
    // 실제 그리드 렌더링 부분
    return (
      <div className="grid grid-cols-3 gap-1">
        {cookingRecipes.map((recipe: any) => (
          <button
            key={recipe.id}
            className="relative aspect-square bg-muted overflow-hidden group"
            onClick={() => router.push(`/post/${recipe.id}`)}
          >
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : recipe.video_url ? (
              <video
                src={recipe.video_url}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                muted
                playsInline
              />
            ) : (
              <img
                src={recipe.thumbnail}
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
                  {(recipe.likes_count || 0).toLocaleString()}
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
  };
  
  const mockCookingRecipes = [
    {
      id: "1",
      thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
      likes: 1245,
    },
    {
      id: "2",
      thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
      likes: 987,
    },
  ];

  export default CookingRecipesGrid;