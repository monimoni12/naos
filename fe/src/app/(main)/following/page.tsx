"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RecipeCard from "@/features/recipes/components/RecipeCard";
import { supabase } from "@/integrations/supabase/client";

export default function Following() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadFollowingRecipes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      setCurrentUserId(session.user.id);

      // Get list of users the current user is following
      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", session.user.id);

      if (!followsData || followsData.length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const followingIds = followsData.map(f => f.following_id);

      // Get recipes from followed users
      const { data: recipesData } = await supabase
        .from("recipes")
        .select("*")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false });

      if (recipesData && recipesData.length > 0) {
        const userIds = [...new Set(recipesData.map((r: any) => r.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        const formattedRecipes = recipesData.map((recipe: any) => {
          const profile = profilesMap.get(recipe.user_id);
          return {
            id: recipe.id,
            author: {
              name: profile?.username || "Unknown",
              avatar: profile?.avatar_url,
              isFollowing: true,
              userId: recipe.user_id,
            },
            images: recipe.image_url && recipe.video_url ? [recipe.image_url, recipe.video_url] : recipe.video_url ? [recipe.video_url] : recipe.image_url ? [recipe.image_url] : [],
            title: recipe.title,
            description: recipe.description || "",
            likes: recipe.likes_count || 0,
            comments: recipe.comments_count || 0,
            timestamp: new Date(recipe.created_at).toLocaleDateString('ko-KR'),
            steps: recipe.steps,
            fromFollowing: true,
          };
        });

        setRecipes(formattedRecipes);
      }

      setLoading(false);
    };

    loadFollowingRecipes();
  }, [router]);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : recipes.length > 0 ? (
        recipes.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            {...recipe} 
            currentUserId={currentUserId || undefined}
          />
        ))
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            아직 팔로우한 사람이 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            홈 피드에서 관심있는 레시피를 찾아보세요!
          </p>
        </div>
      )}
    </div>
  );
}
