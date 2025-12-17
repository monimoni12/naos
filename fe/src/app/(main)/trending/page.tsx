'use client';

import { useFeed, RecipeCard, FeedFilter } from '@/features/feed';

export default function TrendingPage() {
  const {
    items,
    loading,
    loadingMore,
    error,
    hasNext,
    filters,
    updateFilters,
    loadMore,
    toggleLike,
    toggleBookmark,
    toggleFollow,
    deleteRecipe,
  } = useFeed({ mode: 'trending' });

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-32">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">인기 레시피를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <p className="text-destructive mb-2">{error}</p>
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
        <div className="text-center py-12 bg-card rounded-xl">
          <p className="text-muted-foreground">아직 인기 레시피가 없습니다</p>
        </div>
      )}

      {/* 고정 필터 버튼 */}
      <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center">
        <FeedFilter onFilterChange={updateFilters} currentFilters={filters} />
      </div>
    </div>
  );
}
