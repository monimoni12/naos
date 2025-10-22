import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ThumbnailSelectorStepProps {
  file: File | null;
  previewUrl: string;
  onBack: () => void;
  onNext: (thumbnailTime: number, blob: Blob) => void;
}

export default function ThumbnailSelectorStep({
  file,
  previewUrl,
  onBack,
  onNext,
}: ThumbnailSelectorStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  useEffect(() => {
    if (file?.type.startsWith("video") && videoRef.current) {
      const video = videoRef.current;
      
      video.onloadedmetadata = () => {
        setDuration(video.duration);
        captureThumbnail(0);
      };
    }
  }, [file]);

  const captureThumbnail = (time: number) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 180;

    video.currentTime = time;
    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL();
      setThumbnailPreview(dataUrl);
    };
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      captureThumbnail(time);
      setCurrentTime(time);
    }
  };

  const handleSeek = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      captureThumbnail(time);
      setCurrentTime(time);
    }
  };

  const handleNext = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onNext(currentTime, blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">섬네일 선택</h1>
          <p className="text-muted-foreground mt-1">
            영상 중 섬네일로 사용할 장면을 선택하세요
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Video Preview */}
          <div>
            <Label className="text-base font-semibold mb-3 block">미리보기</Label>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {file?.type.startsWith("video") ? (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onPause={handlePause}
                  onSeeked={handleSeek}
                />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Instructions */}
          {file?.type.startsWith("video") && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground">
                영상을 재생하고 원하는 장면에서 일시정지하거나 시크바를 움직여 섬네일로 사용할 장면을 선택하세요.
              </p>
            </div>
          )}

          {/* Selected Thumbnail Preview */}
          {thumbnailPreview && file?.type.startsWith("video") && (
            <div className="flex flex-col items-center">
              <Label className="text-base font-semibold mb-3 block self-start">
                선택된 섬네일 ({formatTime(currentTime)})
              </Label>
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-[0_0_30px_rgba(139,111,78,0.6)] max-w-xs w-full">
                <img
                  src={thumbnailPreview}
                  alt="Selected thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-between">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            이전
          </Button>
          <Button variant="mocha" size="lg" className="px-8" onClick={handleNext}>
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
