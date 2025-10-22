import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Star, UserMinus, AlertCircle, EyeOff, QrCode, ChefHat, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CommentsSheet from "@/features/recipes/components/CommentsSheet";
import ShareDialog from "@/features/recipes/components/ShareDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Step {
  step: number;
  description: string;
  startTime?: number;
  endTime?: number;
}

interface RecipeCardProps {
  id: string;
  author: {
    name: string;
    avatar?: string;
    isFollowing?: boolean;
    userId?: string;
  };
  images: string[];
  title: string;
  description: string;
  likes: number;
  comments: number;
  timestamp: string;
  fromFollowing?: boolean;
  steps?: Step[];
  currentUserId?: string;
  onDelete?: (id: string) => void;
  externalCheckedSteps?: number[];
  onStepCheck?: (stepIndex: number) => void;
  disableClick?: boolean;
}

export default function RecipeCard({
  id,
  author,
  images,
  title,
  description,
  likes: initialLikes,
  comments,
  timestamp,
  fromFollowing = false,
  steps,
  currentUserId,
  onDelete,
  externalCheckedSteps,
  onStepCheck,
  disableClick = false,
}: RecipeCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(initialLikes || 0);
  const [isFollowing, setIsFollowing] = useState(author.isFollowing || false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [progress, setProgress] = useState<{ completed: number[]; total: number } | null>(null);
  const [internalCheckedSteps, setInternalCheckedSteps] = useState<number[]>([]);
  const [showClipNumber, setShowClipNumber] = useState(false);

  // Use external checkedSteps if provided, otherwise use internal state
  const checkedSteps = externalCheckedSteps !== undefined ? externalCheckedSteps : internalCheckedSteps;
  const setCheckedSteps = onStepCheck ? 
    (updater: number[] | ((prev: number[]) => number[])) => {
      const newSteps = typeof updater === 'function' ? updater(checkedSteps) : updater;
      newSteps.forEach((_, idx) => onStepCheck(idx));
    } : 
    setInternalCheckedSteps;

  const isOwnPost = currentUserId && author.userId && currentUserId === author.userId;
  const isDetailPage = location.pathname.includes('/post/');

  useEffect(() => {
    const cookingRecipes = JSON.parse(localStorage.getItem("cookingRecipes") || "[]");
    setIsCooking(cookingRecipes.includes(id));

    // Load progress
    const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
    if (cookingProgress[id]) {
      setProgress(cookingProgress[id]);
      if (!externalCheckedSteps) {
        setInternalCheckedSteps(cookingProgress[id].completed || []);
      }
    }

    // Check if recipe is saved
    if (currentUserId) {
      checkIfSaved();
      checkIfFollowing();
    }
  }, [id, currentUserId, externalCheckedSteps, author.userId]);

  const checkIfFollowing = async () => {
    if (!currentUserId || !author.userId) return;
    
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", author.userId)
      .maybeSingle();
    
    if (data) {
      setIsFollowing(true);
    }
  };

  // Show clip number when changed in detail page
  useEffect(() => {
    if (isDetailPage && (steps && steps.length > 1)) {
      setShowClipNumber(true);
      const timer = setTimeout(() => {
        setShowClipNumber(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentImage, isDetailPage, steps]);


  const checkIfSaved = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("saved_recipes")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("recipe_id", id)
      .maybeSingle();

    if (!error && data) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleStepCheck = (stepIndex: number) => {
    if (onStepCheck) {
      onStepCheck(stepIndex);
      return;
    }

    setInternalCheckedSteps((prev) => {
      let newChecked: number[];
      
      if (prev.includes(stepIndex)) {
        // 체크 해제: 해당 단계와 그 이후 단계들을 모두 해제
        newChecked = prev.filter((i) => i < stepIndex);
      } else {
        // 체크: 해당 단계까지의 모든 이전 단계들도 체크
        const stepsToCheck = Array.from({ length: stepIndex + 1 }, (_, i) => i);
        newChecked = [...new Set([...prev, ...stepsToCheck])].sort((a, b) => a - b);
      }
      
      // Save to localStorage
      const progress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      progress[id] = {
        completed: newChecked,
        total: steps?.length || 0
      };
      localStorage.setItem("cookingProgress", JSON.stringify(progress));
      
      return newChecked;
    });
  };

  const handleCookingToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const cookingRecipes = JSON.parse(localStorage.getItem("cookingRecipes") || "[]");
    const newIsCooking = !isCooking;
    
    if (newIsCooking) {
      cookingRecipes.push(id);
      localStorage.setItem("cookingRecipes", JSON.stringify(cookingRecipes));
      
      // Initialize cookingProgress with 0 completed steps
      const cookingProgress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      const totalSteps = steps?.length || 6; // Use actual steps length or default to 6
      cookingProgress[id] = {
        completed: [],
        total: totalSteps
      };
      localStorage.setItem("cookingProgress", JSON.stringify(cookingProgress));
      
      sessionStorage.setItem("justStartedCooking", id);
      setIsCooking(true);
      navigate(`/post/${id}`);
    } else {
      // 요리중 상태만 제거하고, 진행 상황(cookingProgress)은 유지
      const filtered = cookingRecipes.filter((recipeId: string) => recipeId !== id);
      localStorage.setItem("cookingRecipes", JSON.stringify(filtered));
      setIsCooking(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!currentUserId) {
      toast.error("로그인이 필요합니다");
      return;
    }

    // Optimistic UI update
    const previousState = isSaved;
    setIsSaved(!isSaved);

    if (previousState) {
      // Unsave
      toast.success("저장 취소했습니다");
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("recipe_id", id);
      
      if (error) {
        console.error("Unsave error:", error);
        setIsSaved(previousState); // Revert on error
        toast.error("저장 취소 실패");
      }
    } else {
      // Save
      toast.success("저장했습니다");
      const { error } = await supabase
        .from("saved_recipes")
        .insert({ user_id: currentUserId, recipe_id: id });
      
      if (error) {
        console.error("Save error:", error);
        setIsSaved(previousState); // Revert on error
        toast.error("저장 실패");
      }
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("정말로 이 게시물을 삭제하시겠습니까? 게시물과 쇼츠에서 모두 삭제됩니다.")) {
      onDelete(id);
    }
  };

  const mockComments = [
    {
      id: "1",
      author: { name: "요리초보", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2" },
      text: "너무 맛있어 보여요! 저도 만들어봐야겠어요 😋",
      likes: 12,
      timestamp: "1시간 전",
    },
    {
      id: "2",
      author: { name: "셰프지망생", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3" },
      text: "레시피 감사합니다!",
      likes: 5,
      timestamp: "30분 전",
    },
  ];

  const handleCardClick = () => {
    if (!disableClick) {
      navigate(`/post/${id}`);
    }
  };

  return (
    <article 
      className={`bg-card rounded-xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[box-shadow] duration-300 mb-4 ${!disableClick ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/user/${author.name}`, { state: { fromFollowing } })}
        >
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={author.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {author.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{author.name}</p>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {progress && isCooking && (
            <span className="text-xs font-semibold text-mocha bg-mocha/10 px-3 py-1 rounded-full">
              {progress.completed.length}/{progress.total} 단계
            </span>
          )}
          {!isFollowing && !isOwnPost && (
            <Button
              variant="mocha"
              size="sm"
              className="h-8 px-4 font-semibold"
              onClick={async () => {
                if (!currentUserId || !author.userId) return;
                
                const { error } = await supabase
                  .from("follows")
                  .insert({
                    follower_id: currentUserId,
                    following_id: author.userId,
                  });
                
                if (!error) {
                  setIsFollowing(true);
                  toast.success(`${author.name}님을 팔로우했습니다`);
                }
              }}
            >
              팔로우
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="gap-2" onClick={handleSaveToggle}>
                <Bookmark className="h-3 w-3" />
                <span>{isSaved ? "저장 취소" : "저장"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <QrCode className="h-3 w-3" />
                <span>QR 코드</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Star className="h-3 w-3" />
                <span>즐겨찾기에 추가</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <UserMinus className="h-3 w-3" />
                <span>팔로우 취소</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <AlertCircle className="h-3 w-3" />
                <span>이 계정 정보</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <AlertCircle className="h-3 w-3" />
                <span>이 게시물이 표시되는 이유</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <EyeOff className="h-3 w-3" />
                <span>숨기기</span>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Images/Video Carousel */}
      <div className="relative bg-muted aspect-video overflow-hidden">
        {/* 첫 장(currentImage === 0): 섬네일이 있으면 표시, 없으면 비디오 */}
        {currentImage === 0 ? (
          images[0] ? (
            <img
              src={images[0]}
              className="w-full h-full object-cover"
              alt="섬네일"
            />
          ) : images[1] ? (
            <video
              key="thumbnail-video"
              src={images[1]}
              className="w-full h-full object-cover"
              loop
              autoPlay
              muted
              playsInline
            />
          ) : null
        ) : images[1] ? (
          <video
            key={currentImage}
            src={images[1]}
            className="w-full h-full object-cover"
            loop
            autoPlay
            muted
            playsInline
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              const currentStep = steps?.[currentImage - 1];
              if (currentStep && currentStep.startTime !== undefined) {
                video.currentTime = currentStep.startTime;
              }
            }}
            onPlay={(e) => {
              const video = e.currentTarget;
              const currentStep = steps?.[currentImage - 1];
              if (currentStep && currentStep.startTime !== undefined) {
                video.currentTime = currentStep.startTime;
              }
            }}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              const currentStep = steps?.[currentImage - 1];
              if (currentStep && currentStep.endTime !== undefined && video.currentTime >= currentStep.endTime) {
                video.currentTime = currentStep.startTime || 0;
              }
            }}
          />
        ) : images[0] ? (
          <video
            key={currentImage}
            src={images[0]}
            className="w-full h-full object-cover"
            loop
            autoPlay
            muted
            playsInline
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              const currentStep = steps?.[currentImage - 1];
              if (currentStep && currentStep.startTime !== undefined) {
                video.currentTime = currentStep.startTime;
              }
            }}
            onPlay={(e) => {
              const video = e.currentTarget;
              const currentStep = steps?.[currentImage - 1];
              if (currentStep && currentStep.startTime !== undefined) {
                video.currentTime = currentStep.startTime;
              }
            }}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              const currentStep = steps?.[currentImage - 1];
              if (currentStep && currentStep.endTime !== undefined && video.currentTime >= currentStep.endTime) {
                video.currentTime = currentStep.startTime || 0;
              }
            }}
          />
        ) : null}
        {/* 상세 페이지에서 클립 자막 표시, currentImage > 0일 때만 (첫 장은 섬네일) */}
        {isDetailPage && steps && steps.length > 0 && currentImage > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            {isCooking ? (
              <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                checkedSteps.includes(currentImage - 1) 
                  ? "bg-mocha/10 border border-mocha" 
                  : "bg-muted/30"
              }`}>
                <Checkbox
                  id={`video-step-${currentImage}`}
                  checked={checkedSteps.includes(currentImage - 1)}
                  onCheckedChange={() => handleStepCheck(currentImage - 1)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  htmlFor={`video-step-${currentImage}`}
                  className={`flex-1 cursor-pointer ${
                    checkedSteps.includes(currentImage - 1) ? "line-through text-muted-foreground" : ""
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-semibold">{currentImage}단계.</span> {steps[currentImage - 1]?.description}
                </label>
                {checkedSteps.includes(currentImage - 1) && (
                  <Check className="h-5 w-5 text-mocha flex-shrink-0 mt-1" />
                )}
              </div>
            ) : (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p>
                  <span className="font-semibold">{currentImage}단계.</span> {steps[currentImage - 1]?.description}
                </p>
              </div>
            )}
          </div>
        )}
        {/* 클립 번호 표시: currentImage > 0일 때만 (첫 장 제외) */}
        {isDetailPage && showClipNumber && steps && steps.length > 1 && currentImage > 0 && (
          <div className="absolute top-4 right-4">
            <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-white font-semibold text-xs">
              {currentImage}/{steps.length}
            </div>
          </div>
        )}
        {/* 첫 장 포함 총 개수 계산: 섬네일(1) + 클립(steps.length) */}
        {((steps && steps.length > 0) || images.length > 1) && (
          <>
            {!isDetailPage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {/* 섬네일(1개) + 클립들 */}
                {Array.from({ length: (steps?.length || 0) + 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentImage
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50"
                    }`}
                    aria-label={idx === 0 ? "섬네일" : `클립 ${idx}`}
                  />
                ))}
              </div>
            )}
            {currentImage > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImage(currentImage - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-transparent hover:bg-black/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="이전 클립"
              >
                ‹
              </button>
            )}
            {currentImage < (steps?.length || 0) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImage(currentImage + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-transparent hover:bg-black/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="다음 클립"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              className="h-8 w-8 flex items-center justify-center"
              onClick={handleLike}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? "fill-mocha text-mocha" : "hover:text-muted-foreground"
                }`}
              />
            </button>
            <button
              className="h-8 w-8 flex items-center justify-center"
              onClick={() => setShowComments(true)}
            >
              <MessageCircle className="h-5 w-5 transition-colors hover:text-muted-foreground" />
            </button>
            <button
              className="h-8 w-8 flex items-center justify-center"
              onClick={() => setShowShare(true)}
            >
              <Share2 className="h-5 w-5 transition-colors hover:text-muted-foreground" />
            </button>
          </div>
          <button
            className="h-8 w-8 flex items-center justify-center"
            onClick={handleSaveToggle}
          >
            <Bookmark
              className={`h-5 w-5 transition-colors ${
                isSaved ? "fill-mocha text-mocha" : "hover:text-muted-foreground"
              }`}
            />
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm mb-2">좋아요 {likes.toLocaleString()}개</p>

        {/* Content */}
        <div className="text-sm space-y-1">
          <p>
            <span className="font-semibold mr-2">{author.name}</span>
            {/* 홈 피드: 첫 장은 description, 이후는 스크립트 */}
            {/* 상세 페이지: 항상 description */}
            {isDetailPage 
              ? description 
              : (currentImage === 0 ? description : steps?.[currentImage - 1]?.description || description)
            }
          </p>
          {comments > 0 && (
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowComments(true)}
            >
              댓글 {comments}개 모두 보기
            </button>
          )}
        </div>

        {/* 요리 시작하기 Button */}
        <Button
          variant="mocha"
          className="w-full mt-4 font-semibold"
          onClick={handleCookingToggle}
        >
          <ChefHat className="h-5 w-5" />
          {isCooking ? "요리중" : "요리 시작하기"}
        </Button>
      </div>

      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        comments={mockComments}
        commentsCount={comments}
      />

      <ShareDialog open={showShare} onOpenChange={setShowShare} />
    </article>
  );
}
