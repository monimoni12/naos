'use client';

/**
 * 비디오 클리핑 단계
 * 위치: src/features/upload/components/ClippingStep.tsx
 *
 * 기능:
 * - 타임라인 기반 클립 분할
 * - 클립 경계 드래그로 조절
 * - 클립 삭제 (인접 클립과 병합)
 * - 클립별 텍스트 입력
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Check,
  RotateCcw,
  Play,
  Pause,
  Scissors,
  X,
} from 'lucide-react';

import type { VideoClip, TranscriptionSegment } from '../types/upload.types';

interface ClippingStepProps {
  file: File | null;
  previewUrl: string;
  transcriptionSegments?: TranscriptionSegment[];
  hasAudio: boolean;
  onBack: () => void;
  onNext: (clips: VideoClip[]) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTranscriptionForRange(
  segments: TranscriptionSegment[],
  startTime: number,
  endTime: number
): string {
  const overlappingSegments = segments.filter(
    (seg) => seg.start < endTime && seg.end > startTime
  );
  return overlappingSegments
    .map((seg) => seg.text)
    .join(' ')
    .trim();
}

type DragTarget = {
  clipId: string;
  edge: 'start' | 'end';
} | null;

export default function ClippingStep({
  file,
  previewUrl,
  transcriptionSegments = [],
  hasAudio,
  onBack,
  onNext,
}: ClippingStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [confirmedClips, setConfirmedClips] = useState<VideoClip[] | null>(
    null
  );
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  const isVideo = file?.type.startsWith('video');

  // Initialize with a single clip covering entire duration
  useEffect(() => {
    if (duration > 0 && clips.length === 0) {
      setClips([
        {
          id: `clip-${Date.now()}`,
          startTime: 0,
          endTime: duration,
          text: '',
        },
      ]);
    }
  }, [duration, clips.length]);

  // Video event listeners
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const video = videoRef.current;

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => {
      if (!isDraggingPlayhead) setCurrentTime(video.currentTime);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isVideo, isDraggingPlayhead]);

  // Stop playback when reaching end of active clip
  useEffect(() => {
    if (!activeClipId || !confirmedClips || !videoRef.current) return;

    const activeClip = confirmedClips.find((c) => c.id === activeClipId);
    if (!activeClip) return;

    if (isPlaying && currentTime >= activeClip.endTime) {
      videoRef.current.pause();
      setIsPlaying(false);
      setActiveClipId(null);
    }
  }, [activeClipId, confirmedClips, currentTime, isPlaying]);

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

          if (dragTarget.edge === 'start') {
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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, dragTarget, duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId && clips.length > 1) {
          e.preventDefault();
          deleteClip(selectedClipId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedClipId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, clips.length]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const splitAtCurrentTime = () => {
    if (duration === 0 || clips.length === 0) return;

    const clipIndex = clips.findIndex(
      (c) => currentTime >= c.startTime && currentTime < c.endTime
    );
    if (clipIndex === -1) return;

    const clip = clips[clipIndex];
    const minClipDuration = duration * 0.02;

    if (
      currentTime - clip.startTime < minClipDuration ||
      clip.endTime - currentTime < minClipDuration
    ) {
      return;
    }

    const newClip1: VideoClip = {
      id: `clip-${Date.now()}-1`,
      startTime: clip.startTime,
      endTime: currentTime,
      text: '',
    };
    const newClip2: VideoClip = {
      id: `clip-${Date.now()}-2`,
      startTime: currentTime,
      endTime: clip.endTime,
      text: '',
    };

    setClips((prev) => {
      const newClips = [...prev];
      newClips.splice(clipIndex, 1, newClip1, newClip2);
      return newClips;
    });
  };

  const deleteClip = (clipId: string) => {
    if (clips.length <= 1) return;

    const clipIndex = clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) return;

    setClips((prev) => {
      const newClips = [...prev];
      const deletedClip = newClips[clipIndex];

      if (clipIndex > 0) {
        newClips[clipIndex - 1] = {
          ...newClips[clipIndex - 1],
          endTime: deletedClip.endTime,
        };
      } else if (clipIndex < newClips.length - 1) {
        newClips[clipIndex + 1] = {
          ...newClips[clipIndex + 1],
          startTime: deletedClip.startTime,
        };
      }

      newClips.splice(clipIndex, 1);
      return newClips;
    });

    setSelectedClipId(null);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !timelineRef.current) return;
    if (
      (e.target as HTMLElement).closest('[data-clip]') ||
      (e.target as HTMLElement).closest('[data-playhead]')
    )
      return;

    setSelectedClipId(null);

    const rect = timelineRef.current.getBoundingClientRect();
    const clickPercent = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, clickPercent * duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const confirmClips = () => {
    const clipsWithText = clips.map((clip) => ({
      ...clip,
      text:
        hasAudio && transcriptionSegments.length > 0
          ? getTranscriptionForRange(
              transcriptionSegments,
              clip.startTime,
              clip.endTime
            )
          : '',
    }));
    setConfirmedClips(clipsWithText);
  };

  const updateClipText = (clipId: string, text: string) => {
    if (!confirmedClips) return;
    setConfirmedClips(
      confirmedClips.map((clip) =>
        clip.id === clipId ? { ...clip, text } : clip
      )
    );
  };

  const resetToEdit = () => setConfirmedClips(null);

  const handleNext = () => {
    if (confirmedClips) onNext(confirmedClips);
  };

  const handleSeekToClip = (clipId: string, startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      setActiveClipId(clipId);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeekWithinClip = (
    clipId: string,
    clip: VideoClip,
    percent: number
  ) => {
    if (videoRef.current) {
      const clipDuration = clip.endTime - clip.startTime;
      const targetTime = clip.startTime + clipDuration * percent;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setActiveClipId(clipId);
    }
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">영상 클리핑</h1>
            <p className="text-sm text-muted-foreground">
              타임라인에서 분할 지점을 설정하세요
            </p>
          </div>
          {!confirmedClips && (
            <div className="text-sm text-muted-foreground">
              {clips.length}개 클립
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Video Player */}
          {isVideo && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={previewUrl}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Timeline Editor */}
          {!confirmedClips && isVideo && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={splitAtCurrentTime}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="여기서 자르기"
                >
                  <Scissors className="h-5 w-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors shadow-md"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </button>
                <span className="text-sm font-mono text-foreground min-w-[90px] text-center">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="flex justify-between mb-1 text-[10px] text-muted-foreground/60 font-mono">
                  <span>0:00</span>
                  <span>{formatTime(duration / 2)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div
                  ref={timelineRef}
                  className="relative h-14 bg-muted rounded cursor-pointer overflow-visible"
                  onClick={handleTimelineClick}
                >
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
                            ? 'bg-primary/20 ring-2 ring-primary ring-inset'
                            : 'bg-muted-foreground/5 hover:bg-muted-foreground/10'
                        }`}
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`,
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
                                ? 'opacity-100'
                                : 'opacity-0 group-hover/clip:opacity-100'
                            }`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}

                        {!isFirst && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 cursor-ew-resize hover:bg-primary transition-colors"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDragTarget({ clipId: clip.id, edge: 'start' });
                            }}
                          />
                        )}

                        {!isLast && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-1 bg-primary/50 cursor-ew-resize hover:bg-primary transition-colors"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDragTarget({ clipId: clip.id, edge: 'end' });
                            }}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Playhead */}
                  <div
                    data-playhead
                    className="absolute -top-2 -bottom-2 z-30 cursor-ew-resize"
                    style={{
                      left: `${playheadPercent}%`,
                      transform: 'translateX(-50%)',
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

              {/* Confirm button */}
              <div className="flex justify-end pt-2">
                <Button onClick={confirmClips} size="sm">
                  <Check className="h-4 w-4 mr-1.5" />
                  클립 확정
                </Button>
              </div>
            </div>
          )}

          {/* Confirmed clips list */}
          {confirmedClips && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    클립별 텍스트 ({confirmedClips.length}개)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {hasAudio && transcriptionSegments.length > 0
                      ? '전사된 내용이 자동으로 입력되었습니다. 각 슬라이드 하단에 표시됩니다.'
                      : '각 슬라이드 하단에 표시될 텍스트를 입력하세요.'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetToEdit}>
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  다시 설정
                </Button>
              </div>

              <div className="grid gap-3">
                {confirmedClips.map((clip, index) => {
                  const isClipPlaying =
                    isPlaying &&
                    activeClipId === clip.id &&
                    currentTime >= clip.startTime &&
                    currentTime < clip.endTime;
                  const clipDuration = clip.endTime - clip.startTime;
                  const clipProgress =
                    activeClipId === clip.id &&
                    currentTime >= clip.startTime &&
                    currentTime <= clip.endTime
                      ? ((currentTime - clip.startTime) / clipDuration) * 100
                      : 0;

                  return (
                    <div
                      key={clip.id}
                      className="p-3 rounded-lg border bg-muted/30 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted-foreground/30 flex items-center justify-center text-sm font-bold text-foreground/70">
                          {index + 1}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (isClipPlaying) {
                              videoRef.current?.pause();
                              setIsPlaying(false);
                            } else {
                              handleSeekToClip(clip.id, clip.startTime);
                            }
                          }}
                          title={isClipPlaying ? '일시정지' : '이 클립 재생'}
                        >
                          {isClipPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <span className="text-sm font-medium font-mono">
                            {formatTime(clip.startTime)} →{' '}
                            {formatTime(clip.endTime)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({Math.round(clipDuration)}초)
                          </span>
                        </div>
                      </div>

                      <div
                        className="h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          handleSeekWithinClip(
                            clip.id,
                            clip,
                            Math.max(0, Math.min(1, percent))
                          );
                        }}
                      >
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all duration-100"
                          style={{ width: `${clipProgress}%` }}
                        />
                      </div>

                      <Textarea
                        placeholder="이 슬라이드 하단에 표시될 텍스트를 입력하세요..."
                        value={clip.text}
                        onChange={(e) =>
                          updateClipText(clip.id, e.target.value)
                        }
                        className="min-h-[60px] text-sm resize-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex gap-3 justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            이전
          </Button>
          {confirmedClips && <Button onClick={handleNext}>다음</Button>}
        </div>
      </div>
    </div>
  );
}

export type { VideoClip };
