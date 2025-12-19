"use client";

/**
 * RecipeDetailContainer - 레시피 상세 하단 컴포넌트
 * 
 * 기능:
 * - 클립 수정하기 → TimelineClipEditor (요리중일 때만)
 * - 가성비 정보 (RecipeInfo)
 * - AI 레시피 요약 (핵심만 보기)
 * - 조리 순서 + 음성 안내(TTS) + 체크박스 진행 추적
 * 
 * ⚠️ "요리 시작하기" 버튼은 RecipeCard에 있음 (중복 제거)
 * ⚠️ 커스텀 클립은 localStorage에 저장 (유저별, 요리중일 때만)
 */

import { useState, useEffect } from "react";
import {
  Loader2,
  Scissors,
  Sparkles,
  Volume2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  getRecipeDetail,
  getRecipeClips,
} from "../api/recipeApi";
import type { RecipeDetail, ClipWithText } from "../types/recipe.types";
import RecipeInfo from "./RecipeInfo";
import TimelineClipEditor from "./TimelineClipEditor";

interface RecipeDetailContainerProps {
  recipeId: number;
  initialRecipe?: RecipeDetail | null;
  initialClips?: ClipWithText[];
  currentStep?: number;
  isCooking?: boolean;  // ⭐ 요리중 상태 (클립 수정 가능 여부)
}

export default function RecipeDetailContainer({
  recipeId,
  initialRecipe,
  initialClips,
  currentStep = 0,
  isCooking = false,
}: RecipeDetailContainerProps) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(initialRecipe || null);
  const [clips, setClips] = useState<ClipWithText[]>(initialClips || []);
  const [displayClips, setDisplayClips] = useState<ClipWithText[]>([]); // ⭐ 실제 표시할 클립
  const [loading, setLoading] = useState(!initialRecipe);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [showClipEditor, setShowClipEditor] = useState(false);
  
  // AI Summary States
  const [summary, setSummary] = useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  // TTS States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (initialRecipe && initialClips) {
      setRecipe(initialRecipe);
      setClips(initialClips);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [recipeData, clipsData] = await Promise.all([
          getRecipeDetail(recipeId),
          getRecipeClips(recipeId),
        ]);

        setRecipe(recipeData);
        setClips(clipsData);
      } catch (err) {
        console.error("Error loading recipe:", err);
        setError("레시피를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [recipeId, initialRecipe, initialClips]);

  // ⭐ 요리 시작하기로 진입 시 부드러운 스크롤
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const justStarted = sessionStorage.getItem("justStartedCooking");
    if (justStarted === recipeId.toString()) {
      sessionStorage.removeItem("justStartedCooking");
      setTimeout(() => {
        window.scrollBy({ top: 150, behavior: 'smooth' });
      }, 100);
    }
  }, [recipeId]);

  // ⭐ 커스텀 클립 로드 (요리중일 때만)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isCooking) {
      // 요리중이면 커스텀 클립 확인
      const customClips = JSON.parse(localStorage.getItem("customClips") || "{}");
      if (customClips[recipeId] && customClips[recipeId].length > 0) {
        // 커스텀 클립이 있으면 사용
        const custom = customClips[recipeId].map((c: any) => ({
          id: c.id,
          indexOrd: c.indexOrd,
          startSec: c.startSec,
          endSec: c.endSec,
          caption: c.caption || "",
          transcriptText: c.caption || "",
        }));
        setDisplayClips(custom);
        return;
      }
    }
    // 요리중이 아니거나 커스텀 클립이 없으면 원본 사용
    setDisplayClips(clips);
  }, [recipeId, isCooking, clips]);

  // localStorage에서 진행 상황 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const progress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
    if (progress[recipeId]) {
      setCheckedSteps(progress[recipeId].completed || []);
    }
  }, [recipeId]);

  // 단계 체크 핸들러
  const handleStepCheck = (stepIndex: number) => {
    setCheckedSteps((prev) => {
      let newChecked: number[];
      
      if (prev.includes(stepIndex)) {
        // 체크 해제: 해당 단계와 그 이후 단계들을 모두 해제
        newChecked = prev.filter((i) => i < stepIndex);
      } else {
        // 체크: 해당 단계까지의 모든 이전 단계들도 체크
        const stepsToCheck = Array.from({ length: stepIndex + 1 }, (_, i) => i);
        newChecked = [...new Set([...prev, ...stepsToCheck])].sort((a, b) => a - b);
      }
      
      // localStorage에 저장
      const progress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      progress[recipeId] = {
        completed: newChecked,
        total: clips.length
      };
      localStorage.setItem("cookingProgress", JSON.stringify(progress));
      
      return newChecked;
    });
  };

  // AI 요약 핸들러
  const handleSummarize = async () => {
    if (clips.length === 0) return;
    
    setLoadingSummary(true);
    try {
      // 클립 캡션들을 기반으로 요약 생성
      const steps = clips.map(c => c.caption || c.transcriptText || "");
      
      // TODO: 실제 AI 요약 API 연동 (Flask /summarize-recipe)
      // 임시로 3단계로 요약
      const summarySteps = [
        "1단계. 재료를 준비합니다.",
        "2단계. 손질한 재료를 넣고 조리합니다.",
        "3단계. 간을 맞추고 완성합니다.",
      ];
      
      setSummary(summarySteps);
      toast.success("요약 완료! 핵심 단계만 추려냈습니다.");
    } catch (error) {
      console.error("Error summarizing recipe:", error);
      toast.error("요약 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // TTS 음성 안내
  const speakStep = (text: string, stepIndex: number) => {
    if ("speechSynthesis" in window) {
      // 기존 음성 중지
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 0.9;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingStep(stepIndex);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingStep(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("이 브라우저는 음성 안내를 지원하지 않습니다.");
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingStep(null);
    }
  };

  const handleTTSButton = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (displayClips.length > 0) {
      const step = displayClips[currentStep];
      const text = `${currentStep + 1}단계. ${step.caption || step.transcriptText || "설명 없음"}`;
      speakStep(text, currentStep);
    }
  };

  // ⭐ 클립 저장 핸들러 (TimelineClipEditor에서 호출)
  const handleClipsSave = (newClips: any[]) => {
    const updated = newClips.map((c, i) => ({
      id: c.id,
      indexOrd: i,
      startSec: c.startTime,
      endSec: c.endTime,
      caption: c.caption || "",
      transcriptText: c.caption || "",
    }));
    setDisplayClips(updated);
  };

  // 로딩
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 에러
  if (error || !recipe) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{error || "레시피를 찾을 수 없습니다"}</p>
      </div>
    );
  }

  const allStepsCompleted = checkedSteps.length === displayClips.length && displayClips.length > 0;

  return (
    <div className="space-y-6">
      {/* ⭐ 클립 수정 버튼 - 요리중일 때만 표시 */}
      {!showClipEditor && isCooking && displayClips.length > 0 && (
        <Button
          onClick={() => setShowClipEditor(true)}
          variant="outline"
          className="w-full"
        >
          <Scissors className="mr-2 h-4 w-4" />
          클립 수정하기
        </Button>
      )}

      {/* ⭐ Timeline Clip Editor */}
      {showClipEditor && recipe.videoUrl && (
        <TimelineClipEditor
          videoUrl={recipe.videoUrl}
          recipeId={recipeId}
          initialClips={displayClips.map(c => ({
            id: c.id.toString(),
            startTime: c.startSec,
            endTime: c.endSec,
            caption: c.caption || c.transcriptText || "",
          }))}
          videoDuration={recipe.videoDurationSec || undefined}
          onSave={handleClipsSave}
          onClose={() => setShowClipEditor(false)}
        />
      )}

      {/* Recipe Info (가성비 카드) */}
      <RecipeInfo recipe={recipe} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI 레시피 요약</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSummarize}
            disabled={loadingSummary || summary.length > 0}
          >
            {loadingSummary ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                요약 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                핵심만 보기
              </>
            )}
          </Button>
        </CardHeader>
        {summary.length > 0 && (
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {summary.map((step, i) => (
                <li key={i} className="leading-relaxed text-sm">
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        )}
      </Card>

      {/* Cooking Steps with Checkbox + TTS */}
      {displayClips.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>조리 순서</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTTSButton}
            >
              {isSpeaking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  중지
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  음성 안내 {currentStep + 1}/{displayClips.length}
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayClips.map((clip, i) => (
              <div
                key={clip.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  speakingStep === i
                    ? "bg-[#FF6B35]/10 border border-[#FF6B35]"
                    : i === currentStep
                    ? "bg-[#FF6B35]/5 border border-[#FF6B35]/30"
                    : "bg-muted/30"
                }`}
              >
                <Checkbox
                  id={`step-${i}`}
                  checked={checkedSteps.includes(i)}
                  onCheckedChange={() => handleStepCheck(i)}
                  className="mt-1"
                />
                <label
                  htmlFor={`step-${i}`}
                  className={`flex-1 cursor-pointer ${
                    checkedSteps.includes(i) ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  <span className="font-semibold">{i + 1}단계.</span>{" "}
                  {clip.caption || clip.transcriptText || "설명 없음"}
                </label>
                {checkedSteps.includes(i) && (
                  <Check className="h-5 w-5 text-[#FF6B35] flex-shrink-0 mt-1" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 완료 메시지 */}
      {allStepsCompleted && (
        <div className="text-center py-4">
          <p className="text-[#FF6B35] font-semibold">
            🎉 조리 완료! 맛있게 드세요!
          </p>
        </div>
      )}
    </div>
  );
}
