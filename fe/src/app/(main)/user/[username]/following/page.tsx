"use client";

/**
 * 팔로잉 목록 페이지
 * 위치: src/app/(main)/user/[username]/following/page.tsx
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getUser } from "@/lib/auth";
import {
  getProfileByUsername,
  getFollowing,
  toggleFollow,
} from "@/features/profile/api";
import type { FollowUserResponse } from "@/features/profile/types";

export default function FollowingPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [following, setFollowing] = useState<FollowUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadFollowing();
  }, [username]);

  const loadFollowing = async () => {
    const user = getUser();
    if (user) {
      setCurrentUserId(user.id);
    }

    if (!username) {
      setLoading(false);
      return;
    }

    try {
      // username으로 프로필 조회해서 userId 얻기
      const profile = await getProfileByUsername(username);
      if (!profile?.userId) {
        setLoading(false);
        return;
      }

      // 팔로잉 목록 조회
      const followingData = await getFollowing(profile.userId);
      setFollowing(followingData);
    } catch (error) {
      console.error("Failed to load following:", error);
      toast.error("팔로잉 목록을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: number, index: number) => {
    if (!currentUserId) return;

    try {
      const result = await toggleFollow(targetUserId);
      if (!result.following) {
        // 언팔로우 성공 시 목록에서 제거
        setFollowing((prev) => prev.filter((_, i) => i !== index));
        toast.success("언팔로우했습니다");
      }
    } catch (error) {
      toast.error("언팔로우에 실패했습니다");
    }
  };

  const handleToggleFollow = async (targetUserId: number, index: number) => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다");
      router.push("/auth");
      return;
    }

    try {
      const result = await toggleFollow(targetUserId);
      // 팔로우 상태 업데이트
      setFollowing((prev) =>
        prev.map((user, i) =>
          i === index ? { ...user, isFollowing: result.following } : user
        )
      );
      toast.success(result.following ? "팔로우했습니다" : "언팔로우했습니다");
    } catch (error) {
      toast.error("팔로우 처리에 실패했습니다");
    }
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
        {following.length > 0 ? (
          <div className="space-y-4">
            {following.map((user, index) => (
              <div
                key={user.userId}
                className="bg-card rounded-xl p-4 shadow-[var(--shadow-card)] flex items-center justify-between"
              >
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => router.push(`/user/${user.username}`)}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-mocha/10">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-mocha/20 text-mocha font-bold">
                      {user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{user.fullName || user.username}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                {currentUserId && currentUserId !== user.userId && (
                  <Button
                    variant={user.isFollowing ? "outline" : "mocha"}
                    size="sm"
                    onClick={() => handleToggleFollow(user.userId, index)}
                  >
                    {user.isFollowing ? "팔로잉" : "팔로우"}
                  </Button>
                )}
              </div>
            ))}
          </div>
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
    </div>
  );
}
