"use client";

/**
 * ClipPlayer - NAOS 핵심 기능!
 * 
 * 클립별 반복 재생:
 * - 현재 클립의 startSec에서 시작
 * - endSec에 도달하면 자동으로 startSec로 돌아감 (반복)
 * - 사용자가 "다음" 버튼 누르면 다음 클립으로 이동
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX,
  Repeat,
  SkipForward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ClipWithText } from "../types/recipe.types";
import { getClipDisplayText } from "../types/recipe.types";

interface ClipPlayerProps {
  videoUrl: string;
  clips: ClipWithText[];
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
}

export default function ClipPlayer({ 
  videoUrl, 
  clips, 
  onStepChange,
  onComplete 
}: ClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(true);
  const [clipProgress, setClipProgress] = useState(0);

  const currentClip = clips[currentClipIndex];
  const totalClips = clips.length;
  const isFirstClip = currentClipIndex === 0;
  const isLastClip = currentClipIndex === totalClips - 1;

  // 클립 시간 범위 체크 및 반복 처리
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    const currentTime = video.currentTime;
    const { startSec, endSec } = currentClip;

    // 클립 진행률 계산
    const clipDuration = endSec - startSec;
    const elapsed = currentTime - startSec;
    const progress = Math.min(Math.max((elapsed / clipDuration) * 100, 0), 100);
    setClipProgress(progress);

    // 클립 끝에 도달했을 때
    if (currentTime >= endSec) {
      if (isLoopEnabled) {
        // 반복 모드: 클립 처음으로
        video.currentTime = startSec;
      } else {
        // 반복 안 함: 다음 클립으로 (마지막이면 멈춤)
        if (!isLastClip) {
          goToNextClip();
        } else {
          video.pause();
          setIsPlaying(false);
          onComplete?.();
        }
      }
    }

    // 클립 시작점 이전으로 가면 시작점으로 이동
    if (currentTime < startSec) {
      video.currentTime = startSec;
    }
  }, [currentClip, isLoopEnabled, isLastClip, onComplete]);

  // 비디오 이벤트 리스너 등록
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("timeupdate", handleTimeUpdate);
    
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  // 클립 변경 시 해당 위치로 이동
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip) return;

    video.currentTime = currentClip.startSec;
    setClipProgress(0);
    onStepChange?.(currentClipIndex);

    // 재생 중이었다면 계속 재생
    if (isPlaying) {
      video.play().catch(() => {});
    }
  }, [currentClipIndex, currentClip, onStepChange]);

  // 재생/일시정지
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // 재생 시작 시 클립 시작점으로
      if (video.currentTime < currentClip.startSec || video.currentTime >= currentClip.endSec) {
        video.currentTime = currentClip.startSec;
      }
      video.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  // 음소거 토글
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 반복 모드 토글
  const toggleLoop = () => {
    setIsLoopEnabled(!isLoopEnabled);
  };

  // 이전 클립
  const goToPrevClip = () => {
    if (!isFirstClip) {
      setCurrentClipIndex(currentClipIndex - 1);
    }
  };

  // 다음 클립
  const goToNextClip = () => {
    if (!isLastClip) {
      setCurrentClipIndex(currentClipIndex + 1);
    } else {
      onComplete?.();
    }
  };

  // 특정 클립으로 이동
  const goToClip = (index: number) => {
    if (index >= 0 && index < totalClips) {
      setCurrentClipIndex(index);
    }
  };

  // 클립 시간 포맷
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!clips.length) {
    return (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <p className="text-white/60">클립이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 비디오 플레이어 */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* 플레이 오버레이 (일시정지 상태일 때) */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-8 h-8 text-black ml-1" />
            </div>
          </button>
        )}

        {/* 클립 정보 오버레이 */}
        <div className="absolute top-4 left-4 bg-black/60 rounded-full px-3 py-1 text-white text-sm">
          Step {currentClipIndex + 1} / {totalClips}
        </div>

        {/* 반복 표시 */}
        {isLoopEnabled && (
          <div className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1 text-white text-sm flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            반복
          </div>
        )}
      </div>

      {/* 클립 진행률 */}
      <div className="space-y-2">
        <Progress value={clipProgress} className="h-1" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentClip?.startSec || 0)}</span>
          <span>{formatTime(currentClip?.endSec || 0)}</span>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 재생/일시정지 */}
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          {/* 음소거 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          {/* 반복 토글 */}
          <Button
            variant={isLoopEnabled ? "secondary" : "ghost"}
            size="icon"
            onClick={toggleLoop}
            title={isLoopEnabled ? "반복 재생 끄기" : "반복 재생 켜기"}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* 이전/다음 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevClip}
            disabled={isFirstClip}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={goToNextClip}
          >
            {isLastClip ? "완료" : "다음"}
            {!isLastClip && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* 현재 클립 텍스트 */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
            {currentClipIndex + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed">
              {getClipDisplayText(currentClip) || "설명이 없습니다"}
            </p>
            {currentClip.durationSec && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(currentClip.durationSec)}초
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 클립 인디케이터 */}
      <div className="flex gap-1 justify-center">
        {clips.map((clip, index) => (
          <button
            key={clip.id}
            onClick={() => goToClip(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentClipIndex
                ? "w-6 bg-primary"
                : index < currentClipIndex
                ? "w-3 bg-primary/60"
                : "w-3 bg-muted-foreground/30"
            }`}
            title={`Step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
