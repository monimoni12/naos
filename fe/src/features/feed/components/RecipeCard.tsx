'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Star,
  UserMinus,
  AlertCircle,
  EyeOff,
  QrCode,
  ChefHat,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';
import { feedApi } from '../api/feedApi';
// ⭐ 수정: cooking API 함수 추가
import { 
  deleteRecipe, 
  startCooking, 
  endCookingByRecipe, 
  getCookingStatus,
  updateProgress 
} from '@/features/recipe/api/recipeApi';
import { CommentsSheet } from './CommentsSheet';
import { ShareDialog } from './ShareDialog';
import { ValueScoreBadge } from './ValueScoreBadge';
import type { FeedItem, RecipeClip } from '../types';

interface RecipeCardProps {
  item: FeedItem;
  clips?: RecipeClip[];
  onLikeChange?: (liked: boolean, count: number) => void;
  onBookmarkChange?: (bookmarked: boolean) => void;
  onFollowChange?: (following: boolean) => void;
  onDelete?: (id: number) => void;
  disableClick?: boolean;
  /** 슬라이드 변경 시 콜백 (상세 페이지에서 조리 단계 연동용) */
  onSlideChange?: (slideIndex: number) => void;
}

export function RecipeCard({
  item,
  clips = [],
  onLikeChange,
  onBookmarkChange,
  onFollowChange,
  onDelete,
  disableClick = false,
  onSlideChange,
}: RecipeCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [isSaved, setIsSaved] = useState(item.isBookmarked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [commentCount, setCommentCount] = useState(item.commentCount);
  const [isFollowing, setIsFollowing] = useState(item.isFollowing);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [totalSteps, setTotalSteps] = useState(0);  // ⭐ 추가
  const [showClipNumber, setShowClipNumber] = useState(false);
  
  // ⭐ 중복 클릭 방지용 - useRef는 즉시 값 변경됨 (useState는 비동기)
  const isLikeLoadingRef = useRef(false);
  const isBookmarkLoadingRef = useRef(false);
  const isFollowLoadingRef = useRef(false);
  const isCookingLoadingRef = useRef(false);  // ⭐ 추가

  const currentUser = getUser();
  const isOwnPost = currentUser && item.authorId === currentUser.id;
  const isDetailPage = pathname?.includes('/recipe/');
  
  // ⭐ clips: props로 받은 것 또는 item.clips 사용 (홈 피드 슬라이드 구간 재생용)
  const effectiveClips = clips.length > 0 ? clips : (item.clips || []);
  const totalSlides = 1 + (effectiveClips.length || item.totalClipCount || 0); // 썸네일 + 클립들

  // ⭐ 슬라이드 변경 시 상위 컴포넌트에 알림 (상세 페이지 조리 단계 연동)
  useEffect(() => {
    if (onSlideChange && currentSlide > 0) {
      onSlideChange(currentSlide - 1); // 클립 인덱스는 0부터 시작
    }
  }, [currentSlide, onSlideChange]);

  // ⭐ 수정: 쿠킹 모드 로드 - API 호출로 변경
  useEffect(() => {
    if (!currentUser) return;
    
    const loadCookingStatus = async () => {
      try {
        const status = await getCookingStatus(item.id);
        if (status) {
          setIsCooking(status.isCooking);
          setTotalSteps(status.progress.totalSteps);
          // progressStep 기반으로 체크된 스텝 계산
          if (status.progress.progressStep > 0) {
            const checked = Array.from({ length: status.progress.progressStep }, (_, i) => i);
            setCheckedSteps(checked);
          }
        }
      } catch (error) {
        console.error('요리 상태 로드 실패:', error);
      }
    };
    
    loadCookingStatus();
  }, [item.id, currentUser]);

  // 클립 번호 표시
  useEffect(() => {
    if (isDetailPage && totalSlides > 1 && currentSlide > 0) {
      setShowClipNumber(true);
      const timer = setTimeout(() => setShowClipNumber(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentSlide, isDetailPage, totalSlides]);

  // 좋아요 토글
  const handleLike = async () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      return;
    }
    
    // ⭐ 중복 클릭 방지 (useRef는 즉시 값 변경)
    if (isLikeLoadingRef.current) return;
    isLikeLoadingRef.current = true;

    // Optimistic update
    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setIsLiked(newLiked);
    setLikeCount(newCount);

    try {
      const result = await feedApi.toggleLike(item.id);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      onLikeChange?.(result.liked, result.likeCount);
    } catch (error) {
      // Revert
      setIsLiked(!newLiked);
      setLikeCount(likeCount);
      toast.error('좋아요 처리에 실패했습니다');
    } finally {
      isLikeLoadingRef.current = false;
    }
  };

  // 북마크 토글
  const handleSaveToggle = async () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      return;
    }
    
    // ⭐ 중복 클릭 방지 (useRef는 즉시 값 변경)
    if (isBookmarkLoadingRef.current) return;
    isBookmarkLoadingRef.current = true;

    const newSaved = !isSaved;
    setIsSaved(newSaved);
    toast.success(newSaved ? '저장했습니다' : '저장 취소했습니다');

    try {
      const result = await feedApi.toggleBookmark(item.id);
      setIsSaved(result.bookmarked);
      onBookmarkChange?.(result.bookmarked);
    } catch (error) {
      setIsSaved(!newSaved);
      toast.error('저장 처리에 실패했습니다');
    } finally {
      isBookmarkLoadingRef.current = false;
    }
  };

  // 팔로우 토글
  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      return;
    }
    
    // ⭐ 중복 클릭 방지 (useRef는 즉시 값 변경)
    if (isFollowLoadingRef.current) return;
    isFollowLoadingRef.current = true;

    try {
      const result = await feedApi.toggleFollow(item.authorId);
      setIsFollowing(result.following);
      onFollowChange?.(result.following);
      toast.success(
        result.following
          ? `${item.authorUsername}님을 팔로우했습니다`
          : `${item.authorUsername}님 팔로우를 취소했습니다`
      );
    } catch (error) {
      toast.error('팔로우 처리에 실패했습니다');
    } finally {
      isFollowLoadingRef.current = false;
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await deleteRecipe(item.id);
      toast.success('게시물이 삭제되었습니다.');
      onDelete?.(item.id);
      
      // 홈 피드에서 삭제한 경우 새로고침
      if (!isDetailPage) {
        window.location.reload();
      } else {
        // 상세 페이지에서 삭제한 경우 홈으로 이동
        router.push('/');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      toast.error('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // ⭐ 수정: 요리 시작/종료 토글 - API 호출로 변경
  const handleCookingToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      return;
    }

    // 중복 클릭 방지
    if (isCookingLoadingRef.current) return;
    isCookingLoadingRef.current = true;

    try {
      if (!isCooking) {
        // "요리 시작하기" 클릭 → API 호출 + 상세 페이지로 이동
        await startCooking(item.id);
        setIsCooking(true);
        
        // 상태 다시 조회해서 totalSteps 설정
        const status = await getCookingStatus(item.id);
        if (status) {
          setTotalSteps(status.progress.totalSteps);
        }
        
        toast.success('요리를 시작합니다!');
        
        // 상세 페이지로 이동
        router.push(`/recipe/${item.id}`);
      } else {
        // "요리중" 클릭 → API 호출로 종료
        await endCookingByRecipe(item.id);
        setIsCooking(false);
        setCheckedSteps([]);
        toast.success('요리를 종료했습니다');
      }
    } catch (error: any) {
      console.error('요리 상태 변경 실패:', error);
      toast.error(error.message || '요리 상태 변경에 실패했습니다');
    } finally {
      isCookingLoadingRef.current = false;
    }
  };

  // ⭐ 수정: 단계 체크 - API 호출로 변경
  const handleStepCheck = async (stepIndex: number) => {
    if (!currentUser) return;

    let newChecked: number[];
    if (checkedSteps.includes(stepIndex)) {
      newChecked = checkedSteps.filter((i) => i < stepIndex);
    } else {
      const stepsToCheck = Array.from({ length: stepIndex + 1 }, (_, i) => i);
      newChecked = [...new Set([...checkedSteps, ...stepsToCheck])].sort((a, b) => a - b);
    }

    // Optimistic update
    setCheckedSteps(newChecked);

    try {
      // 가장 높은 체크된 스텝 수를 진행 상황으로 전송
      const progressStep = newChecked.length;
      await updateProgress(item.id, progressStep);
    } catch (error) {
      console.error('진행 상황 업데이트 실패:', error);
      // Revert on error
      setCheckedSteps(checkedSteps);
      toast.error('진행 상황 저장에 실패했습니다');
    }
  };

  // 카드 클릭
  const handleCardClick = () => {
    if (!disableClick) {
      router.push(`/recipe/${item.id}`);
    }
  };

  // ⭐ 현재 클립 - effectiveClips 사용
  const currentClip = currentSlide > 0 ? effectiveClips[currentSlide - 1] : null;

  return (
    <article
      className={`bg-card rounded-xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[box-shadow] duration-300 mb-4 ${
        !disableClick ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push(`/user/${item.authorUsername}`)}
        >
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            <AvatarImage src={item.authorAvatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {(item.authorUsername || item.authorFullName || '?')[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{item.authorUsername || item.authorFullName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ValueScoreBadge score={item.costEfficiencyScore ?? item.scoreCost} />
          {isCooking && (
            <span className="text-xs font-semibold text-mocha bg-mocha/10 px-3 py-1 rounded-full">
              {checkedSteps.length}/{totalSteps || effectiveClips.length || item.totalClipCount || 0} 단계
            </span>
          )}
          {!isFollowing && !isOwnPost && (
            <Button
              variant="mocha"
              size="sm"
              className="h-8 px-4 font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                handleFollow();
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
              <DropdownMenuItem 
                className="gap-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveToggle();
                }}
              >
                <Bookmark className="h-3 w-3" />
                <span>{isSaved ? '저장 취소' : '저장'}</span>
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

      {/* Media Carousel */}
      <div className="relative bg-muted aspect-video overflow-hidden">
        {/* 첫 슬라이드 (썸네일) */}
        {currentSlide === 0 ? (
          item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} className="w-full h-full object-cover" alt="썸네일" />
          ) : item.videoUrl ? (
            <video
              src={item.videoUrl}
              className="w-full h-full object-cover"
              loop
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ChefHat className="h-16 w-16 text-muted-foreground" />
            </div>
          )
        ) : (
          /* 클립 슬라이드 */
          item.videoUrl && (
            <video
              key={currentSlide}
              src={item.videoUrl}
              className="w-full h-full object-cover"
              loop
              autoPlay
              muted
              playsInline
              onLoadedMetadata={(e) => {
                // ⭐ clips 배열 또는 firstClip 정보 사용
                const startSec = currentClip?.startSec ?? (currentSlide === 1 ? item.firstClipStartSec : undefined);
                if (startSec !== undefined && startSec !== null) {
                  e.currentTarget.currentTime = startSec;
                }
              }}
              onTimeUpdate={(e) => {
                // ⭐ clips 배열 또는 firstClip 정보 사용
                const startSec = currentClip?.startSec ?? (currentSlide === 1 ? item.firstClipStartSec : 0);
                const endSec = currentClip?.endSec ?? (currentSlide === 1 ? item.firstClipEndSec : undefined);
                if (endSec !== undefined && endSec !== null && e.currentTarget.currentTime >= endSec) {
                  e.currentTarget.currentTime = startSec || 0;
                }
              }}
            />
          )
        )}

        {/* 상세 페이지: 클립 자막 */}
        {isDetailPage && currentSlide > 0 && (currentClip || (currentSlide === 1 && item.firstClipCaption)) && (
          <div className="absolute bottom-4 left-4 right-4">
            {isCooking ? (
              <div
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  checkedSteps.includes(currentSlide - 1)
                    ? 'bg-mocha/10 border border-mocha'
                    : 'bg-muted/30'
                }`}
              >
                <Checkbox
                  checked={checkedSteps.includes(currentSlide - 1)}
                  onCheckedChange={() => handleStepCheck(currentSlide - 1)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  className={`flex-1 cursor-pointer ${
                    checkedSteps.includes(currentSlide - 1) ? 'line-through text-muted-foreground' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepCheck(currentSlide - 1);
                  }}
                >
                  <span className="font-semibold">{currentSlide}단계.</span> {currentClip?.caption || item.firstClipCaption}
                </label>
                {checkedSteps.includes(currentSlide - 1) && (
                  <Check className="h-5 w-5 text-mocha flex-shrink-0 mt-1" />
                )}
              </div>
            ) : (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p>
                  <span className="font-semibold">{currentSlide}단계.</span> {currentClip?.caption || item.firstClipCaption}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 클립 번호 표시 */}
        {isDetailPage && showClipNumber && totalSlides > 1 && currentSlide > 0 && (
          <div className="absolute top-4 right-4">
            <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-white font-semibold text-xs">
              {currentSlide}/{totalSlides - 1}
            </div>
          </div>
        )}

        {/* 캐러셀 인디케이터 & 화살표 */}
        {totalSlides > 1 && (
          <>
            {!isDetailPage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                    aria-label={idx === 0 ? '섬네일' : `클립 ${idx}`}
                  />
                ))}
              </div>
            )}
            {currentSlide > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(currentSlide - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-transparent hover:bg-black/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="이전 클립"
              >
                ‹
              </button>
            )}
            {currentSlide < totalSlides - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(currentSlide + 1);
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
              className="flex items-center gap-1" 
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? 'fill-mocha text-mocha' : 'hover:text-muted-foreground'
                }`}
              />
              {!item.hideLikeCount && likeCount > 0 && (
                <span className="text-sm">{likeCount.toLocaleString()}</span>
              )}
            </button>
            <button
              className="flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
              disabled={item.disableComments}
            >
              <MessageCircle className="h-5 w-5 transition-colors hover:text-muted-foreground" />
              {commentCount > 0 && <span className="text-sm">{commentCount.toLocaleString()}</span>}
            </button>
            <button 
              className="h-8 w-8 flex items-center justify-center" 
              onClick={(e) => {
                e.stopPropagation();
                setShowShare(true);
              }}
            >
              <Share2 className="h-5 w-5 transition-colors hover:text-muted-foreground" />
            </button>
          </div>
          <button 
            className="h-8 w-8 flex items-center justify-center" 
            onClick={(e) => {
              e.stopPropagation();
              handleSaveToggle();
            }}
          >
            <Bookmark
              className={`h-5 w-5 transition-colors ${
                isSaved ? 'fill-mocha text-mocha' : 'hover:text-muted-foreground'
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="text-sm space-y-1">
          <p>
            <span className="font-semibold mr-2">{item.authorUsername || item.authorFullName}</span>
            {isDetailPage
              ? item.caption
              : currentSlide === 0
              ? item.caption
              : currentClip?.caption || (currentSlide === 1 ? item.firstClipCaption : null) || item.caption}
          </p>
          {!item.disableComments && commentCount > 0 && (
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(true);
              }}
            >
              댓글 {commentCount}개 모두 보기
            </button>
          )}
        </div>

        {/* 요리 시작하기 버튼 */}
        <Button 
          variant="mocha" 
          className="w-full mt-4 font-semibold" 
          onClick={handleCookingToggle}
        >
          <ChefHat className="h-5 w-5" />
          {isCooking ? '요리중' : '요리 시작하기'}
        </Button>
      </div>

      {/* 댓글 시트 */}
      <CommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        recipeId={item.id}
        commentsCount={commentCount}
        onCommentsCountChange={setCommentCount}
      />

      {/* 공유 다이얼로그 */}
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={item.title}
        url={typeof window !== 'undefined' ? `${window.location.origin}/recipe/${item.id}` : undefined}
      />
    </article>
  );
}

export default RecipeCard;
