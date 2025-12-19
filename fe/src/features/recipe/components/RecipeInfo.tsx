"use client";

/**
 * RecipeInfo - 레시피 메타 정보 표시
 */

import { Clock, Flame, DollarSign, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ValueScoreBadge from "./ValueScoreBadge";
import type { RecipeDetail, ValueScoreBreakdown } from "../types/recipe.types";

interface RecipeInfoProps {
  recipe: RecipeDetail;
  breakdown?: ValueScoreBreakdown | null;
}

export default function RecipeInfo({ recipe, breakdown }: RecipeInfoProps) {
  const infoItems = [
    {
      icon: Clock,
      label: "조리시간",
      value: recipe.cookTimeMin ? `${recipe.cookTimeMin}분` : null,
    },
    {
      icon: Flame,
      label: "칼로리",
      value: recipe.kcalEstimate ? `${recipe.kcalEstimate}kcal` : null,
    },
    {
      icon: DollarSign,
      label: "예상가격",
      value: recipe.priceEstimate 
        ? `${recipe.priceEstimate.toLocaleString()}원` 
        : null,
    },
    {
      icon: Users,
      label: "인분",
      value: recipe.servings ? `${recipe.servings}인분` : null,
    },
  ].filter(item => item.value !== null);

  return (
    <Card>
      <CardContent className="p-4">
        {/* 가성비 점수 */}
        {recipe.scoreCost !== null && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">가성비 점수</span>
            <ValueScoreBadge 
              score={recipe.scoreCost} 
              breakdown={breakdown}
              size="lg"
            />
          </div>
        )}

        {/* 메타 정보 그리드 */}
        {infoItems.length > 0 && (
          <div className={`grid gap-4 ${
            infoItems.length === 4 
              ? "grid-cols-4" 
              : infoItems.length === 3 
              ? "grid-cols-3" 
              : "grid-cols-2"
          }`}>
            {infoItems.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-1">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* 카테고리 */}
        {recipe.category && (
          <div className="mt-4 pt-4 border-t">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
              {recipe.category}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
