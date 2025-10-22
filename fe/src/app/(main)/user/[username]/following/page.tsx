import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FollowingUser {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  bio: string | null;
}

export default function FollowingList() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadFollowingUsers();
  }, [username]);

  const loadFollowingUsers = async () => {
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

    // Get list of users the target user is following
    const { data: followsData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", profileData.user_id);

    if (!followsData || followsData.length === 0) {
      setFollowingUsers([]);
      setLoading(false);
      return;
    }

    const followingIds = followsData.map(f => f.following_id);

    // Get profiles of followed users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", followingIds);

    if (profilesData) {
      setFollowingUsers(profilesData);
    }

    setLoading(false);
  };

  const handleUnfollow = async (userId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", userId);

    if (!error) {
      toast.success("언팔로우했습니다");
      setFollowingUsers(followingUsers.filter(u => u.user_id !== userId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : followingUsers.length > 0 ? (
          <div className="space-y-4">
            {followingUsers.map((user) => (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnfollow(user.user_id)}
                >
                  팔로잉
                </Button>
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
