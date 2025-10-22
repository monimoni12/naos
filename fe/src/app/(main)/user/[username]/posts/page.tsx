import { useNavigate, useParams } from "react-router-dom";
import RecipeCard from "@/features/recipes/components/RecipeCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function UserPosts() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPosts = async () => {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);

      if (!username) return;

      // Load user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Load user's recipes
        const { data: recipesData } = await supabase
          .from("recipes")
          .select("*")
          .eq("user_id", profileData.user_id)
          .order("created_at", { ascending: false });

        if (recipesData) {
          const formattedRecipes = recipesData.map((recipe: any) => ({
            id: recipe.id,
            author: {
              name: profileData.username,
              avatar: profileData.avatar_url,
              isFollowing: false,
              userId: profileData.user_id,
            },
            images: recipe.image_url && recipe.video_url ? [recipe.image_url, recipe.video_url] : recipe.video_url ? [recipe.video_url] : recipe.image_url ? [recipe.image_url] : [],
            title: recipe.title,
            description: recipe.description || "",
            likes: recipe.likes_count || 0,
            comments: recipe.comments_count || 0,
            timestamp: new Date(recipe.created_at).toLocaleDateString('ko-KR'),
            steps: recipe.steps,
          }));
          setRecipes(formattedRecipes);
        }
      }

      setLoading(false);
    };

    loadUserPosts();
  }, [username]);

  const handleDelete = async (recipeId: string) => {
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (!error) {
      setRecipes(recipes.filter(r => r.id !== recipeId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Posts Feed */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : recipes.length > 0 ? (
          recipes.map((post) => (
            <RecipeCard 
              key={post.id} 
              {...post} 
              currentUserId={currentUserId || undefined}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-card rounded-xl">
            <p className="text-muted-foreground">게시물이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
