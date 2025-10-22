import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FollowerUser {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
}

export default function FollowersList() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [followerUsers, setFollowerUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  useEffect(() => {
    loadFollowers();
  }, [username]);

  const loadFollowers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }

    if (!username) {
      setLoading(false);
      return;
    }

    // Get target user's user_id from username
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setTargetUserId(profileData.user_id);

    // Get list of users who follow the target user
    const { data: followsData } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", profileData.user_id);

    if (!followsData || followsData.length === 0) {
      setFollowerUsers([]);
      setLoading(false);
      return;
    }

    const followerIds = followsData.map(f => f.follower_id);

    // Get profiles of followers
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", followerIds);

    if (profilesData) {
      setFollowerUsers(profilesData);
    }

    setLoading(false);
  };

  const handleFollow = async (followUserId: string) => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다");
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("follows")
      .insert({
        follower_id: currentUserId,
        following_id: followUserId
      });

    if (!error) {
      toast.success("팔로우했습니다");
    }
  };

  const handleUnfollow = async (followUserId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", followUserId);

    if (!error) {
      toast.success("언팔로우했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : followerUsers.length > 0 ? (
          <div className="space-y-4">
            {followerUsers.map((user) => (
              <div
                key={user.id}
                className="bg-card rounded-xl p-4 shadow-[var(--shadow-card)] flex items-center justify-between"
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => navigate(`/user/${user.username}`)}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-mocha/10">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-mocha/20 text-mocha font-bold">
                      {user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{user.username}</p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                {currentUserId && currentUserId !== user.user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFollow(user.user_id)}
                  >
                    팔로우
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              아직 팔로워가 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              맛있는 레시피를 공유하고 팔로워를 늘려보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
