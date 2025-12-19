"use client";

/**
 * ValueScoreBadge - 가성비 점수 배지
 * 
 * ⭐ 수정사항: breakdown 필드명을 BE 응답에 맞게 수정
 */

import { useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ValueScoreBreakdown } from "../types/recipe.types";
import { getScoreLabel, getScoreColorClass } from "../types/recipe.types";

interface ValueScoreBadgeProps {
  score: number | null;
  breakdown?: ValueScoreBreakdown | null;
  analysis?: string;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ValueScoreBadge({
  score,
  breakdown,
  analysis,
  loading = false,
  size = "md",
}: ValueScoreBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  if (loading) {
    return (
      <div className={`flex items-center rounded-full bg-muted text-muted-foreground font-medium ${sizeClasses[size]}`}>
        <Loader2 className={`animate-spin ${iconSizes[size]}`} />
        <span>분석중</span>
      </div>
    );
  }

  if (score === null || score === undefined) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center rounded-full font-semibold cursor-help ${sizeClasses[size]} ${getScoreColorClass(score)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <TrendingUp className={iconSizes[size]} />
            <span>{score}점</span>
            <span className="opacity-80">({getScoreLabel(score)})</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold">가성비 분석</p>
            {breakdown && (
              <div className="grid grid-cols-2 gap-1">
                {/* ⭐ BE 필드명에 맞게 수정됨 */}
                <div>가격 효율: {breakdown.priceEfficiency}점</div>
                <div>시간 효율: {breakdown.timeEfficiency}점</div>
                <div>영양 균형: {breakdown.nutritionBalance}점</div>
                <div>재료 접근성: {breakdown.ingredientAccessibility}점</div>
              </div>
            )}
            {analysis && <p className="text-muted-foreground">{analysis}</p>}
            {!breakdown && !analysis && (
              <p className="text-muted-foreground">
                AI가 가격, 시간, 영양을 종합 분석한 점수입니다.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
