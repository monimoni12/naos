"use client";

/**
 * 저장된 레시피 그리드 컴포넌트
 * 위치: src/features/profile/components/SavedRecipesGrid.tsx
 */

import { useEffect, useState } from "react";
import RecipeGrid from "./RecipeGrid";
import { getBookmarkedRecipes } from "../api";

interface SavedRecipesGridProps {
  onRecipeClick?: (recipeId: string, index: number) => void;
  onRecipesLoad?: (recipes: any[]) => void;  // 부모에게 데이터 전달
}

export default function SavedRecipesGrid({ 
  onRecipeClick,
  onRecipesLoad,
}: SavedRecipesGridProps) {
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
        // 피드 뷰에 필요한 추가 데이터
        title: recipe.title,
        description: recipe.description,
        authorId: recipe.authorId,
        authorName: recipe.authorUsername || recipe.authorFullName,
        authorAvatar: recipe.authorAvatarUrl,
        createdAt: recipe.createdAt,
        steps: recipe.clips,
      }));
      setRecipes(formattedRecipes);
      onRecipesLoad?.(formattedRecipes);  // 부모에게 전달
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
      onRecipeClick={onRecipeClick}
      emptyMessage="저장된 레시피가 없습니다"
      showProgress={true}
    />
  );
}
