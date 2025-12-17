'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFeed, RecipeCard } from '@/features/feed';
import { isLoggedIn } from '@/lib/auth';

export default function FollowingPage() {
  const router = useRouter();
  const {
    items,
    loading,
    loadingMore,
    error,
    hasNext,
    loadMore,
    toggleLike,
    toggleBookmark,
    toggleFollow,
    deleteRecipe,
  } = useFeed({ mode: 'following' });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/auth');
    }
  }, [router]);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-32">
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive">{error}</p>
        </div>
      ) : items.length > 0 ? (
        <>
          {items.map((item) => (
            <RecipeCard
              key={item.id}
              item={item}
              onLikeChange={(liked, count) => toggleLike(item.id)}
              onBookmarkChange={(bookmarked) => toggleBookmark(item.id)}
              onFollowChange={(following) => toggleFollow(item.authorId)}
              onDelete={deleteRecipe}
            />
          ))}
          
          {hasNext && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm text-mocha hover:underline disabled:opacity-50"
              >
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">아직 팔로우한 사람이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            홈 피드에서 관심있는 레시피를 찾아보세요!
          </p>
        </div>
      )}
    </div>
  );
}
