import { QrCode, Link as LinkIcon, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProfileShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export default function ProfileShareDialog({
  open,
  onOpenChange,
  username,
}: ProfileShareDialogProps) {
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">프로필 공유</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-6">
          {/* QR Code Placeholder */}
          <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
            <QrCode className="h-32 w-32 text-muted-foreground" />
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-lg">@{username}</p>
            <p className="text-sm text-muted-foreground mt-1">
              이 QR 코드를 스캔하여 회원님을 팔로우할 수 있습니다.
            </p>
          </div>

          <div className="w-full grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex-col h-20 gap-2"
              onClick={() => {
                toast({ description: "프로필 공유" });
                onOpenChange(false);
              }}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">프로필 공유</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col h-20 gap-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ description: "링크가 복사되었습니다" });
              }}
            >
              <LinkIcon className="h-5 w-5" />
              <span className="text-xs">링크 복사</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex-col h-20 gap-2"
              onClick={() => {
                toast({ description: "QR 코드 다운로드" });
              }}
            >
              <QrCode className="h-5 w-5" />
              <span className="text-xs">다운로드</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
