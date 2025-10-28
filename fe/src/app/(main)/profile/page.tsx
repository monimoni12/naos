"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Settings, Grid, Bookmark, PlaySquare, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProfileShareDialog from "@/features/profile/components/ProfileShareDialog";
import RecipeGrid from "@/features/recipes/components/RecipeGrid";
import ShortsGrid from "@/features/recipes/components/ShortsGrid";
import SavedRecipesGrid from "@/features/recipes/components/SavedRecipesGrid";
import CookingRecipesGrid from "@/features/recipes/components/CookingRecipesGrid";

import { supabase } from "@/integrations/supabase/client";

const mockUserRecipes = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
    likes: 1245,
  },
  {
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop",
    likes: 2891,
  },
  {
    id: "3",
    thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=400&fit=crop",
    likes: 3421,
  },
  {
    id: "4",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop",
    likes: 1156,
  },
  {
    id: "5",
    thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
    likes: 987,
  },
  {
    id: "6",
    thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
    likes: 754,
  },
];

const mockSavedRecipes = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop",
    likes: 2134,
  },
  {
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1547496502-affa22d38842?w=400&h=400&fit=crop",
    likes: 1876,
  },
];

export default function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("recipes");
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState<any[]>([]);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  // 탭 변경 핸들러 (변경 시 상태 초기화)
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setViewMode('grid');
    router.replace("/profile");
  };

  // URL 파라미터 변경 감지
  useEffect(() => {
    const view = searchParams.get("view");
  setViewMode(view === "feed" ? "feed" : "grid");
  }, [searchParams]);

  // 프로필 / 팔로워 / 레시피 / 리워드 로딩 로직
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      
      // 1) 프로필 로딩
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        
        // 2) followers/following count 쿼리
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", session.user.id);
        
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", session.user.id);
        
        // Update the displayed counts(상태반영)
        setFollowersCount(followersCount || 0);
        setFollowingCount(followingCount || 0);

      }

      // 3) 사용자 레시피 로딩
      const { data: recipesData } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      
      if (recipesData) {
        setUserRecipes(recipesData);
      }
      
      // 4) 유저 리워드 로딩
      const { data: userRewards } = await supabase
        .from("user_rewards")
        .select(`
          *,
          rewards (
            name,
            description,
            image_url,
            required_level
          )
        `)
        .eq("user_id", session.user.id)
        .order("claimed_at", { ascending: false });
      
      if (userRewards) {
        setClaimedRewards(userRewards);
      }
      
      setLoading(false);
    };
    loadProfile();
  }, [router]);

  // 탭 영역으로 스크롤 이동
  const scrollToTabs = () => {
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // UI 렌더링
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
                  <AvatarImage src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user1"} />
                  <AvatarFallback className="bg-mocha/20 text-mocha text-2xl font-bold">
                    {profile?.username?.[0] || "나"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* 중앙: 닉네임 */}
              <div className="text-center mb-3">
                <h1 className="text-xl font-bold">{profile?.display_name || profile?.username || "내 닉네임"}</h1>
              </div>

              {/* 배지 영역 - shields.io 스타일 */}
              {claimedRewards.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {claimedRewards.map((userReward) => {
                    const level = userReward.rewards?.required_level?.toLowerCase() || 'bronze';
                    const getBadgeColor = () => {
                      switch(level) {
                        case 'bronze': return 'bg-[#CD7F32] text-white';
                        case 'silver': return 'bg-[#C0C0C0] text-gray-800';
                        case 'gold': return 'bg-[#FFD700] text-gray-800';
                        case 'platinum': return 'bg-[#E5E4E2] text-gray-800';
                        case 'diamond': return 'bg-[#B9F2FF] text-gray-800';
                        default: return 'bg-[#CD7F32] text-white';
                      }
                    };
                    
                    return (
                      <div
                        key={userReward.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeColor()}`}
                        title={userReward.rewards?.description}
                      >
                        <span>{userReward.rewards?.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
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
                  onClick={() => profile?.username && router.push(`/user/${profile.username}/followers`)}
                >
                  <p className="text-xl font-bold" id="followers-count">{followersCount}</p>
                  <p className="text-xs text-muted-foreground">팔로워</p>
                </button>
                <button 
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => profile?.username && router.push(`/user/${profile.username}/following`)}
                >
                  <p className="text-xl font-bold" id="following-count">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">팔로잉</p>
                </button>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3 mb-6">
              <Button 
                className="flex-1"
                variant="mocha"
                onClick={() => router.push("/profile/edit")}
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

            {/* Tabs - 언더라인 스타일 */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" ref={tabsRef}>
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

              {/* 탭별 콘텐츠 */}
              <TabsContent value="recipes" className="mt-4">
                {loading ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">로딩 중...</p>
                  </div>
                ) : userRecipes.length > 0 ? (
                  <RecipeGrid recipes={userRecipes} />
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground mb-4">
                      아직 올린 레시피가 없습니다
                    </p>
                    <Button onClick={() => router.push("/upload")}>첫 레시피 올리기</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shorts" className="mt-4">
                {loading ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">로딩 중...</p>
                  </div>
                ) : userRecipes.filter(r => r.video_url).length > 0 ? (
                  <ShortsGrid recipes={userRecipes.filter(r => r.video_url)} />
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground mb-4">
                      아직 올린 쇼츠가 없습니다
                    </p>
                    <Button onClick={() => router.push("/upload")}>첫 쇼츠 올리기</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                <SavedRecipesGrid />
              </TabsContent>

              <TabsContent value="cooking" className="mt-4">
                <CookingRecipesGrid key={activeTab === 'cooking' ? Date.now() : 'cooking'} />
              </TabsContent>
            </Tabs>
          </div>
        </>
      ) : (
        <>
          {/* 피드 뷰 */}
          {activeTab === "recipes" && userRecipes.length > 0 && (
            <RecipeGrid recipes={userRecipes} />
          )}
          {activeTab === "shorts" && userRecipes.filter(r => r.video_url).length > 0 && (
            <ShortsGrid recipes={userRecipes.filter(r => r.video_url)} />
          )}
        </>
      )}

      <ProfileShareDialog 
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        username={profile?.username || ""}
      />
    </div>
  );
}
