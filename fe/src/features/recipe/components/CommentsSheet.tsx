"use client";

/**
 * CommentsSheet - 댓글 시트
 * Lovable 코드 마이그레이션 (Spring Boot API 연동)
 */

import { useState, useEffect } from "react";
import { ArrowUp, Heart, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { authFetch, getUser } from "@/lib/auth";
import type { Comment } from "../types/recipe.types";

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: number;
  commentsCount: number;
  onCommentsCountChange?: (newCount: number) => void;
}

export default function CommentsSheet({
  open,
  onOpenChange,
  recipeId,
  commentsCount,
  onCommentsCountChange,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (open) {
      fetchComments();
      fetchCurrentUser();
    }
  }, [open, recipeId]);

  const fetchCurrentUser = () => {
    const user = getUser();
    if (user) {
      setCurrentUser({
        id: user.id?.toString() || "",
        username: user.username || user.email?.split("@")[0] || "사용자",
        avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      });
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/comments/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        // BE 응답 구조에 맞게 변환
        const formattedComments = formatComments(data);
        setComments(formattedComments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  // BE 응답을 프론트 Comment 타입으로 변환
  const formatComments = (data: any[]): Comment[] => {
    // TODO: BE 응답 구조에 맞게 구현
    // 현재는 간단히 변환
    return data.map(item => ({
      id: item.id?.toString() || "",
      author: {
        name: item.authorUsername || item.authorName || "익명",
        avatar: item.authorAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.authorId}`,
      },
      text: item.content || "",
      timestamp: getTimeAgo(new Date(item.createdAt)),
      parentId: item.parentId?.toString() || null,
      replies: item.replies ? formatComments(item.replies) : [],
      likesCount: item.likesCount || 0,
      isLiked: item.isLiked || false,
    }));
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    if (!currentUser) {
      toast.error("로그인이 필요합니다");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = replyingTo 
        ? `/api/comments/${replyingTo.id}/reply`
        : `/api/comments/${recipeId}`;

      const response = await authFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        throw new Error("댓글 작성 실패");
      }

      const savedComment = await response.json();

      // 로컬 상태 업데이트
      const comment: Comment = {
        id: savedComment.id?.toString() || Date.now().toString(),
        author: {
          name: currentUser.username,
          avatar: currentUser.avatar,
        },
        text: newComment.trim(),
        timestamp: "방금",
        parentId: replyingTo?.id || null,
        replies: [],
        likesCount: 0,
        isLiked: false,
      };

      if (replyingTo) {
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.id) {
            return { ...c, replies: [...c.replies, comment] };
          }
          return c;
        }));
      } else {
        setComments([comment, ...comments]);
      }

      setNewComment("");
      setReplyingTo(null);
      onCommentsCountChange?.(commentsCount + 1);
      toast.success(replyingTo ? "답글이 작성되었습니다" : "댓글이 작성되었습니다");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("댓글 작성에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
    setNewComment(`@${authorName} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const handleLikeComment = async (commentId: string, isCurrentlyLiked: boolean) => {
    if (!currentUser) {
      toast.error("로그인이 필요합니다");
      return;
    }

    // Optimistic update
    const updateCommentLike = (commentList: Comment[]): Comment[] => {
      return commentList.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !isCurrentlyLiked,
            likesCount: isCurrentlyLiked ? c.likesCount - 1 : c.likesCount + 1,
          };
        }
        if (c.replies.length > 0) {
          return { ...c, replies: updateCommentLike(c.replies) };
        }
        return c;
      });
    };

    setComments(prev => updateCommentLike(prev));

    try {
      await authFetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
    } catch (error) {
      // 실패 시 롤백
      setComments(prev => updateCommentLike(prev));
      toast.error("좋아요 처리에 실패했습니다");
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? "ml-10" : ""}`}>
      <Avatar className={`flex-shrink-0 ${isReply ? "h-6 w-6" : "h-8 w-8"}`}>
        <AvatarImage src={comment.author.avatar} />
        <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                {comment.author.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {comment.timestamp}
              </span>
            </div>
            <p className="text-sm break-all">{comment.text}</p>
            {!isReply && (
              <button
                onClick={() => handleReply(comment.id, comment.author.name)}
                className="text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                답글 달기
              </button>
            )}
          </div>
          <button
            onClick={() => handleLikeComment(comment.id, comment.isLiked)}
            className="flex flex-col items-center text-muted-foreground hover:text-foreground flex-shrink-0 self-center"
          >
            <Heart className={`h-4 w-4 ${comment.isLiked ? "fill-red-500 text-red-500" : ""}`} />
            {comment.likesCount > 0 && (
              <span className="text-[10px]">{comment.likesCount}</span>
            )}
          </button>
        </div>
        {/* 답글 렌더링 */}
        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-center">댓글 {commentsCount > 0 && `${commentsCount}`}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-5rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                첫 번째 댓글을 작성해보세요!
              </div>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </div>

          <div className="border-t">
            {replyingTo && (
              <div className="px-4 pt-2 flex items-center justify-between text-sm text-muted-foreground bg-muted/50">
                <span>@{replyingTo.name}님에게 답글 작성 중</span>
                <button onClick={cancelReply} className="text-base hover:text-foreground">
                  ×
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="p-4 flex items-center gap-3">
              {currentUser && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 relative">
                <Input
                  placeholder={replyingTo ? `@${replyingTo.name}님에게 답글 달기...` : "댓글 달기..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="pr-12 rounded-full"
                  disabled={submitting}
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
