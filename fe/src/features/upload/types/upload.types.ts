/**
 * 업로드 관련 타입 정의
 * 위치: src/features/upload/types/upload.types.ts
 */

// ===== 클립 관련 =====

export interface VideoClip {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface ScriptSegment {
  id: string;
  text: string;
  startTime?: number;
  endTime?: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

// ===== 업로드 스텝 =====

export type UploadStep = 'upload' | 'clipping' | 'thumbnail' | 'details';

// ===== AI 분석 관련 =====

export interface IngredientInput {
  name: string;
  amount: string;
}

export interface AnalysisRequest {
  title: string;
  ingredients: IngredientInput[];
  cook_time_min: number;
  difficulty: '쉬움' | '보통' | '어려움';
  servings: number;
}

export interface CostEfficiencyBreakdown {
  price_efficiency: number;
  nutrition_balance: number;
  time_efficiency: number;
  accessibility: number;
}

export interface CostEfficiencyResult {
  score: number;
  breakdown: CostEfficiencyBreakdown;
  estimated_total_price: number;
  summary: string;
}

export interface NutritionResult {
  kcal_estimate: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  summary: string;
}

export interface AnalysisResponse {
  cost_efficiency: CostEfficiencyResult;
  nutrition: NutritionResult;
}

// ===== UI용 변환 타입 (FE에서 사용) =====

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export interface ValueScoreData {
  total: number;
  priceEfficiency: number;
  nutritionBalance: number;
  timeEfficiency: number;
  accessibility: number;
  estimatedPrice: number;
}

export interface AnalysisData {
  nutrition: NutritionData;
  valueScore: ValueScoreData;
}

// ===== 레시피 생성 관련 =====

export interface RecipeStep {
  step: number;
  description: string;
  startTime?: number;
  endTime?: number;
}

export interface CreateRecipeRequest {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  cook_time: number;
  servings: number;
  ingredients: IngredientInput[];
  steps: RecipeStep[];
  video_url?: string;
  image_url?: string;
  thumbnail_url?: string;
  nutrition?: NutritionData;
  value_score?: number;
  hide_comments?: boolean;
  hide_likes?: boolean;
  hide_shares?: boolean;
}

// ===== Presigned URL 관련 =====

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}
