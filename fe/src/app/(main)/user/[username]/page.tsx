import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, PlaySquare, ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileShareDialog from "@/features/profile/components/ProfileShareDialog";

export default function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("recipes");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Check if came from Following page
  const fromFollowing = location.state?.fromFollowing || false;

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!username) return;

      // Load user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Load followers count
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileData.user_id);
        setFollowersCount(followersCount || 0);

        // Load following count
        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profileData.user_id);
        setFollowingCount(followingCount || 0);

        // Load user's recipes
        const { data: recipesData } = await supabase
          .from("recipes")
          .select("*")
          .eq("user_id", profileData.user_id)
          .order("created_at", { ascending: false });

        if (recipesData) {
          setRecipes(recipesData);
        }
      }

      setLoading(false);
    };

    loadUserProfile();
  }, [username]);

  const scrollToTabs = () => {
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const RecipeGrid = ({ recipes }: { recipes: any[] }) => {
    const [progress, setProgress] = useState<Record<string, { completed: number[]; total: number }>>({});

    useEffect(() => {
      const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      setProgress(cookingProgress);
    }, []);

    if (recipes.length === 0) {
      return null;
    }

    return (
      <div className="grid grid-cols-3 gap-1">
        {recipes.map((recipe) => (
          <button
            key={recipe.id}
            className="relative aspect-square bg-muted overflow-hidden group"
            onClick={() => navigate(`/user/${username}/posts`)}
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
  };

  const ShortsGrid = ({ recipes }: { recipes: any[] }) => {
    const [progress, setProgress] = useState<Record<string, { completed: number[]; total: number }>>({});

    useEffect(() => {
      const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      setProgress(cookingProgress);
    }, []);

    if (recipes.length === 0) {
      return null;
    }

    return (
      <div className="grid grid-cols-3 gap-1">
        {recipes.map((recipe) => (
          <button
            key={recipe.id}
            className="relative aspect-[2/3] bg-muted overflow-hidden group"
            onClick={() => navigate(`/user/${username}/posts`)}
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
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-card rounded-xl shadow-[var(--shadow-card)] p-8 mb-6">
          <div className="mb-6">
            {/* 상단: 프로필 사진 (중앙 정렬) */}
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 ring-4 ring-mocha/20">
                <AvatarImage src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user1"} />
                <AvatarFallback className="bg-mocha/20 text-mocha text-2xl font-bold">
                  {profile?.username?.[0] || username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* 중앙: 닉네임 */}
            <div className="text-center mb-3">
              <h1 className="text-xl font-bold">{profile?.username || username}</h1>
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
                onClick={() => navigate(`/user/${username}/followers`)}
              >
                <p className="text-xl font-bold">{followersCount}</p>
                <p className="text-xs text-muted-foreground">팔로워</p>
              </button>
              <button 
                className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => navigate(`/user/${username}/following`)}
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
          <div className="flex gap-3">
            <Button 
              className="flex-1"
              variant={isFollowing ? "outline" : "mocha"}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? "팔로잉" : "팔로우"}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" ref={tabsRef}>
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
            {loading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : recipes.length > 0 ? (
              <RecipeGrid recipes={recipes} />
            ) : (
              <div className="text-center py-16 bg-card rounded-xl">
                <p className="text-muted-foreground">게시물이 없습니다</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shorts" className="mt-0">
            {loading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : recipes.filter(r => r.video_url).length > 0 ? (
              <ShortsGrid recipes={recipes.filter(r => r.video_url)} />
            ) : (
              <div className="text-center py-16 bg-card rounded-xl">
                <p className="text-muted-foreground">쇼츠가 없습니다</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ProfileShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          username={profile?.username || username || ""}
        />
      </div>
    </div>
  );
}
