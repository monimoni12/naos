"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Settings, Grid, Bookmark, PlaySquare, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileShareDialog from "@/features/profile/components/ProfileShareDialog";
import RecipeCard from "@/features/recipes/components/RecipeCard";
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

const SavedRecipesGrid = () => {
  const router = useRouter();
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, { completed: number[]; total: number }>>({});

  useEffect(() => {
    const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
    setProgress(cookingProgress);
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: savedData } = await supabase
      .from("saved_recipes")
      .select("recipe_id, recipes(*)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (savedData) {
      const recipes = savedData.map(s => s.recipes).filter(r => r !== null);
      setSavedRecipes(recipes);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (savedRecipes.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl">
        <p className="text-muted-foreground">저장된 레시피가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {savedRecipes.map((recipe: any) => (
        <button
          key={recipe.id}
          className="relative aspect-square bg-muted overflow-hidden group"
          onClick={() => router.push(`/post/${recipe.id}`)}
        >
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : recipe.video_url ? (
            <video
              src={recipe.video_url}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              muted
              playsInline
            />
          ) : (
            <img
              src={recipe.thumbnail}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-white font-semibold flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {(recipe.likes_count || 0).toLocaleString()}
              </span>
              {progress[recipe.id] && (
                <span className="text-white text-sm font-semibold bg-mocha/80 px-2 py-1 rounded">
                  {progress[recipe.id].completed.length}/{progress[recipe.id].total} 단계
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const CookingRecipesGrid = () => {
  const router = useRouter();
  const [cookingRecipes, setCookingRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, { completed: number[]; total: number }>>({});

  useEffect(() => {
    loadCookingRecipes();
  }, []);

  const loadCookingRecipes = async () => {
    const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
    setProgress(cookingProgress);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get recipe IDs from cooking progress
    const recipeIds = Object.keys(cookingProgress);
    
    if (recipeIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: recipesData } = await supabase
      .from("recipes")
      .select("*")
      .in("id", recipeIds);

    if (recipesData) {
      setCookingRecipes(recipesData);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (cookingRecipes.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl">
        <p className="text-muted-foreground">요리 중인 레시피가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {cookingRecipes.map((recipe: any) => (
        <button
          key={recipe.id}
          className="relative aspect-square bg-muted overflow-hidden group"
          onClick={() => router.push(`/post/${recipe.id}`)}
        >
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : recipe.video_url ? (
            <video
              src={recipe.video_url}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              muted
              playsInline
            />
          ) : (
            <img
              src={recipe.thumbnail}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-white font-semibold flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {(recipe.likes_count || 0).toLocaleString()}
              </span>
              {progress[recipe.id] && (
                <span className="text-white text-sm font-semibold bg-mocha/80 px-2 py-1 rounded">
                  {progress[recipe.id].completed.length}/{progress[recipe.id].total} 단계
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const mockCookingRecipes = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
    likes: 1245,
  },
  {
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
    likes: 987,
  },
];

export default function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("recipes");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setViewMode('grid');
    router.replace("/profile");
  };
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState<any[]>([]);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const view = searchParams.get("view");
  setViewMode(view === "feed" ? "feed" : "grid");
  }, [searchParams]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        
        // Load followers/following counts
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", session.user.id);
        
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", session.user.id);
        
        // Update the displayed counts
        const followersEl = document.getElementById("followers-count");
        const followingEl = document.getElementById("following-count");
        if (followersEl) followersEl.textContent = (followersCount || 0).toString();
        if (followingEl) followingEl.textContent = (followingCount || 0).toString();
      }

      // Load user's recipes
      const { data: recipesData } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      
      if (recipesData) {
        setUserRecipes(recipesData);
      }
      
      // Load claimed rewards
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
      
      // Load followers count
      const { count: followersC } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", session.user.id);
      setFollowersCount(followersC || 0);

      // Load following count
      const { count: followingC } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", session.user.id);
      setFollowingCount(followingC || 0);
      
      setLoading(false);
    };
    loadProfile();
  }, [navigate]);

  const scrollToTabs = () => {
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const RecipeGrid = ({ recipes }: { recipes: any[] }) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [progress, setProgress] = useState<Record<string, { completed: number[]; total: number }>>({});

    useEffect(() => {
      const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      setProgress(cookingProgress);
      
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setCurrentUserId(user.id);
        }
      });
    }, []);

    if (recipes.length === 0) {
      return null;
    }

    const handleDelete = async (recipeId: string) => {
      if (!currentUserId) return;

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', currentUserId);

      if (!error) {
        window.location.reload();
      }
    };

    // 그리드 뷰
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-3 gap-1">
          {recipes.map((recipe, index) => (
            <button
              key={recipe.id}
              className="relative aspect-square bg-muted overflow-hidden group"
              onClick={() => {
                setSelectedRecipeIndex(index);
                setViewMode('feed');
                navigate('/profile?view=feed', { replace: true });
              }}
            >
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : recipe.video_url ? (
                <video
                  src={recipe.video_url}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={recipe.thumbnail}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-white font-semibold flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {(recipe.likes_count || recipe.likes || 0).toLocaleString()}
                  </span>
                  {progress[recipe.id] && (
                    <span className="text-white text-sm font-semibold bg-mocha/80 px-2 py-1 rounded">
                      {progress[recipe.id].completed.length}/{progress[recipe.id].total} 단계
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    // 피드 뷰
    return (
      <div className="space-y-6">
        {recipes.slice(selectedRecipeIndex).map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            author={{
              name: recipe.profiles?.username || profile?.username || "익명",
              avatar: recipe.profiles?.avatar_url || profile?.avatar_url || "",
              isFollowing: false,
              userId: recipe.user_id,
            }}
            images={recipe.image_url && recipe.video_url ? [recipe.image_url, recipe.video_url] : recipe.video_url ? [recipe.video_url] : recipe.image_url ? [recipe.image_url] : []}
            title={recipe.title}
            description={recipe.description || ""}
            likes={recipe.likes_count || 0}
            comments={recipe.comments_count || 0}
            timestamp={new Date(recipe.created_at).toLocaleDateString("ko-KR")}
            steps={recipe.steps}
            currentUserId={currentUserId || undefined}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  const ShortsGrid = ({ recipes }: { recipes: any[] }) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [progress, setProgress] = useState<Record<string, { completed: number[]; total: number }>>({});

    useEffect(() => {
      const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      setProgress(cookingProgress);
      
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setCurrentUserId(user.id);
        }
      });
    }, []);

    if (recipes.length === 0) {
      return null;
    }

    const handleDelete = async (recipeId: string) => {
      if (!currentUserId) return;

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', currentUserId);

      if (!error) {
        window.location.reload();
      }
    };

    const videoRecipes = recipes.filter(r => r.video_url);

    if (videoRecipes.length === 0) {
      return null;
    }

    // 그리드 뷰
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-3 gap-1">
          {videoRecipes.map((recipe, index) => (
            <button
              key={recipe.id}
              className="relative aspect-[2/3] bg-muted overflow-hidden group"
              onClick={() => {
                setSelectedRecipeIndex(index);
                setViewMode('feed');
                navigate('/profile?view=feed', { replace: true });
              }}
            >
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : recipe.video_url ? (
                <video
                  src={recipe.video_url}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={recipe.thumbnail}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-white font-semibold flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {(recipe.likes_count || recipe.likes || 0).toLocaleString()}
                  </span>
                  {progress[recipe.id] && (
                    <span className="text-white text-sm font-semibold bg-mocha/80 px-2 py-1 rounded">
                      {progress[recipe.id].completed.length}/{progress[recipe.id].total} 단계
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    // 피드 뷰
    return (
      <div className="space-y-6">
        {videoRecipes.slice(selectedRecipeIndex).map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            author={{
              name: recipe.profiles?.username || profile?.username || "익명",
              avatar: recipe.profiles?.avatar_url || profile?.avatar_url || "",
              isFollowing: false,
              userId: recipe.user_id,
            }}
            images={[recipe.video_url]}
            title={recipe.title}
            description={recipe.description || ""}
            likes={recipe.likes_count || 0}
            comments={recipe.comments_count || 0}
            timestamp={new Date(recipe.created_at).toLocaleDateString("ko-KR")}
            steps={recipe.steps}
            currentUserId={currentUserId || undefined}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

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
                  onClick={() => profile?.username && navigate(`/user/${profile.username}/followers`)}
                >
                  <p className="text-xl font-bold" id="followers-count">{followersCount}</p>
                  <p className="text-xs text-muted-foreground">팔로워</p>
                </button>
                <button 
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => profile?.username && navigate(`/user/${profile.username}/following`)}
                >
                  <p className="text-xl font-bold" id="following-count">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">팔로잉</p>
                </button>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <Button 
                className="flex-1"
                variant="mocha"
                onClick={() => navigate("/profile/edit")}
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
                    <Button onClick={() => navigate("/upload")}>첫 레시피 올리기</Button>
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
                    <Button onClick={() => navigate("/upload")}>첫 쇼츠 올리기</Button>
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
