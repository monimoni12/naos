import { useState, useEffect } from "react";
import RecipeCard from "@/features/recipes/components/RecipeCard";
import PriceFilter, { FilterValues } from "@/features/recipes/components/PriceFilter";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [filters]);

  const loadRecipes = async () => {
    setLoading(true);
    
    // Build query with filters
    let query = supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // Apply filters directly in the database query
    if (filters.maxPrice) {
      query = query.or(`price.is.null,price.lte.${filters.maxPrice}`);
    }
    if (filters.maxCookTime) {
      query = query.lte("cook_time", filters.maxCookTime);
    }
    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.difficulty) {
      query = query.eq("difficulty", filters.difficulty);
    }

    const { data: recipesData, error: recipesError } = await query;
    
    if (recipesError) {
      console.error("Error loading recipes:", recipesError);
      setRecipes([]);
      setLoading(false);
      return;
    }

    if (!recipesData || recipesData.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(recipesData.map(r => r.user_id))];
    
    // Fetch profiles in parallel
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", userIds);
    
    // Create a map of user_id to profile
    const profilesMap = new Map(
      profilesData?.map(p => [p.user_id, p]) || []
    );
    
    // Combine recipes with profiles
    const recipesWithProfiles = recipesData.map(recipe => ({
      ...recipe,
      profiles: profilesMap.get(recipe.user_id)
    }));
    
    setRecipes(recipesWithProfiles);
    setLoading(false);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleDelete = async (recipeId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Delete error:', error);
      return;
    }

    // Reload recipes after delete
    loadRecipes();
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-32">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">레시피를 불러오는 중...</p>
        </div>
      ) : recipes.length > 0 ? (
        recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            author={{
              name: recipe.profiles?.username || "익명",
              avatar: recipe.profiles?.avatar_url || "",
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
        ))
      ) : (
        <div className="text-center py-12 bg-card rounded-xl">
          <p className="text-muted-foreground mb-2">조건에 맞는 레시피가 없습니다</p>
          <p className="text-sm text-muted-foreground">필터를 조정해보세요</p>
        </div>
      )}
      
      {/* Fixed Filter Button */}
      <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center">
        <PriceFilter onFilterChange={handleFilterChange} />
      </div>
    </div>
  );
}
