'use client';

import { TrendingUp, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ValueScoreBreakdown {
  priceScore: number;
  timeScore: number;
  nutritionScore: number;
  accessibilityScore: number;
}

interface ValueScoreBadgeProps {
  score: number | null;
  breakdown?: ValueScoreBreakdown;
  analysis?: string;
  loading?: boolean;
}

export function ValueScoreBadge({
  score,
  breakdown,
  analysis,
  loading = false,
}: ValueScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-yellow-500 text-white';
    return 'bg-muted text-muted-foreground';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '최고';
    if (score >= 60) return '좋음';
    return '보통';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>분석중</span>
      </div>
    );
  }

  if (score === null) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-help ${getScoreColor(score)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <TrendingUp className="h-3 w-3" />
            <span>{score}점</span>
            <span className="opacity-80">({getScoreLabel(score)})</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold">가성비 분석</p>
            {breakdown && (
              <div className="grid grid-cols-2 gap-1">
                <div>가격 효율: {breakdown.priceScore}/35</div>
                <div>시간 효율: {breakdown.timeScore}/25</div>
                <div>영양 균형: {breakdown.nutritionScore}/25</div>
                <div>재료 접근성: {breakdown.accessibilityScore}/15</div>
              </div>
            )}
            {analysis && <p className="text-muted-foreground">{analysis}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ValueScoreBadge;
