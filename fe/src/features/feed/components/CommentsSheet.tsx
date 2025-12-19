'use client';

/**
 * CommentsSheet - 댓글 시트
 * 
 * ⭐ 수정사항:
 * 1. replies?.length 옵셔널 체이닝 (null 에러 해결)
 * 2. 모든 버튼에 e.stopPropagation() 추가 (이벤트 버블링 방지)
 * 3. 삭제 기능 추가 (드롭다운 메뉴 + AlertDialog)
 * 4. 기존 FE 필드명 유지 (authorAvatarUrl, likesCount, isLiked)
 */

import { useState, useEffect } from 'react';
import { ArrowUp, Heart, Trash2, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; isReply: boolean; parentId?: number } | null>(null);

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
      
      // ⭐ 실제 댓글 수로 동기화 (대댓글 포함)
      const totalCount = data.reduce((acc, comment) => {
        return acc + 1 + (comment.replies?.length || 0);
      }, 0);
      onCommentsCountChange?.(totalCount);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('댓글을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

      let newComments: Comment[];
      
      if (replyingTo) {
        // 대댓글인 경우 부모에 추가
        newComments = comments.map((c) =>
          c.id === replyingTo.id
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        );
      } else {
        // 새 댓글
        newComments = [comment, ...comments];
      }
      
      setComments(newComments);

      // ⭐ 실제 댓글 수로 업데이트 (대댓글 포함)
      const totalCount = newComments.reduce((acc, c) => {
        return acc + 1 + (c.replies?.length || 0);
      }, 0);
      onCommentsCountChange?.(totalCount);

      setNewComment('');
      setReplyingTo(null);
      toast.success(replyingTo ? '답글이 작성되었습니다' : '댓글이 작성되었습니다');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('댓글 작성에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (e: React.MouseEvent, commentId: number, authorName: string) => {
    e.stopPropagation();
    e.preventDefault();
    setReplyingTo({ id: commentId, name: authorName });
    setNewComment(`@${authorName} `);
  };

  const cancelReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReplyingTo(null);
    setNewComment('');
  };

  const handleDeleteComment = async () => {
    if (!deleteTarget) return;

    try {
      await feedApi.deleteComment(deleteTarget.id);

      let newComments: Comment[];
      
      if (deleteTarget.isReply && deleteTarget.parentId) {
        // 대댓글 삭제
        newComments = comments.map((c) =>
          c.id === deleteTarget.parentId
            ? { ...c, replies: (c.replies || []).filter((r) => r.id !== deleteTarget.id) }
            : c
        );
      } else {
        // 일반 댓글 삭제
        newComments = comments.filter((c) => c.id !== deleteTarget.id);
      }
      
      setComments(newComments);

      // ⭐ 실제 댓글 수로 업데이트 (대댓글 포함)
      const totalCount = newComments.reduce((acc, comment) => {
        return acc + 1 + (comment.replies?.length || 0);
      }, 0);
      onCommentsCountChange?.(totalCount);
      
      toast.success('댓글이 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('댓글 삭제에 실패했습니다');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLikeComment = async (e: React.MouseEvent, commentId: number, isCurrentlyLiked: boolean) => {
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error('로그인이 필요합니다');
      return;
    }

    // Optimistic update - FE 필드명 사용
    const updateCommentLike = (commentList: Comment[]): Comment[] => {
      return commentList.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: !isCurrentlyLiked,
            likesCount: isCurrentlyLiked ? c.likesCount - 1 : c.likesCount + 1,
          };
        }
        if (c.replies && c.replies.length > 0) {
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

  const renderComment = (comment: Comment, isReply = false, parentId?: number) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      <Avatar className={`flex-shrink-0 ${isReply ? 'h-6 w-6' : 'h-8 w-8'}`}>
        {/* FE 필드명: authorAvatarUrl */}
        <AvatarImage src={comment.authorAvatarUrl || undefined} />
        <AvatarFallback>{comment.authorUsername?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.authorUsername}</span>
              <span className="text-xs text-muted-foreground">
                {getTimeAgo(comment.createdAt)}
              </span>
              {/* 삭제 드롭다운 메뉴 - 본인 댓글만 */}
              {currentUser && currentUser.id === comment.authorId && (
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-full hover:bg-muted"
                  >
                    <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ 
                          id: comment.id, 
                          isReply, 
                          parentId 
                        });
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-sm break-all">{comment.content}</p>
            {!isReply && (
              <button
                onClick={(e) => handleReply(e, comment.id, comment.authorUsername)}
                className="text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                답글 달기
              </button>
            )}
          </div>
          <button
            onClick={(e) => handleLikeComment(e, comment.id, comment.isLiked)}
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
        {/* Replies - ⭐ null 체크 추가 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, true, comment.id))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[80vh] p-0"
          onClick={(e) => e.stopPropagation()}
          onPointerDownOutside={(e) => e.stopPropagation()}
        >
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
                    <AvatarFallback>{currentUser.username?.[0] || '?'}</AvatarFallback>
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

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CommentsSheet;
