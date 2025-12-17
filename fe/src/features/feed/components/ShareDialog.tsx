'use client';

import { MessageCircle, Share2, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  title?: string;
}

export function ShareDialog({ open, onOpenChange, url, title }: ShareDialogProps) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const shareOptions = [
    {
      name: '카카오톡',
      icon: MessageCircle,
      color: 'bg-[#FEE500] text-black',
      onClick: () => {
        // TODO: 카카오 SDK 연동
        toast.info('카카오톡 공유 준비 중');
        onOpenChange(false);
      },
    },
    {
      name: 'Discord',
      icon: MessageCircle,
      color: 'bg-[#5865F2] text-white',
      onClick: () => {
        // TODO: Discord 공유
        toast.info('Discord 공유 준비 중');
        onOpenChange(false);
      },
    },
    {
      name: 'Twitter',
      icon: Share2,
      color: 'bg-black text-white dark:bg-white dark:text-black',
      onClick: () => {
        const text = title ? `${title} - NAOS` : 'NAOS 레시피';
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        onOpenChange(false);
      },
    },
    {
      name: '링크 복사',
      icon: LinkIcon,
      color: 'bg-muted text-foreground',
      onClick: () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('링크가 복사되었습니다');
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
              className={`h-20 flex-col gap-2 ${option.color}`}
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

export default ShareDialog;
