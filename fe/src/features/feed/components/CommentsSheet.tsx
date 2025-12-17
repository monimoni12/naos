'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';
import { feedApi } from '../api/feedApi';
import type { Comment } from '../types';

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: number;
  commentsCount: number;
  onCommentsCountChange?: (newCount: number) => void;
}

export function CommentsSheet({
  open,
  onOpenChange,
  recipeId,
  commentsCount,
  onCommentsCountChange,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);

  const currentUser = getUser();

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, recipeId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await feedApi.getComments(recipeId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('댓글을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setSubmitting(true);
    try {
      const comment = await feedApi.createComment(
        recipeId,
        newComment.trim(),
        replyingTo?.id
      );

      if (replyingTo) {
        // 대댓글인 경우 부모에 추가
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo.id
              ? { ...c, replies: [...c.replies, comment] }
              : c
          )
        );
      } else {
        // 새 댓글
        setComments((prev) => [comment, ...prev]);
      }

      setNewComment('');
      setReplyingTo(null);
      onCommentsCountChange?.(commentsCount + 1);
      toast.success(replyingTo ? '답글이 작성되었습니다' : '댓글이 작성되었습니다');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('댓글 작성에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: number, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
    setNewComment(`@${authorName} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleLikeComment = async (commentId: number, isCurrentlyLiked: boolean) => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      return;
    }

    // Optimistic update
    const updateCommentLike = (commentList: Comment[]): Comment[] => {
      return commentList.map((c) => {
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

    setComments((prev) => updateCommentLike(prev));

    try {
      await feedApi.toggleCommentLike(commentId);
    } catch (error) {
      // Revert on error
      setComments((prev) => updateCommentLike(prev));
      toast.error('좋아요 처리에 실패했습니다');
    }
  };

  const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      <Avatar className={`flex-shrink-0 ${isReply ? 'h-6 w-6' : 'h-8 w-8'}`}>
        <AvatarImage src={comment.authorAvatarUrl || undefined} />
        <AvatarFallback>{comment.authorUsername[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.authorUsername}</span>
              <span className="text-xs text-muted-foreground">
                {getTimeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm break-all">{comment.content}</p>
            {!isReply && (
              <button
                onClick={() => handleReply(comment.id, comment.authorUsername)}
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
            <Heart
              className={`h-4 w-4 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`}
            />
            {comment.likesCount > 0 && (
              <span className="text-[10px]">{comment.likesCount}</span>
            )}
          </button>
        </div>
        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-center">댓글</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-5rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                댓글을 불러오는 중...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                첫 번째 댓글을 작성해보세요!
              </div>
            ) : (
              comments.map((comment) => renderComment(comment))
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
                  <AvatarImage src={currentUser.avatarUrl || undefined} />
                  <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 relative">
                <Input
                  placeholder={
                    replyingTo
                      ? `@${replyingTo.name}님에게 답글 달기...`
                      : '댓글 달기...'
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submitting}
                  className="pr-12 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input"
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-mocha text-mocha-foreground flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-105 active:shadow-[0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-[-48%] transition-all disabled:opacity-50"
                  >
                    <ArrowUp className="h-4 w-4" />
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

export default CommentsSheet;
