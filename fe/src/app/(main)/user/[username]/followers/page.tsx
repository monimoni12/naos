"use client";

/**
 * 팔로워 목록 페이지
 * 위치: src/app/(main)/user/[username]/followers/page.tsx
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getUser } from "@/lib/auth";
import {
  getProfileByUsername,
  getFollowers,
  toggleFollow,
} from "@/features/profile/api";
import type { FollowUserResponse } from "@/features/profile/types";

export default function FollowersPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [followers, setFollowers] = useState<FollowUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadFollowers();
  }, [username]);

  const loadFollowers = async () => {
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

      // 팔로워 목록 조회
      const followersData = await getFollowers(profile.userId);
      setFollowers(followersData);
    } catch (error) {
      console.error("Failed to load followers:", error);
      toast.error("팔로워 목록을 불러올 수 없습니다");
    } finally {
      setLoading(false);
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
      setFollowers((prev) =>
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
        {followers.length > 0 ? (
          <div className="space-y-4">
            {followers.map((user, index) => (
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
            <p className="text-muted-foreground mb-4">아직 팔로워가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              맛있는 레시피를 공유하고 팔로워를 늘려보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
