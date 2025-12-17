'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { feedApi, RecipeCard } from '@/features/feed';
import type { FeedItem } from '@/features/feed';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [recipe, setRecipe] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const data = await feedApi.getRecipeDetail(id);
        setRecipe(data);
      } catch (err) {
        console.error('Recipe load error:', err);
        setError('레시피를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRecipe();
    }
  }, [id]);

  const handleDelete = async (recipeId: number) => {
    try {
      await feedApi.deleteRecipe(recipeId);
      router.push('/');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || '레시피를 찾을 수 없습니다.'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          뒤로 가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate">{recipe.title}</h1>
        </div>
      </div>

      {/* 레시피 카드 */}
      <div className="container max-w-2xl mx-auto px-4 py-6 pb-32">
        <RecipeCard
          item={recipe}
          onDelete={handleDelete}
          disableClick
        />

        {/* 추가 정보 섹션 (선택) */}
        {(recipe.cookTimeMin || recipe.priceEstimate || recipe.kcalEstimate) && (
          <div className="mt-4 p-4 bg-card rounded-xl">
            <h2 className="font-semibold mb-3">레시피 정보</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {recipe.cookTimeMin && (
                <div>
                  <p className="text-2xl font-bold text-mocha">{recipe.cookTimeMin}</p>
                  <p className="text-xs text-muted-foreground">분</p>
                </div>
              )}
              {recipe.priceEstimate && (
                <div>
                  <p className="text-2xl font-bold text-mocha">
                    {recipe.priceEstimate.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">원</p>
                </div>
              )}
              {recipe.kcalEstimate && (
                <div>
                  <p className="text-2xl font-bold text-mocha">{recipe.kcalEstimate}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 태그 */}
        {recipe.dietTags && recipe.dietTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.dietTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-mocha/10 text-mocha text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
