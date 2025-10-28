"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// 타입 힌트(선택): recipes 테이블 스키마에 맞춰 필요한 필드만 정의
type Recipe = {
  id: string;
  image_url?: string | null;
  video_url?: string | null;
  thumbnail?: string | null;
  likes_count?: number | null;
};

type CookingProgressMap = Record<
  string,
  { completed: number[]; total: number }
>;

const SavedRecipesGrid = () => {
    const router = useRouter();
    const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<CookingProgressMap>({});
    // 동일 effect 재진입/중복 호출을 방지하기 위한 가드 플래그
    const loadedRef = useRef(false); 
  
    // useEffect에서 localStorage 파싱을 try/catch로 안전화 + 로딩 함수 호출
  //  - 원본: useEffect 내부에서 바로 JSON.parse 후 loadSavedRecipes 호출 (예외 처리 없음)
  //  - 변경: JSON.parse 실패 대비 try/catch, 그리고 중복 호출 방지 가드와 함께 사용
    useEffect(() => {
        try {
            const raw = localStorage.getItem("cookingProgress") || "{}";
            const cookingProgress = JSON.parse(raw) as CookingProgressMap;
            setProgress(cookingProgress);
          } catch {
            setProgress({});
          }
          void loadSavedRecipes();
    }, []);
  
    const loadSavedRecipes = async () => {
        // [NEW] 중복 실행 방지: 렌더/리렌더 과정에서 같은 호출이 겹치지 않도록 가드
        if (loadedRef.current) return;
        loadedRef.current = true;
        
        const { 
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();
        
        if (sessionError) {
            // 문제 파악 위해 로깅만(실 사용자에겐 노출 X)
            console.error("[SavedRecipesGrid] getSession error:", sessionError);
          }
        
        // 세션 없을 때: 여기서는 로딩 스피너가 계속 도는 상황을 막으려고 setLoading(false) 추가  
        if (!session){
            setLoading(false);
            return;
        }
  
        // 핵심 쿼리 구조 유지(관계명이 'recipes'로 잡혀있다는 가정)
        // [NOTE] 만약 RLS/관계명이 다르면 recipes:관계명(*) 형태로 바꿔야 함
        const { data: savedData, error } = await supabase
            .from("saved_recipes")
            .select("recipe_id, recipes(*)")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        // [NEW] 쿼리 에러 처리 보강
        if (error) {
            console.error("[SavedRecipesGrid] loadSavedRecipes error:", error);
            setSavedRecipes([]);
            setLoading(false);
            return;
        }
  
        // savedData가 존재할 때만 매핑 (null 필터링)
        if (savedData) {
            const recipes = savedData
            .map((s) => s.recipes)
            .filter((r) => r !== null);
            setSavedRecipes(recipes);
        }
        // 로딩 상태 해제
        setLoading(false);
    };
  
    if (loading) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      );
    }
  
    // 저장된 레시피가 없을 경우 메시지 표시
    if (savedRecipes.length === 0) {
      return (
        <div className="text-center py-16 bg-card rounded-xl">
          <p className="text-muted-foreground">저장된 레시피가 없습니다</p>
        </div>
      );
    }
  
    // 실제 그리드 렌더링
    return (
      <div className="grid grid-cols-3 gap-1">
        {savedRecipes.map((recipe: any) => (
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

  export default SavedRecipesGrid;