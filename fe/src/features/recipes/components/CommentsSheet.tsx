import { useState } from "react";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  likes: number;
  timestamp: string;
}

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: Comment[];
  commentsCount: number;
}

export default function CommentsSheet({
  open,
  onOpenChange,
  comments: initialComments,
  commentsCount,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: "나",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      },
      text: newComment,
      likes: 0,
      timestamp: "방금",
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>댓글 {commentsCount}개</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-[calc(100%-5rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
            <Input
              placeholder="댓글 달기..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
