'use client';

export const dynamic = 'force-dynamic';

/**
 * 내 프로필 페이지
 * 위치: src/app/(main)/profile/page.tsx
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Grid, Bookmark, PlaySquare, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { isLoggedIn } from '@/lib/auth';
import {
  ProfileShareDialog,
  RecipeGrid,
  SavedRecipesGrid,
  CookingRecipesGrid,
} from '@/features/profile/components';
import {
  getMyProfile,
  getMyRecipes,
  getFollowCounts,
} from '@/features/profile/api';
import { toFeedItem } from '@/features/profile/utils';
import type {
  ProfileResponse,
  ProfileTab,
  ViewMode,
} from '@/features/profile/types';
import { RecipeCard } from '@/features/feed/components';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsRef = useRef<HTMLDivElement>(null);

  // State
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]); // ⭐ 추가
  const [cookingRecipes, setCookingRecipes] = useState<any[]>([]); // ⭐ 추가
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<ProfileTab>('recipes');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const view = searchParams.get('view');
    setViewMode(view === 'feed' ? 'feed' : 'grid');
  }, [searchParams]);

  // 데이터 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (!isLoggedIn()) {
        router.push('/auth');
        return;
      }

      try {
        // 프로필 로드
        const profileData = await getMyProfile();
        setProfile(profileData);

        // 팔로워/팔로잉 수 로드
        if (profileData.userId) {
          const counts = await getFollowCounts(profileData.userId);
          setFollowersCount(counts.followerCount);
          setFollowingCount(counts.followingCount);
        }

        // 내 레시피 로드
        const recipes = await getMyRecipes();
        const formattedRecipes = recipes.map((recipe) => ({
          id: recipe.id,
          imageUrl: recipe.thumbnailUrl || recipe.imageUrl,
          videoUrl: recipe.videoUrl,
          thumbnail: recipe.thumbnailUrl,
          likesCount: recipe.likesCount || 0,
          title: recipe.title,
          description: recipe.description,
          authorName: profileData.username,
          authorAvatar: profileData.avatarUrl,
          authorId: recipe.authorId,
          createdAt: recipe.createdAt,
          steps: recipe.clips,
        }));
        setUserRecipes(formattedRecipes);
      } catch {
        toast.error('프로필을 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as ProfileTab);
    setViewMode('grid');
    router.replace('/profile', { scroll: false });
  };

  const scrollToTabs = () => {
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRecipeClick = (recipeId: string, index: number) => {
    setSelectedRecipeIndex(index);
    setViewMode('feed');
    router.replace('/profile?view=feed', { scroll: false });
  };

  // ⭐ 추가: 북마크 레시피 클릭 핸들러
  const handleSavedRecipeClick = (recipeId: string, index: number) => {
    setSelectedRecipeIndex(index);
    setViewMode('feed');
    router.replace('/profile?view=feed', { scroll: false });
  };

  // ⭐ 추가: 요리중 레시피 클릭 핸들러
  const handleCookingRecipeClick = (recipeId: string, index: number) => {
    setSelectedRecipeIndex(index);
    setViewMode('feed');
    router.replace('/profile?view=feed', { scroll: false });
  };

  const handleDelete = (id: number) => {
    // TODO: 삭제 API 호출
    setUserRecipes(userRecipes.filter((r) => r.id !== id));
    toast.success('레시피가 삭제되었습니다');
  };

  // ⭐ 추가: 현재 탭에 따른 피드용 레시피 목록 반환
  const getFeedRecipes = () => {
    switch (activeTab) {
      case 'recipes':
      case 'shorts':
        return activeTab === 'shorts'
          ? userRecipes.filter((r) => r.videoUrl)
          : userRecipes;
      case 'saved':
        return savedRecipes;
      case 'cooking':
        return cookingRecipes;
      default:
        return userRecipes;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // 비디오가 있는 레시피 (쇼츠)
  const videoRecipes = userRecipes.filter((r) => r.videoUrl);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {viewMode === 'grid' ? (
        <>
          {/* Profile Header */}
          <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-8">
            <div className="mb-6">
              {/* 상단: 프로필 사진 (중앙 정렬) */}
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 ring-4 ring-mocha/20">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-mocha/20 text-mocha text-2xl font-bold">
                    {profile?.username?.[0] || '나'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* 중앙: 닉네임 */}
              <div className="text-center mb-3">
                <h1 className="text-xl font-bold">
                  {profile?.fullName || profile?.username || '내 닉네임'}
                </h1>
                {profile?.username && (
                  <p className="text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                )}
              </div>

              {/* 하단: 통계 (중앙 정렬) */}
              <div className="flex justify-center gap-16 mb-4">
                <button
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={scrollToTabs}
                >
                  <p className="text-xl font-bold">{userRecipes.length}</p>
                  <p className="text-xs text-muted-foreground">게시물</p>
                </button>
                <button
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() =>
                    profile?.username &&
                    router.push(`/user/${profile.username}/followers`)
                  }
                >
                  <p className="text-xl font-bold">{followersCount}</p>
                  <p className="text-xs text-muted-foreground">팔로워</p>
                </button>
                <button
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() =>
                    profile?.username &&
                    router.push(`/user/${profile.username}/following`)
                  }
                >
                  <p className="text-xl font-bold">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">팔로잉</p>
                </button>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-sm text-center text-muted-foreground mb-4">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                className="flex-1"
                variant="mocha"
                onClick={() => router.push('/profile/edit')}
              >
                프로필 편집
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowShareDialog(true)}
              >
                프로필 공유
              </Button>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
              ref={tabsRef}
            >
              <TabsList className="w-full grid grid-cols-4 h-auto p-0 bg-transparent border-b">
                <TabsTrigger
                  value="recipes"
                  className="py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-mocha data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Grid className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="shorts"
                  className="py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-mocha data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <PlaySquare className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-mocha data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Bookmark className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="cooking"
                  className="py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-mocha data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <ChefHat className="h-5 w-5" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recipes" className="mt-4">
                <RecipeGrid
                  recipes={userRecipes}
                  onRecipeClick={handleRecipeClick}
                  emptyMessage="아직 올린 레시피가 없습니다"
                  emptyActionLabel="첫 레시피 올리기"
                  onEmptyAction={() => router.push('/upload')}
                />
              </TabsContent>

              <TabsContent value="shorts" className="mt-4">
                <RecipeGrid
                  recipes={videoRecipes}
                  onRecipeClick={handleRecipeClick}
                  aspectRatio="portrait"
                  emptyMessage="아직 올린 쇼츠가 없습니다"
                  emptyActionLabel="첫 쇼츠 올리기"
                  onEmptyAction={() => router.push('/upload')}
                />
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                <SavedRecipesGrid
                  onRecipeClick={handleSavedRecipeClick}
                  onRecipesLoad={setSavedRecipes}
                />
              </TabsContent>

              <TabsContent value="cooking" className="mt-4">
                <CookingRecipesGrid
                  onRecipeClick={handleCookingRecipeClick}
                  onRecipesLoad={setCookingRecipes}
                />
              </TabsContent>
            </Tabs>
          </div>
        </>
      ) : (
        /* 피드 뷰 */
        <div className="space-y-6">
          {getFeedRecipes()
            .slice(selectedRecipeIndex)
            .map((recipe) => (
              <RecipeCard
                key={recipe.id}
                item={toFeedItem(recipe, profile)}
                clips={recipe.steps || []}
                onDelete={handleDelete}
              />
            ))}
        </div>
      )}

      <ProfileShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        username={profile?.username || ''}
      />
    </div>
  );
}
