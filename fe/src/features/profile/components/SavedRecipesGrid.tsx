"use client";

/**
 * 저장된 레시피 그리드 컴포넌트
 * 위치: src/features/profile/components/SavedRecipesGrid.tsx
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RecipeGrid from "./RecipeGrid";
import { getBookmarkedRecipes } from "../api";

export default function SavedRecipesGrid() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const data = await getBookmarkedRecipes();
      // API 응답을 RecipeGrid 형식으로 변환
      const formattedRecipes = data.map((recipe) => ({
        id: recipe.id,
        imageUrl: recipe.thumbnailUrl || recipe.imageUrl,
        videoUrl: recipe.videoUrl,
        thumbnail: recipe.thumbnailUrl,
        likesCount: recipe.likesCount || 0,
      }));
      setRecipes(formattedRecipes);
    } catch (error) {
      console.error("Failed to load saved recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <RecipeGrid
      recipes={recipes}
      emptyMessage="저장된 레시피가 없습니다"
      showProgress={true}
    />
  );
}
