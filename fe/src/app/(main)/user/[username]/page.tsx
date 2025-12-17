'use client';

/**
 * 다른 유저 프로필 페이지
 * 위치: src/app/(main)/user/[username]/page.tsx
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Grid, PlaySquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';
import { ProfileShareDialog, RecipeGrid } from '@/features/profile/components';
import {
  getProfileByUsername,
  getUserRecipes,
  getFollowCounts,
  toggleFollow,
  checkFollowStatus,
} from '@/features/profile/api';
import type { ProfileResponse } from '@/features/profile/types';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const tabsRef = useRef<HTMLDivElement>(null);

  // State
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('recipes');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!username) return;

      const user = getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      try {
        // 프로필 로드
        const profileData = await getProfileByUsername(username);
        setProfile(profileData);

        // 팔로우 상태 확인
        if (user && profileData.userId) {
          const following = await checkFollowStatus(profileData.userId);
          setIsFollowing(following);
        }

        // 팔로워/팔로잉 수 로드
        if (profileData.userId) {
          const counts = await getFollowCounts(profileData.userId);
          setFollowersCount(counts.followerCount);
          setFollowingCount(counts.followingCount);
        }

        // 유저의 레시피 로드
        if (profileData.userId) {
          const userRecipes = await getUserRecipes(profileData.userId);
          const formattedRecipes = userRecipes.map((recipe) => ({
            id: recipe.id,
            imageUrl: recipe.thumbnailUrl || recipe.imageUrl,
            videoUrl: recipe.videoUrl,
            thumbnail: recipe.thumbnailUrl,
            likesCount: recipe.likesCount || 0,
          }));
          setRecipes(formattedRecipes);
        }
      } catch {
        toast.error('프로필을 찾을 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [username]);

  const handleToggleFollow = async () => {
    if (!profile?.userId) return;

    const user = getUser();
    if (!user) {
      toast.error('로그인이 필요합니다');
      router.push('/auth');
      return;
    }

    try {
      const result = await toggleFollow(profile.userId);
      setIsFollowing(result.following);
      setFollowersCount(result.followerCount);
      toast.success(result.following ? '팔로우했습니다' : '언팔로우했습니다');
    } catch (_) {
      toast.error('팔로우 처리에 실패했습니다');
    }
  };

  const scrollToTabs = () => {
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 비디오가 있는 레시피 (쇼츠)
  const videoRecipes = recipes.filter((r) => r.videoUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">프로필을 찾을 수 없습니다</p>
      </div>
    );
  }

  // 본인 프로필이면 /profile로 리다이렉트
  if (currentUserId && profile.userId === currentUserId) {
    router.replace('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-8 mb-6">
          <div className="mb-6">
            {/* 상단: 프로필 사진 (중앙 정렬) */}
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 ring-4 ring-mocha/20">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="bg-mocha/20 text-mocha text-2xl font-bold">
                  {profile.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* 중앙: 닉네임 */}
            <div className="text-center mb-3">
              <h1 className="text-xl font-bold">
                {profile.fullName || profile.username}
              </h1>
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
            </div>

            {/* 하단: 통계 (중앙 정렬) */}
            <div className="flex justify-center gap-16 mb-4">
              <button
                className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                onClick={scrollToTabs}
              >
                <p className="text-xl font-bold">{recipes.length}</p>
                <p className="text-xs text-muted-foreground">게시물</p>
              </button>
              <button
                className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => router.push(`/user/${username}/followers`)}
              >
                <p className="text-xl font-bold">{followersCount}</p>
                <p className="text-xs text-muted-foreground">팔로워</p>
              </button>
              <button
                className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => router.push(`/user/${username}/following`)}
              >
                <p className="text-xl font-bold">{followingCount}</p>
                <p className="text-xs text-muted-foreground">팔로잉</p>
              </button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-center text-muted-foreground mb-4">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant={isFollowing ? 'outline' : 'mocha'}
              onClick={handleToggleFollow}
            >
              {isFollowing ? '팔로잉' : '팔로우'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowShareDialog(true)}
            >
              프로필 공유
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
          ref={tabsRef}
        >
          <TabsList className="w-full grid grid-cols-2 h-auto p-1 bg-card rounded-lg shadow-[var(--shadow-card)] mb-4">
            <TabsTrigger
              value="recipes"
              className="py-3 data-[state=active]:bg-mocha data-[state=active]:text-mocha-foreground"
            >
              <Grid className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger
              value="shorts"
              className="py-3 data-[state=active]:bg-mocha data-[state=active]:text-mocha-foreground"
            >
              <PlaySquare className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes" className="mt-0">
            <RecipeGrid recipes={recipes} emptyMessage="게시물이 없습니다" />
          </TabsContent>

          <TabsContent value="shorts" className="mt-0">
            <RecipeGrid
              recipes={videoRecipes}
              aspectRatio="portrait"
              emptyMessage="쇼츠가 없습니다"
            />
          </TabsContent>
        </Tabs>

        <ProfileShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          username={profile.username}
        />
      </div>
    </div>
  );
}
