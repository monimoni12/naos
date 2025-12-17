"use client";

/**
 * 요리 중인 레시피 그리드 컴포넌트
 * 위치: src/features/profile/components/CookingRecipesGrid.tsx
 */

import { useEffect, useState } from "react";
import RecipeGrid from "./RecipeGrid";
import { getCookingRecipes } from "../api";

export default function CookingRecipesGrid() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCookingRecipes();
  }, []);

  const loadCookingRecipes = async () => {
    try {
      const data = await getCookingRecipes();
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
      console.error("Failed to load cooking recipes:", error);
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
      emptyMessage="요리 중인 레시피가 없습니다"
      showProgress={true}
    />
  );
}
