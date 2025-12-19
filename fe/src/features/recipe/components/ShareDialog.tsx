"use client";

/**
 * ShareDialog - 공유 다이얼로그
 * Lovable 코드 마이그레이션
 */

import { MessageCircle, Share2, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  url?: string;
}

export default function ShareDialog({ 
  open, 
  onOpenChange,
  title = "맛있는 레시피",
  url,
}: ShareDialogProps) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const shareOptions = [
    {
      name: "카카오톡",
      icon: MessageCircle,
      color: "bg-[#FEE500] text-black hover:bg-[#FEE500]/90",
      onClick: () => {
        // 카카오톡 공유 (Kakao SDK 필요)
        if (typeof window !== "undefined" && (window as any).Kakao?.Share) {
          (window as any).Kakao.Share.sendDefault({
            objectType: "feed",
            content: {
              title: title,
              description: "NAOS에서 건강한 레시피를 확인해보세요!",
              imageUrl: "", // 썸네일 URL
              link: {
                webUrl: shareUrl,
                mobileWebUrl: shareUrl,
              },
            },
          });
        } else {
          // 카카오 SDK 없으면 링크 복사로 대체
          navigator.clipboard.writeText(shareUrl);
          toast.success("링크가 복사되었습니다. 카카오톡에 붙여넣기 해주세요!");
        }
        onOpenChange(false);
      },
    },
    {
      name: "Twitter",
      icon: Share2,
      color: "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
      onClick: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, "_blank", "width=550,height=420");
        onOpenChange(false);
      },
    },
    {
      name: "Facebook",
      icon: Share2,
      color: "bg-[#1877F2] text-white hover:bg-[#1877F2]/90",
      onClick: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(fbUrl, "_blank", "width=550,height=420");
        onOpenChange(false);
      },
    },
    {
      name: "링크 복사",
      icon: LinkIcon,
      color: "bg-muted text-foreground hover:bg-muted/80",
      onClick: () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success("링크가 복사되었습니다");
        onOpenChange(false);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>공유하기</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {shareOptions.map((option) => (
            <Button
              key={option.name}
              variant="outline"
              className={`h-20 flex-col gap-2 border-0 ${option.color}`}
              onClick={option.onClick}
            >
              <option.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{option.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
