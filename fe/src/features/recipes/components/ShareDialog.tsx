import { MessageCircle, Share2, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const { toast } = useToast();

  const shareOptions = [
    {
      name: "카카오톡",
      icon: MessageCircle,
      color: "bg-[#FEE500] text-black",
      onClick: () => {
        toast({ description: "카카오톡으로 공유" });
        onOpenChange(false);
      },
    },
    {
      name: "Discord",
      icon: MessageCircle,
      color: "bg-[#5865F2] text-white",
      onClick: () => {
        toast({ description: "Discord로 공유" });
        onOpenChange(false);
      },
    },
    {
      name: "Twitter",
      icon: Share2,
      color: "bg-black text-white dark:bg-white dark:text-black",
      onClick: () => {
        toast({ description: "Twitter로 공유" });
        onOpenChange(false);
      },
    },
    {
      name: "링크 복사",
      icon: LinkIcon,
      color: "bg-muted text-foreground",
      onClick: () => {
        navigator.clipboard.writeText(window.location.href);
        toast({ description: "링크가 복사되었습니다" });
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
