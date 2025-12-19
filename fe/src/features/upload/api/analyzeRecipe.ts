/**
 * AI 분석 API 호출
 * 위치: src/features/upload/api/analyzeRecipe.ts
 * 
 * BE RecipeController의 /api/recipes/{id}/analyze 호출
 * 
 * 수정사항:
 * - BE 실제 응답 구조에 맞게 타입 수정
 * - breakdown 필드명 수정: priceEfficiency, timeEfficiency, nutritionBalance, ingredientAccessibility
 * - nutrition 객체 추가
 */

import { authFetch } from "@/lib/auth";
import type {
  AnalysisData,
  IngredientInput,
} from "../types/upload.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

/**
 * 재료 문자열을 파싱하여 IngredientInput 배열로 변환
 * 예: "닭가슴살 200g, 브로콜리 100g" → [{name: "닭가슴살", amount: "200g"}, ...]
 */
export function parseIngredients(ingredientsStr: string): IngredientInput[] {
  if (!ingredientsStr.trim()) return [];

  return ingredientsStr
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => {
      // "닭가슴살 200g" 형태에서 이름과 수량 분리
      const match = item.match(/^(.+?)\s*([\d.]+\s*[a-zA-Z가-힣]*)?$/);
      if (match) {
        return {
          name: match[1].trim(),
          amount: match[2]?.trim() || "",
        };
      }
      return { name: item, amount: "" };
    });
}

/**
 * BE RecipeAnalysisResponse 타입
 * ⭐ BE 실제 응답 구조에 맞게 수정됨
 */
interface RecipeAnalysisResponse {
  recipeId: number;
  status: string;
  message: string | null;
  
  // 가성비 점수
  costEfficiencyScore: number | null;
  priceEstimate: number | null;
  
  // AI 코멘트
  comment: string | null;
  
  // ⭐ 세부 점수 (BE 필드명에 맞춤)
  breakdown: {
    priceEfficiency: number;        // 가격 효율
    timeEfficiency: number;         // 시간 효율
    nutritionBalance: number;       // 영양 균형
    ingredientAccessibility: number; // 재료 접근성
  } | null;
  
  // ⭐ 영양 정보 (별도 객체)
  nutrition: {
    kcalEstimate: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sodiumMg: number;
  } | null;
}

/**
 * AI 분석 요청 (BE 경로)
 * POST /api/recipes/{id}/analyze
 * 
 * ⚠️ 주의: recipeId가 필요함 (레시피가 먼저 생성되어 있어야 함)
 */
export async function analyzeRecipe(recipeId: number): Promise<RecipeAnalysisResponse> {
  const response = await authFetch(
    `${API_BASE_URL}/api/recipes/${recipeId}/analyze`,
    { method: "POST" }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI 분석 실패: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * API 응답을 UI용 데이터로 변환
 * ⭐ BE 응답 구조에 맞게 수정됨
 */
export function transformAnalysisResponse(
  response: RecipeAnalysisResponse
): AnalysisData {
  return {
    nutrition: {
      // ⭐ nutrition 객체에서 가져옴
      calories: response.nutrition?.kcalEstimate || 0,
      protein: response.nutrition?.proteinG || 0,
      carbs: response.nutrition?.carbsG || 0,
      fat: response.nutrition?.fatG || 0,
      fiber: response.nutrition?.fiberG || 0,
      sodium: response.nutrition?.sodiumMg || 0,
    },
    valueScore: {
      total: response.costEfficiencyScore || 0,
      // ⭐ BE 필드명에 맞게 수정
      priceEfficiency: response.breakdown?.priceEfficiency || 0,
      nutritionBalance: response.breakdown?.nutritionBalance || 0,
      timeEfficiency: response.breakdown?.timeEfficiency || 0,
      accessibility: response.breakdown?.ingredientAccessibility || 0,
      estimatedPrice: response.priceEstimate || 0,
    },
  };
}

/**
 * 통합 분석 함수 (컴포넌트에서 사용)
 * 
 * @param recipeId - 분석할 레시피 ID (레시피가 먼저 생성되어 있어야 함)
 */
export async function analyzeRecipeWithTransform(
  recipeId: number
): Promise<AnalysisData> {
  const response = await analyzeRecipe(recipeId);
  return transformAnalysisResponse(response);
}
