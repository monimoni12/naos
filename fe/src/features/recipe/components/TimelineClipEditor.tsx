"use client";

/**
 * TimelineClipEditor - 타임라인 기반 클립 수정 에디터
 * 위치: src/features/recipe/components/TimelineClipEditor.tsx
 *
 * ClippingStep.tsx 기반으로 상세 페이지용으로 수정
 * - 기존 클립을 타임라인에서 수정
 * - 수정된 클립은 localStorage에 유저별 저장 (customClips)
 * - "요리중" 상태에서만 사용 가능
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  RotateCcw,
  Play,
  Pause,
  Scissors,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ClipData {
  id: string;
  startTime: number;
  endTime: number;
  caption?: string;
}

interface TimelineClipEditorProps {
  videoUrl: string;
  recipeId: number;
  initialClips: ClipData[];
  videoDuration?: number;
  onSave: (clips: ClipData[]) => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

type DragTarget = {
  clipId: string;
  edge: "start" | "end";
} | null;

export default function TimelineClipEditor({
  videoUrl,
  recipeId,
  initialClips,
  videoDuration: propDuration,
  onSave,
  onClose,
}: TimelineClipEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(propDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clips, setClips] = useState<ClipData[]>([]);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Initialize clips from initialClips
  useEffect(() => {
    if (initialClips.length > 0) {
      // 기존 클립이 있으면 사용
      setClips(
        initialClips.map((c, i) => ({
          id: c.id || `clip-${i}`,
          startTime: c.startTime,
          endTime: c.endTime,
          caption: c.caption,
        }))
      );
    } else if (duration > 0) {
      // 클립이 없으면 전체 길이로 하나 생성
      setClips([
        {
          id: `clip-${Date.now()}`,
          startTime: 0,
          endTime: duration,
          caption: "",
        },
      ]);
    }
  }, [initialClips, duration]);

  // Video event listeners
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handleTimeUpdate = () => {
      if (!isDraggingPlayhead) setCurrentTime(video.currentTime);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [isDraggingPlayhead]);

  // Handle dragging (playhead and clip edges)
  useEffect(() => {
    if (!isDraggingPlayhead && !dragTarget) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current || duration === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      let percent = (e.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      const newTime = percent * duration;

      if (isDraggingPlayhead) {
        setCurrentTime(newTime);
        if (videoRef.current) videoRef.current.currentTime = newTime;
      } else if (dragTarget) {
        const minClipDuration = duration * 0.02;

        setClips((prev) => {
          const clipIndex = prev.findIndex((c) => c.id === dragTarget.clipId);
          if (clipIndex === -1) return prev;

          const newClips = [...prev];
          const clip = { ...newClips[clipIndex] };

          if (dragTarget.edge === "start") {
            const prevClip = newClips[clipIndex - 1];
            const minStart = prevClip ? prevClip.endTime : 0;
            const maxStart = clip.endTime - minClipDuration;
            clip.startTime = Math.max(minStart, Math.min(maxStart, newTime));

            if (prevClip) {
              newClips[clipIndex - 1] = {
                ...prevClip,
                endTime: clip.startTime,
              };
            }
          } else {
            const nextClip = newClips[clipIndex + 1];
            const maxEnd = nextClip ? nextClip.startTime : duration;
            const minEnd = clip.startTime + minClipDuration;
            clip.endTime = Math.min(maxEnd, Math.max(minEnd, newTime));

            if (nextClip) {
              newClips[clipIndex + 1] = {
                ...nextClip,
                startTime: clip.endTime,
              };
            }
          }

          newClips[clipIndex] = clip;
          return newClips;
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setDragTarget(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPlayhead, dragTarget, duration]);

  // Split clip at current playhead position
  const splitAtPlayhead = () => {
    if (duration === 0) return;

    const clipAtTime = clips.find(
      (c) => currentTime > c.startTime && currentTime < c.endTime
    );

    if (!clipAtTime) {
      toast.error("분할할 위치가 클립 내부에 있어야 합니다.");
      return;
    }

    const minClipDuration = duration * 0.02;
    if (
      currentTime - clipAtTime.startTime < minClipDuration ||
      clipAtTime.endTime - currentTime < minClipDuration
    ) {
      toast.error("클립이 너무 짧습니다.");
      return;
    }

    const newClips = clips.flatMap((c) => {
      if (c.id === clipAtTime.id) {
        return [
          { ...c, endTime: currentTime },
          {
            id: `clip-${Date.now()}`,
            startTime: currentTime,
            endTime: c.endTime,
            caption: "",
          },
        ];
      }
      return [c];
    });

    setClips(newClips);
    toast.success("클립이 분할되었습니다.");
  };

  // Delete clip and merge with adjacent
  const deleteClip = (clipId: string) => {
    if (clips.length <= 1) return;

    const clipIndex = clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) return;

    const clip = clips[clipIndex];
    const newClips = [...clips];

    if (clipIndex === 0) {
      // First clip: extend next clip's start
      newClips[1] = { ...newClips[1], startTime: clip.startTime };
    } else {
      // Other clips: extend previous clip's end
      newClips[clipIndex - 1] = {
        ...newClips[clipIndex - 1],
        endTime: clip.endTime,
      };
    }

    newClips.splice(clipIndex, 1);
    setClips(newClips);
    setSelectedClipId(null);
  };

  // Reset to initial clips
  const resetClips = () => {
    if (initialClips.length > 0) {
      setClips(
        initialClips.map((c, i) => ({
          id: c.id || `clip-${i}`,
          startTime: c.startTime,
          endTime: c.endTime,
          caption: c.caption,
        }))
      );
    } else if (duration > 0) {
      setClips([
        {
          id: `clip-${Date.now()}`,
          startTime: 0,
          endTime: duration,
          caption: "",
        },
      ]);
    }
    toast.success("클립이 초기화되었습니다.");
  };

  // Save clips
  const handleSave = () => {
    // localStorage에 커스텀 클립 저장
    const customClips = JSON.parse(
      localStorage.getItem("customClips") || "{}"
    );
    customClips[recipeId] = clips.map((c, i) => ({
      id: c.id,
      indexOrd: i,
      startSec: c.startTime,
      endSec: c.endTime,
      caption: c.caption || "",
    }));
    localStorage.setItem("customClips", JSON.stringify(customClips));

    toast.success(`${clips.length}개 클립이 저장되었습니다.`);
    onSave(clips);
    onClose();
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // Timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-clip]") || target.closest("[data-playhead]"))
      return;

    const rect = timelineRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, percent * duration));

    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          영상 클리핑
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {clips.length}개 클립
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={splitAtPlayhead}
            title="현재 위치에서 분할"
          >
            <Scissors className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            title={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm font-mono min-w-[100px] text-center">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            타임라인에서 분할 지점을 설정하세요
          </p>
          <div
            ref={timelineRef}
            className="relative h-16 bg-muted rounded-lg overflow-hidden cursor-pointer select-none"
            onClick={handleTimelineClick}
          >
            {/* Time markers */}
            <div className="absolute top-0 left-0 right-0 flex justify-between text-[10px] text-muted-foreground px-1 pointer-events-none">
              <span>0:00</span>
              <span>{formatTime(duration / 2)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Clips */}
            {clips.map((clip, index) => {
              const startPercent = (clip.startTime / duration) * 100;
              const widthPercent =
                ((clip.endTime - clip.startTime) / duration) * 100;
              const isSelected = selectedClipId === clip.id;
              const isFirst = index === 0;
              const isLast = index === clips.length - 1;

              return (
                <div
                  key={clip.id}
                  data-clip
                  className={`absolute inset-y-0 group/clip transition-colors ${
                    isSelected
                      ? "bg-[#FF6B35]/20 ring-2 ring-[#FF6B35] ring-inset"
                      : "bg-muted-foreground/5 hover:bg-muted-foreground/10"
                  }`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    top: "16px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(isSelected ? null : clip.id);
                  }}
                >
                  <span className="absolute top-1 left-2 text-xs font-medium text-muted-foreground/70 pointer-events-none">
                    클립 {index + 1}
                  </span>
                  <span className="absolute bottom-1 left-2 text-[10px] font-mono text-muted-foreground/50 pointer-events-none">
                    {formatTime(clip.endTime - clip.startTime)}
                  </span>

                  {clips.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteClip(clip.id);
                      }}
                      className={`absolute right-1 top-1 w-5 h-5 bg-muted-foreground/60 text-background rounded flex items-center justify-center transition-opacity hover:bg-muted-foreground z-20 ${
                        isSelected
                          ? "opacity-100"
                          : "opacity-0 group-hover/clip:opacity-100"
                      }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}

                  {/* Left edge handle */}
                  {!isFirst && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B35]/50 cursor-ew-resize hover:bg-[#FF6B35] transition-colors"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragTarget({ clipId: clip.id, edge: "start" });
                      }}
                    />
                  )}

                  {/* Right edge handle */}
                  {!isLast && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 bg-[#FF6B35]/50 cursor-ew-resize hover:bg-[#FF6B35] transition-colors"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragTarget({ clipId: clip.id, edge: "end" });
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Playhead */}
            <div
              data-playhead
              className="absolute top-4 bottom-0 z-30 cursor-ew-resize"
              style={{
                left: `${playheadPercent}%`,
                transform: "translateX(-50%)",
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingPlayhead(true);
              }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-foreground shadow-md" />
              <div className="w-px h-full bg-foreground/80" />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetClips}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#FF6B35] hover:bg-[#e55a2b]"
          >
            <Check className="h-4 w-4 mr-1" />
            클립 확정
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
