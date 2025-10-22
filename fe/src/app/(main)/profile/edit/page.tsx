import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    nickname: "내 닉네임",
    bio: "맛있는 레시피를 공유하는 요리 애호가입니다 🍳",
  });

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileData) {
        setProfileData({
          avatar: profileData.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
          nickname: profileData.username || "내 닉네임",
          bio: profileData.bio || "맛있는 레시피를 공유하는 요리 애호가입니다 🍳",
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, [navigate]);

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        username: profileData.nickname,
        bio: profileData.bio,
        avatar_url: profileData.avatar,
      })
      .eq("user_id", session.user.id);

    if (!error) {
      toast({
        title: "프로필이 저장되었습니다",
      });
      navigate("/profile");
    } else {
      toast({
        title: "저장 실패",
        description: "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast({
      title: "로그아웃되었습니다",
    });
    navigate("/");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === "탈퇴") {
      // 여기서 계정 삭제 로직 추가
      localStorage.removeItem("isLoggedIn");
      toast({
        title: "계정이 삭제되었습니다",
        description: "그동안 이용해 주셔서 감사합니다.",
      });
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">프로필 수정</h1>
          <Button variant="ghost" onClick={handleSave} className="text-foreground hover:bg-accent">완료</Button>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="bg-card rounded-xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.avatar} />
                <AvatarFallback>{profileData.nickname[0]}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              프로필 사진 변경
            </Button>
          </div>

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              value={profileData.nickname}
              onChange={(e) =>
                setProfileData({ ...profileData, nickname: e.target.value })
              }
              placeholder="닉네임을 입력하세요"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">소개</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              placeholder="자신을 소개해주세요"
              rows={4}
            />
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold">계정 정보</h3>
            <div className="space-y-2">
              <Label>이메일</Label>
              <p className="text-sm text-muted-foreground">user@example.com</p>
            </div>
            <div className="space-y-2">
              <Label>전화번호</Label>
              <p className="text-sm text-muted-foreground">+82 10-1234-5678</p>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </div>

          {/* Delete Account */}
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                  계정 삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말로 계정을 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      이 작업은 되돌릴 수 없습니다. 계정을 삭제하면 모든 레시피, 팔로워, 저장된 콘텐츠가 영구적으로 삭제됩니다.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-text">계속하려면 <strong>"탈퇴"</strong>를 입력하세요</Label>
                      <Input
                        id="confirm-text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="탈퇴"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "탈퇴"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
