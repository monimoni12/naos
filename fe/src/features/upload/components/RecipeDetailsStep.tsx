'use client';

/**
 * 레시피 상세 정보 입력 단계
 * 위치: src/features/upload/components/RecipeDetailsStep.tsx
 *
 * 변경사항 (Lovable → Next.js):
 * - "use client" 추가
 * - react-router-dom → next/navigation
 * - supabase → Spring BE API 호출
 * - 더미 AI 분석 → 실제 API 호출
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ScriptSegment, AnalysisData } from '../types/upload.types';
import {
  analyzeRecipeWithTransform,
  parseIngredients,
} from '../api/analyzeRecipe';
import { uploadVideo, uploadThumbnail } from '../api/uploadMedia';

interface RecipeDetailsStepProps {
  file: File | null;
  previewUrl: string;
  segments: ScriptSegment[];
  thumbnailTime: number;
  thumbnailBlob: Blob | null;
  onBack: () => void;
}

export default function RecipeDetailsStep({
  file,
  previewUrl,
  segments,
  thumbnailTime,
  thumbnailBlob,
  onBack,
}: RecipeDetailsStepProps) {
  const router = useRouter();

  // Form state
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [cookTime, setCookTime] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<'쉬움' | '보통' | '어려움'>(
    '보통'
  );
  const [ingredients, setIngredients] = useState('');
  const [servings, setServings] = useState(1);

  // AI 분석 state
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 공개 설정 state
  const [hideComments, setHideComments] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [hideShares, setHideShares] = useState(false);

  // 업로드 state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AI 분석 실행
  const handleAnalyze = async () => {
    if (!ingredients.trim()) {
      setAnalysisError('재료를 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeRecipeWithTransform(
        segments[0]?.text?.slice(0, 50) || '레시피',
        ingredients,
        cookTime,
        difficulty,
        servings
      );
      setAnalysisData(result);
    } catch (error) {
      console.error('AI 분석 오류:', error);
      setAnalysisError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 임시 저장
  const handleSaveDraft = async () => {
    // TODO: 드래프트 저장 API 호출
    console.log('임시 저장');
  };

  // 공유하기 (업로드)
  const handleShare = async () => {
    if (!file) {
      alert('업로드할 파일이 없습니다.');
      return;
    }

    if (!category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // TODO: 인증 토큰 가져오기
      const token = undefined; // await getAuthToken();

      // 1. 비디오 업로드
      const videoUrl = await uploadVideo(file, token, (progress) => {
        setUploadProgress(progress * 0.7); // 70%까지
      });

      // 2. 썸네일 업로드
      let thumbnailUrl: string | undefined;
      if (thumbnailBlob) {
        thumbnailUrl = await uploadThumbnail(
          thumbnailBlob,
          `thumb_${Date.now()}.jpg`,
          token
        );
        setUploadProgress(80);
      }

      // 3. 레시피 데이터 생성 및 저장
      const recipeData = {
        title: segments[0]?.text?.slice(0, 50) || '새 레시피',
        description: message.trim() || segments.map((s) => s.text).join('\n\n'),
        category,
        difficulty,
        cook_time: cookTime,
        servings,
        ingredients: parseIngredients(ingredients),
        steps: segments.map((seg, idx) => ({
          step: idx + 1,
          description: seg.text,
          startTime: seg.startTime,
          endTime: seg.endTime,
        })),
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        nutrition: analysisData?.nutrition,
        value_score: analysisData?.valueScore.total,
        hide_comments: hideComments,
        hide_likes: hideLikes,
        hide_shares: hideShares,
      };

      // TODO: 레시피 저장 API 호출
      console.log('레시피 데이터:', recipeData);
      setUploadProgress(100);

      // 성공 후 홈으로 이동
      router.push('/');
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">레시피 상세 정보</h1>
          <p className="text-muted-foreground mt-1">
            각 구간의 설명을 수정하고 게시 설정을 완료하세요
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 메시지 */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-base font-semibold">
              메시지
            </Label>
            <Textarea
              id="message"
              placeholder="게시물에 표시될 메시지를 입력하세요 (비워두면 스크립트 전체가 사용됩니다)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="category" className="text-base font-semibold">
              카테고리
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="반찬">반찬</SelectItem>
                <SelectItem value="간식">간식</SelectItem>
                <SelectItem value="저탄수">저탄수화물</SelectItem>
                <SelectItem value="저염">저염식</SelectItem>
                <SelectItem value="고단백">고단백</SelectItem>
                <SelectItem value="비건">비건</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 조리시간 & 난이도 */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cookTime" className="text-base font-semibold">
                  조리시간
                </Label>
                <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                  <span className="text-sm font-bold text-primary">
                    {cookTime}분
                  </span>
                </div>
              </div>
              <Slider
                min={0}
                max={120}
                step={5}
                value={[cookTime]}
                onValueChange={(value: number[]) => setCookTime(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0분</span>
                <span>120분</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-base font-semibold">
                난이도
              </Label>
              <Select
                value={difficulty}
                onValueChange={(v: string) =>
                  setDifficulty(v as typeof difficulty)
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="난이도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="쉬움">⭐ 쉬움</SelectItem>
                  <SelectItem value="보통">⭐⭐ 보통</SelectItem>
                  <SelectItem value="어려움">⭐⭐⭐ 어려움</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI 분석 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">AI 분석</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !ingredients.trim()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isAnalyzing ? '분석 중...' : '✨ 분석하기'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients">재료 (쉼표로 구분)</Label>
              <Textarea
                id="ingredients"
                placeholder="예: 닭가슴살 200g, 브로콜리 100g, 현미 150g"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={2}
              />
            </div>

            {analysisError && (
              <p className="text-sm text-destructive">{analysisError}</p>
            )}

            {analysisData && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {/* 가성비 점수 카드 */}
                <div className="p-4 bg-card rounded-2xl shadow-sm border space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-base">🏆</span>
                    </div>
                    <span className="text-sm font-medium">가성비 점수</span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {analysisData.valueScore.total}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>

                  {/* 추정 재료비 */}
                  <p className="text-sm text-muted-foreground">
                    추정 재료비: 약{' '}
                    {analysisData.valueScore.estimatedPrice.toLocaleString()}원
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        label: '가격 효율',
                        value: analysisData.valueScore.priceEfficiency,
                        color: 'bg-rose-400',
                      },
                      {
                        label: '영양 균형',
                        value: analysisData.valueScore.nutritionBalance,
                        color: 'bg-amber-400',
                      },
                      {
                        label: '시간 효율',
                        value: analysisData.valueScore.timeEfficiency,
                        color: 'bg-emerald-400',
                      },
                      {
                        label: '재료 접근',
                        value: analysisData.valueScore.accessibility,
                        color: 'bg-blue-400',
                      },
                    ].map((item, idx) => (
                      <div
                        key={item.label}
                        className="p-3 bg-muted/50 rounded-xl text-center animate-in fade-in duration-300"
                        style={{ animationDelay: `${(idx + 1) * 80}ms` }}
                      >
                        <div
                          className={`w-2 h-2 ${item.color} rounded-full mx-auto mb-2`}
                        />
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold">
                          {item.value}점
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 영양 정보 카드 */}
                <div className="p-4 bg-card rounded-2xl shadow-sm border space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-base">🔥</span>
                    </div>
                    <span className="text-sm font-medium">총 칼로리</span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {analysisData.nutrition.calories}
                    </span>
                    <span className="text-sm text-muted-foreground">kcal</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: '단백질',
                        value: analysisData.nutrition.protein,
                        unit: 'g',
                        color: 'bg-rose-400',
                      },
                      {
                        label: '탄수화물',
                        value: analysisData.nutrition.carbs,
                        unit: 'g',
                        color: 'bg-amber-400',
                      },
                      {
                        label: '지방',
                        value: analysisData.nutrition.fat,
                        unit: 'g',
                        color: 'bg-violet-400',
                      },
                    ].map((item, idx) => (
                      <div
                        key={item.label}
                        className="p-3 bg-muted/50 rounded-xl text-center animate-in fade-in duration-300"
                        style={{ animationDelay: `${300 + idx * 80}ms` }}
                      >
                        <div
                          className={`w-2 h-2 ${item.color} rounded-full mx-auto mb-2`}
                        />
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold">
                          {item.value}
                          {item.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 공개 설정 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-base font-semibold">공개 설정</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hide-comments" className="font-medium">
                  댓글 기능 해제
                </Label>
                <p className="text-sm text-muted-foreground">
                  다른 사람들이 댓글을 달 수 없습니다
                </p>
              </div>
              <Switch
                id="hide-comments"
                checked={hideComments}
                onCheckedChange={setHideComments}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hide-likes" className="font-medium">
                  좋아요 수 숨기기
                </Label>
                <p className="text-sm text-muted-foreground">
                  좋아요 수를 나만 볼 수 있습니다
                </p>
              </div>
              <Switch
                id="hide-likes"
                checked={hideLikes}
                onCheckedChange={setHideLikes}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hide-shares" className="font-medium">
                  공유 횟수 숨기기
                </Label>
                <p className="text-sm text-muted-foreground">
                  공유 횟수를 나만 볼 수 있습니다
                </p>
              </div>
              <Switch
                id="hide-shares"
                checked={hideShares}
                onCheckedChange={setHideShares}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-between">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            이전
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleSaveDraft}
              disabled={isUploading}
            >
              임시 저장
            </Button>
            <Button
              size="lg"
              className="px-8"
              onClick={handleShare}
              disabled={isUploading}
            >
              {isUploading ? `업로드 중... ${uploadProgress}%` : '공유하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
