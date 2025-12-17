"use client";

/**
 * 유저 게시물 피드 페이지
 * 위치: src/app/(main)/user/[username]/posts/page.tsx
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { RecipeCard } from "@/features/feed/components";
import {
  getProfileByUsername,
  getUserRecipes,
} from "@/features/profile/api";
import { toFeedItem } from "@/features/profile/utils";
import type { ProfileResponse } from "@/features/profile/types";

export default function UserPostsPage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserPosts = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        // Load user profile
        const profileData = await getProfileByUsername(username);
        setProfile(profileData);

        // Load user's recipes
        if (profileData?.userId) {
          const userRecipes = await getUserRecipes(profileData.userId);
          const formattedRecipes = userRecipes.map((recipe) => ({
            id: recipe.id,
            title: recipe.title || "",
            description: recipe.description || "",
            imageUrl: recipe.thumbnailUrl || recipe.imageUrl,
            videoUrl: recipe.videoUrl,
            thumbnailUrl: recipe.thumbnailUrl,
            authorId: profileData.userId,
            likesCount: recipe.likesCount || 0,
            commentsCount: recipe.commentsCount || 0,
            createdAt: recipe.createdAt,
            steps: recipe.clips || [],
          }));
          setRecipes(formattedRecipes);
        }
      } catch (_) {
        toast.error("게시물을 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    };

    loadUserPosts();
  }, [username]);

  const handleDelete = (id: number) => {
    // TODO: 삭제 API 호출
    setRecipes(recipes.filter((r) => r.id !== id));
    toast.success("레시피가 삭제되었습니다");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <div className="text-center py-16">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {recipes.length > 0 ? (
          <div className="space-y-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                item={toFeedItem(recipe, profile)}
                clips={recipe.steps || []}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl">
            <p className="text-muted-foreground">게시물이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
