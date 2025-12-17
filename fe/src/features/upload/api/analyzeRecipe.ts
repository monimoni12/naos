/**
 * AI 분석 API 호출
 * 위치: src/features/upload/api/analyzeRecipe.ts
 * 
 * Flask AI 서버의 analyze_recipe_full 엔드포인트 호출
 * 가성비 점수 + 영양 정보를 한 번에 받아옴
 */

import type {
  AnalysisRequest,
  AnalysisResponse,
  AnalysisData,
  IngredientInput,
} from "../types/upload.types";

// API 베이스 URL (환경변수로 관리)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:5000";

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
 * AI 서버에 레시피 분석 요청
 * Spring BE를 거치지 않고 직접 Flask AI 서버 호출
 */
export async function analyzeRecipeDirect(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  const response = await fetch(`${AI_API_URL}/analyze-recipe-full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`AI 분석 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * Spring BE를 통해 AI 분석 요청 (권장)
 * BE에서 추가 검증 및 캐싱 처리
 */
export async function analyzeRecipe(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/analyze-recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`AI 분석 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * API 응답을 UI용 데이터로 변환
 */
export function transformAnalysisResponse(
  response: AnalysisResponse
): AnalysisData {
  return {
    nutrition: {
      calories: response.nutrition.kcal_estimate,
      protein: response.nutrition.protein_g,
      carbs: response.nutrition.carbs_g,
      fat: response.nutrition.fat_g,
      fiber: response.nutrition.fiber_g,
      sodium: response.nutrition.sodium_mg,
    },
    valueScore: {
      total: response.cost_efficiency.score,
      priceEfficiency: response.cost_efficiency.breakdown.price_efficiency,
      nutritionBalance: response.cost_efficiency.breakdown.nutrition_balance,
      timeEfficiency: response.cost_efficiency.breakdown.time_efficiency,
      accessibility: response.cost_efficiency.breakdown.accessibility,
      estimatedPrice: response.cost_efficiency.estimated_total_price,
    },
  };
}

/**
 * 통합 분석 함수 (컴포넌트에서 사용)
 */
export async function analyzeRecipeWithTransform(
  title: string,
  ingredientsStr: string,
  cookTime: number,
  difficulty: "쉬움" | "보통" | "어려움",
  servings: number = 1
): Promise<AnalysisData> {
  const request: AnalysisRequest = {
    title,
    ingredients: parseIngredients(ingredientsStr),
    cook_time_min: cookTime,
    difficulty,
    servings,
  };

  // BE를 통한 호출 시도, 실패시 직접 호출
  try {
    const response = await analyzeRecipe(request);
    return transformAnalysisResponse(response);
  } catch (error) {
    console.warn("BE 호출 실패, AI 서버 직접 호출 시도:", error);
    const response = await analyzeRecipeDirect(request);
    return transformAnalysisResponse(response);
  }
}
