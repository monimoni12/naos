'use client';

/**
 * 레시피 그리드 컴포넌트
 * 위치: src/features/profile/components/RecipeGrid.tsx
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import type { CookingProgress } from '../types';

interface Recipe {
  id: string | number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  thumbnail?: string | null;
  likesCount?: number;
  likes_count?: number;
}

interface RecipeGridProps {
  recipes: Recipe[];
  onRecipeClick?: (recipeId: string, index: number) => void;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  aspectRatio?: 'square' | 'portrait'; // square: 1:1, portrait: 2:3
  showProgress?: boolean;
}

export default function RecipeGrid({
  recipes,
  onRecipeClick,
  emptyMessage = '게시물이 없습니다',
  emptyActionLabel,
  onEmptyAction,
  aspectRatio = 'square',
  showProgress = true,
}: RecipeGridProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<CookingProgress>({});

  useEffect(() => {
    if (showProgress) {
      const cookingProgress = JSON.parse(
        localStorage.getItem('cookingProgress') || '{}'
      );
      setProgress(cookingProgress);
    }
  }, [showProgress]);

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {emptyActionLabel && onEmptyAction && (
          <Button onClick={onEmptyAction}>{emptyActionLabel}</Button>
        )}
      </div>
    );
  }

  const handleClick = (recipe: Recipe, index: number) => {
    const recipeId = String(recipe.id);
    if (onRecipeClick) {
      onRecipeClick(recipeId, index);
    } else {
      router.push(`/recipe/${recipeId}`);
    }
  };

  const aspectClass =
    aspectRatio === 'portrait' ? 'aspect-[2/3]' : 'aspect-square';

  return (
    <div className="grid grid-cols-3 gap-1">
      {recipes.map((recipe, index) => {
        const recipeId = String(recipe.id);
        const likesCount = recipe.likesCount ?? recipe.likes_count ?? 0;
        const recipeProgress = progress[recipeId];

        return (
          <button
            key={recipeId}
            className={`relative ${aspectClass} bg-muted overflow-hidden group`}
            onClick={() => handleClick(recipe, index)}
          >
            {/* 미디어 */}
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : recipe.videoUrl ? (
              <video
                src={recipe.videoUrl}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                muted
                playsInline
              />
            ) : recipe.thumbnail ? (
              <img
                src={recipe.thumbnail}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No Image</span>
              </div>
            )}

            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-white font-semibold flex items-center gap-1">
                  <Heart className="h-5 w-5 fill-white" />
                  {likesCount.toLocaleString()}
                </span>
                {showProgress && recipeProgress && (
                  <span className="text-white text-sm font-semibold bg-mocha/80 px-2 py-1 rounded">
                    {recipeProgress.completed.length}/{recipeProgress.total}{' '}
                    단계
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
