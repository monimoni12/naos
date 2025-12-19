'use client';

import { useFeed, RecipeCard, FeedFilter } from '@/features/feed';

export default function HomePage() {
  const {
    items,
    loading,
    loadingMore,
    error,
    hasNext,
    filters,
    updateFilters,
    loadMore,
    // ⭐ API 호출 없이 로컬 상태만 업데이트하는 함수들
    updateItemLike,
    updateItemBookmark,
    updateItemFollow,
    deleteRecipe,
  } = useFeed({ mode: 'home' });

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-32">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">레시피를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <p className="text-destructive mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-mocha">
            다시 시도
          </button>
        </div>
      ) : items.length > 0 ? (
        <>
          {items.map((item) => (
            <RecipeCard
              key={item.id}
              item={item}
              // ⭐ RecipeCard가 이미 API 호출함 → 여기서는 로컬 상태만 동기화
              onLikeChange={(liked, count) => updateItemLike(item.id, liked, count)}
              onBookmarkChange={(bookmarked) => updateItemBookmark(item.id, bookmarked)}
              onFollowChange={(following) => updateItemFollow(item.authorId, following)}
              onDelete={deleteRecipe}
            />
          ))}
          
          {/* 더 불러오기 */}
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
          <p className="text-muted-foreground mb-2">조건에 맞는 레시피가 없습니다</p>
          <p className="text-sm text-muted-foreground">필터를 조정해보세요</p>
        </div>
      )}

      {/* 고정 필터 버튼 */}
      <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center">
        <FeedFilter onFilterChange={updateFilters} currentFilters={filters} />
      </div>
    </div>
  );
}
