import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Eye, MoreHorizontal, AlertCircle, EyeOff, UserMinus, QrCode, ArrowLeft, ChefHat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommentsSheet from "@/features/recipes/components/CommentsSheet";
import ShareDialog from "@/features/recipes/components/ShareDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Shorts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fromSearch = location.state?.fromSearch || false;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showCC, setShowCC] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [cookingRecipes, setCookingRecipes] = useState<Set<string>>(new Set());
  const [shorts, setShorts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [showNoMoreShorts, setShowNoMoreShorts] = useState(false);

  const currentShort = shorts[currentIndex];

  useEffect(() => {
    const storedCookingRecipes = JSON.parse(localStorage.getItem("cookingRecipes") || "[]");
    setCookingRecipes(new Set(storedCookingRecipes));
    
    // Get current user and load shorts
    const initializeShorts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      await loadShorts();
    };
    
    initializeShorts();
  }, []);

  useEffect(() => {
    if (currentShort && currentUserId) {
      loadInteractionStates();
      loadComments();
    }
  }, [currentIndex, currentShort, currentUserId]);

  const loadShorts = async () => {
    setLoading(true);

    try {
      // 빠른 초기 로딩을 위해 recipes만 먼저 가져오기
      const { data: recipesData, error } = await supabase
        .from("recipes")
        .select("id, user_id, video_url, title, description, likes_count, comments_count, steps")
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!recipesData || recipesData.length === 0) {
        setShorts([]);
        setLoading(false);
        return;
      }

      // 먼저 기본 데이터로 쇼츠 설정 (프로필 없이)
      const initialShorts = recipesData.map(recipe => ({
        id: recipe.id,
        author: {
          name: "로딩중...",
          avatar: "",
          userId: recipe.user_id,
        },
        videoUrl: recipe.video_url,
        title: recipe.title,
        description: recipe.description,
        likes: recipe.likes_count || 0,
        comments: recipe.comments_count || 0,
        steps: recipe.steps,
      }));

      setShorts(initialShorts);
      setLoading(false);

      // 백그라운드에서 프로필 정보 로드
      const userIds = [...new Set(recipesData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);
      
      if (profilesData) {
        const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));
        
        setShorts(prev => prev.map(short => {
          const profile = profilesMap.get(short.author.userId);
          return {
            ...short,
            author: {
              ...short.author,
              name: profile?.username || "익명",
              avatar: profile?.avatar_url || "",
            }
          };
        }));
      }
    } catch (error) {
      console.error('Error loading shorts:', error);
      setShorts([]);
      setLoading(false);
    }
  };

  const loadInteractionStates = async () => {
    if (!currentUserId || !currentShort) return;

    // Check if liked
    const { data: likeData } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("recipe_id", currentShort.id)
      .maybeSingle();

    if (likeData) {
      setLikedVideos(prev => new Set(prev).add(currentShort.id));
    } else {
      setLikedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentShort.id);
        return newSet;
      });
    }

    // Check if saved
    const { data: savedData } = await supabase
      .from("saved_recipes")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("recipe_id", currentShort.id)
      .maybeSingle();

    if (savedData) {
      setSavedVideos(prev => new Set(prev).add(currentShort.id));
    } else {
      setSavedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentShort.id);
        return newSet;
      });
    }
  };

  const loadComments = async () => {
    if (!currentShort) return;

    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .eq("recipe_id", currentShort.id)
      .order("created_at", { ascending: false });

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      return;
    }

    // Get unique user IDs from comments
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    
    // Fetch profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url")
      .in("user_id", userIds);
    
    // Create a map of user_id to profile
    const profilesMap = new Map(
      profilesData?.map(p => [p.user_id, p]) || []
    );

    const formattedComments = commentsData.map(comment => {
      const profile = profilesMap.get(comment.user_id);
      return {
        id: comment.id,
        author: {
          name: profile?.username || "익명",
          avatar: profile?.avatar_url || "",
        },
        text: comment.content,
        likes: 0,
        timestamp: new Date(comment.created_at).toLocaleString("ko-KR"),
      };
    });
    setComments(formattedComments);
  };

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      if (currentIndex < shorts.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowNoMoreShorts(false);
      } else {
        setShowNoMoreShorts(true);
        setTimeout(() => setShowNoMoreShorts(false), 2000);
      }
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowNoMoreShorts(false);
    }
  };

  const toggleLike = (id: string) => {
    setLikedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSave = (id: string) => {
    setSavedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleFollow = (authorName: string) => {
    setFollowedUsers((prev) => new Set(prev).add(authorName));
  };

  const handleCookingToggle = (id: string) => {
    const storedCookingRecipes = JSON.parse(localStorage.getItem("cookingRecipes") || "[]");
    const isCooking = cookingRecipes.has(id);
    
    if (!isCooking) {
      storedCookingRecipes.push(id);
      localStorage.setItem("cookingRecipes", JSON.stringify(storedCookingRecipes));
      setCookingRecipes(new Set([...cookingRecipes, id]));
      navigate(`/post/${id}`);
    } else {
      // 요리중 상태만 제거하고, 진행 상황(cookingProgress)은 유지
      const filtered = storedCookingRecipes.filter((recipeId: string) => recipeId !== id);
      localStorage.setItem("cookingRecipes", JSON.stringify(filtered));
      setCookingRecipes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDelete = async () => {
    if (!currentShort || !currentUserId) return;
    
    if (!window.confirm("정말로 이 게시물을 삭제하시겠습니까? 게시물과 쇼츠에서 모두 삭제됩니다.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', currentShort.id)
        .eq('user_id', currentUserId);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "게시물이 삭제되었습니다.",
      });

      // Remove from local state
      const updatedShorts = shorts.filter(s => s.id !== currentShort.id);
      setShorts(updatedShorts);
      
      // Adjust current index if needed
      if (currentIndex >= updatedShorts.length) {
        setCurrentIndex(Math.max(0, updatedShorts.length - 1));
      }

      // If no shorts left, go back
      if (updatedShorts.length === 0) {
        navigate('/');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "삭제 실패",
        description: "게시물 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const isOwnPost = currentShort && currentUserId && currentShort.author?.userId === currentUserId;

  const mockComments = [
    {
      id: "1",
      author: { name: "요리팬", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fan1" },
      text: "정말 유용한 레시피네요!",
      likes: 24,
      timestamp: "2시간 전",
    },
    {
      id: "2",
      author: { name: "쿠킹러버", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fan2" },
      text: "따라 만들어봤는데 대성공이에요!",
      likes: 15,
      timestamp: "1시간 전",
    },
  ];

  if (loading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-black">
        <p className="text-white">쇼츠를 불러오는 중...</p>
      </div>
    );
  }

  if (!currentShort) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-black">
        <p className="text-white">쇼츠가 없습니다</p>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-10rem)] overflow-hidden relative bg-black"
      onWheel={handleScroll}
    >
      {/* Video Container - 9:16 aspect ratio, full height */}
      <div className="h-full flex items-center justify-center relative">
        <div className="h-full aspect-[9/16] relative bg-black">
          <video
            key={currentShort.videoUrl}
            src={currentShort.videoUrl}
            className="w-full h-full object-contain scale-110"
            loop
            autoPlay
            muted={isMuted}
            playsInline
          />
        </div>
      </div>

      {/* Overlay Controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />

        {/* Back Button (only show when coming from search) */}
        {fromSearch && (
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors pointer-events-auto z-20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="flex items-end justify-between gap-4">
            {/* Left: Author Info */}
            <div className="flex-1 text-white pointer-events-auto">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/20">
                  <AvatarImage src={currentShort.author.avatar} />
                  <AvatarFallback className="bg-primary text-white">
                    {currentShort.author.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold">{currentShort.author.name}</span>
                {!followedUsers.has(currentShort.author.name) && (
                  <Button
                    variant="mocha"
                    size="sm"
                    className="h-7 px-4"
                    onClick={() => handleFollow(currentShort.author.name)}
                  >
                    팔로우
                  </Button>
                )}
              </div>
              <p className="text-sm mb-1">{currentShort.title}</p>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col items-center gap-6 pointer-events-auto">
              <button
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform w-20"
                onClick={() => handleCookingToggle(currentShort.id)}
              >
                <ChefHat className={`h-5 w-5 drop-shadow-lg transition-colors ${
                  cookingRecipes.has(currentShort.id) ? "fill-mocha text-mocha" : ""
                }`} />
                <span className="text-xs drop-shadow text-center whitespace-nowrap">
                  {cookingRecipes.has(currentShort.id) ? "요리중" : "요리 시작하기"}
                </span>
              </button>

              <button
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform w-20"
                onClick={() => navigate(`/post/${currentShort.id}`)}
              >
                <Eye className="h-5 w-5 drop-shadow-lg" />
                <span className="text-xs drop-shadow text-center">상세보기</span>
              </button>

              <button
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                onClick={() => toggleLike(currentShort.id)}
              >
                <Heart
                  className={`h-5 w-5 drop-shadow-lg transition-all ${
                    likedVideos.has(currentShort.id)
                      ? "fill-primary text-primary scale-110"
                      : ""
                  }`}
                />
                <span className="text-xs drop-shadow">
                  {likedVideos.has(currentShort.id)
                    ? (currentShort.likes + 1).toLocaleString()
                    : currentShort.likes.toLocaleString()}
                </span>
              </button>

              <button
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                onClick={() => setShowComments(true)}
              >
                <MessageCircle className="h-5 w-5 drop-shadow-lg" />
                <span className="text-xs drop-shadow">{currentShort.comments}</span>
              </button>

              <button
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                onClick={() => setShowShare(true)}
              >
                <Share2 className="h-5 w-5 drop-shadow-lg" />
                <span className="text-xs drop-shadow">공유</span>
              </button>

              <button
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                onClick={() => toggleSave(currentShort.id)}
              >
                <Bookmark
                  className={`h-5 w-5 drop-shadow-lg transition-all ${
                    savedVideos.has(currentShort.id)
                      ? "fill-mocha text-mocha scale-110"
                      : ""
                  }`}
                />
                <span className="text-xs drop-shadow">저장</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform">
                    <MoreHorizontal className="h-5 w-5 drop-shadow-lg" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="gap-2">
                    <Bookmark className="h-3 w-3" />
                    <span>저장</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <QrCode className="h-3 w-3" />
                    <span>QR 코드</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Eye className="h-3 w-3" />
                    <span>관심 있음</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <EyeOff className="h-3 w-3" />
                    <span>관심 없음</span>
                  </DropdownMenuItem>
                  {isOwnPost && (
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={handleDelete}>
                      <Trash2 className="h-3 w-3" />
                      <span>삭제</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>신고</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <UserMinus className="h-3 w-3" />
                    <span>콘텐츠 기본 설정 관리</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Audio Controls (Top Right) */}
        <div className="absolute top-6 right-6 flex flex-col items-center gap-3 pointer-events-auto z-10 w-20">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setShowCC(!showCC)}
            className={`h-10 w-10 rounded-full backdrop-blur-sm flex items-center justify-center text-white transition-colors ${
              showCC ? "bg-primary/80" : "bg-white/20 hover:bg-white/30"
            }`}
          >
            <span className="text-xs font-bold">CC</span>
          </button>
        </div>
      </div>

      {/* No More Shorts Message */}
      {showNoMoreShorts && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none z-30">
          <p className="text-white text-lg font-medium">다음 쇼츠가 없습니다</p>
        </div>
      )}

      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        comments={comments}
        commentsCount={currentShort.comments}
      />

      <ShareDialog open={showShare} onOpenChange={setShowShare} />
    </div>
  );
}
