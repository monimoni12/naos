'use client';

/**
 * 레시피 상세 정보 입력 단계
 * 위치: src/features/upload/components/RecipeDetailsStep.tsx
 *
 * BE 업로드 플로우에 맞게 수정:
 * 1. POST /draft           → 임시 레시피 생성
 * 2. PUT /{id}/clips       → 클립 정보 저장
 * 3. PUT /{id}/thumbnail   → 썸네일 설정
 * 4. PUT /{id}/details     → 상세 정보 입력
 * 5. POST /{id}/analyze    → AI 분석 요청
 * 6. POST /{id}/publish    → 최종 발행
 * 
 * ⭐ 수정: requestAnalysis의 BE 응답 파싱 부분만 수정 (199-217줄)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
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
import { authFetch } from '@/lib/auth';

import type { ScriptSegment, AnalysisData } from '../types/upload.types';
import { parseIngredients } from '../api/analyzeRecipe';
import { uploadVideo, uploadThumbnail } from '../api/uploadMedia';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

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
  const [uploadStatus, setUploadStatus] = useState('');

  // 임시 레시피 ID (draft 생성 후 저장)
  const [draftId, setDraftId] = useState<number | null>(null);

  /**
   * 1. Draft 생성
   * POST /api/recipes/draft
   */
  const createDraft = async (videoUrl: string): Promise<number> => {
    const response = await authFetch(`${API_BASE_URL}/api/recipes/draft`, {
      method: 'POST',
      body: JSON.stringify({
        title: segments[0]?.text?.slice(0, 50) || '새 레시피',
        videoUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('임시 레시피 생성 실패');
    }

    const data = await response.json();
    return data.id;
  };

  /**
   * 2. 클립 정보 저장
   * PUT /api/recipes/{id}/clips
   */
  const saveClips = async (recipeId: number): Promise<void> => {
    const clips = segments.map((seg, idx) => ({
      orderIndex: idx,          // ⭐ BE ClipCreateRequest 필드명에 맞춤
      startSec: seg.startTime || 0,
      endSec: seg.endTime || 0,
      description: seg.text,    // ⭐ BE에서 description → caption으로 저장됨
    }));

    const response = await authFetch(
      `${API_BASE_URL}/api/recipes/${recipeId}/clips`,
      {
        method: 'PUT',
        body: JSON.stringify(clips),
      }
    );

    if (!response.ok) {
      throw new Error('클립 정보 저장 실패');
    }
  };

  /**
   * 3. 썸네일 설정
   * PUT /api/recipes/{id}/thumbnail
   */
  const setThumbnailUrl = async (
    recipeId: number,
    thumbnailUrl: string
  ): Promise<void> => {
    const response = await authFetch(
      `${API_BASE_URL}/api/recipes/${recipeId}/thumbnail`,
      {
        method: 'PUT',
        body: JSON.stringify({ url: thumbnailUrl }),
      }
    );

    if (!response.ok) {
      throw new Error('썸네일 설정 실패');
    }
  };

  /**
   * 4. 상세 정보 입력
   * PUT /api/recipes/{id}/details
   */
  const saveDetails = async (recipeId: number): Promise<void> => {
    const response = await authFetch(
      `${API_BASE_URL}/api/recipes/${recipeId}/details`,
      {
        method: 'PUT',
        body: JSON.stringify({
          title: segments[0]?.text?.slice(0, 50) || '새 레시피',
          caption: message.trim() || segments.map((s) => s.text).join('\n\n'),  // ⭐ description → caption
          category,
          cookTimeMin: cookTime,           // ⭐ cookTime → cookTimeMin
          servings,
          dietTags: [],                    // ⭐ 추가
          hideLikeCount: hideLikes,        // ⭐ hideLikes → hideLikeCount
          hideShareCount: hideShares,      // ⭐ hideShares → hideShareCount
          disableComments: hideComments,   // ⭐ hideComments → disableComments
        }),
      }
    );

    if (!response.ok) {
      throw new Error('상세 정보 저장 실패');
    }
  };

  /**
   * 5. AI 분석 요청
   * POST /api/recipes/{id}/analyze
   * 
   * ⭐ 수정됨: BE 응답 구조에 맞게 파싱
   */
  const requestAnalysis = async (recipeId: number): Promise<AnalysisData> => {
    const response = await authFetch(
      `${API_BASE_URL}/api/recipes/${recipeId}/analyze`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error('AI 분석 요청 실패');
    }

    const data = await response.json();

    // ⭐ BE 응답 → FE AnalysisData 변환 (수정됨)
    return {
      nutrition: {
        // ⭐ nutrition 객체에서 가져옴
        calories: data.nutrition?.kcalEstimate || 0,
        protein: data.nutrition?.proteinG || 0,
        carbs: data.nutrition?.carbsG || 0,
        fat: data.nutrition?.fatG || 0,
        fiber: data.nutrition?.fiberG || 0,
        sodium: data.nutrition?.sodiumMg || 0,
      },
      valueScore: {
        total: data.costEfficiencyScore || 0,
        // ⭐ BE 필드명에 맞게 수정
        priceEfficiency: data.breakdown?.priceEfficiency || 0,
        nutritionBalance: data.breakdown?.nutritionBalance || 0,
        timeEfficiency: data.breakdown?.timeEfficiency || 0,
        accessibility: data.breakdown?.ingredientAccessibility || 0,
        estimatedPrice: data.priceEstimate || 0,
      },
    };
  };

  /**
   * 6. 레시피 발행
   * POST /api/recipes/{id}/publish
   */
  const publishRecipe = async (recipeId: number): Promise<void> => {
    const response = await authFetch(
      `${API_BASE_URL}/api/recipes/${recipeId}/publish`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error('레시피 발행 실패');
    }
  };

  // AI 분석 실행 (Draft 먼저 생성 필요)
  const handleAnalyze = async () => {
    if (!ingredients.trim()) {
      setAnalysisError('재료를 입력해주세요.');
      return;
    }

    if (!file) {
      setAnalysisError('업로드할 파일이 없습니다.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      let recipeId = draftId;

      // Draft가 없으면 먼저 생성
      if (!recipeId) {
        setUploadStatus('영상 업로드 중...');
        const videoUrl = await uploadVideo(file, (progress) => {
          setUploadProgress(progress * 0.5);
        });

        setUploadStatus('레시피 생성 중...');
        recipeId = await createDraft(videoUrl);
        setDraftId(recipeId);

        // 클립 정보 저장
        if (segments.length > 0) {
          await saveClips(recipeId);
        }

        // 썸네일 업로드 및 설정
        if (thumbnailBlob) {
          setUploadStatus('썸네일 업로드 중...');
          const thumbUrl = await uploadThumbnail(
            thumbnailBlob,
            `thumb_${Date.now()}.jpg`
          );
          await setThumbnailUrl(recipeId, thumbUrl);
        }

        // 상세 정보 저장
        setUploadStatus('상세 정보 저장 중...');
        await saveDetails(recipeId);
      }

      // AI 분석 요청
      setUploadStatus('AI 분석 중...');
      const result = await requestAnalysis(recipeId);
      setAnalysisData(result);
      setUploadStatus('');
    } catch (error) {
      console.error('AI 분석 오류:', error);
      setAnalysisError(
        error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.'
      );
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // 임시 저장
  const handleSaveDraft = async () => {
    if (!file) {
      alert('업로드할 파일이 없습니다.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let recipeId = draftId;

      if (!recipeId) {
        setUploadStatus('영상 업로드 중...');
        const videoUrl = await uploadVideo(file, (progress) => {
          setUploadProgress(progress * 0.7);
        });

        setUploadStatus('임시 저장 중...');
        recipeId = await createDraft(videoUrl);
        setDraftId(recipeId);
      }

      // 상세 정보 저장
      await saveDetails(recipeId);

      alert('임시 저장되었습니다.');
    } catch (error) {
      console.error('임시 저장 오류:', error);
      alert('임시 저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  // 공유하기 (전체 업로드 플로우)
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
      let recipeId = draftId;

      // 1. Draft가 없으면 영상 업로드 + Draft 생성
      if (!recipeId) {
        setUploadStatus('영상 업로드 중...');
        const videoUrl = await uploadVideo(file, (progress) => {
          setUploadProgress(progress * 0.4);
        });

        setUploadStatus('레시피 생성 중...');
        recipeId = await createDraft(videoUrl);
        setDraftId(recipeId);
        setUploadProgress(50);
      }

      // 2. 클립 정보 저장
      if (segments.length > 0) {
        setUploadStatus('클립 정보 저장 중...');
        await saveClips(recipeId);
        setUploadProgress(60);
      }

      // 3. 썸네일 업로드 및 설정
      if (thumbnailBlob) {
        setUploadStatus('썸네일 업로드 중...');
        const thumbUrl = await uploadThumbnail(
          thumbnailBlob,
          `thumb_${Date.now()}.jpg`
        );
        await setThumbnailUrl(recipeId, thumbUrl);
        setUploadProgress(70);
      }

      // 4. 상세 정보 저장
      setUploadStatus('상세 정보 저장 중...');
      await saveDetails(recipeId);
      setUploadProgress(80);

      // 5. AI 분석 (아직 안 했으면)
      if (!analysisData && ingredients.trim()) {
        setUploadStatus('AI 분석 중...');
        try {
          await requestAnalysis(recipeId);
        } catch (e) {
          console.warn('AI 분석 실패, 계속 진행:', e);
        }
        setUploadProgress(90);
      }

      // 6. 발행
      setUploadStatus('발행 중...');
      await publishRecipe(recipeId);
      setUploadProgress(100);

      // 성공 후 홈으로 이동
      router.push('/');
    } catch (error) {
      console.error('업로드 오류:', error);
      alert(
        error instanceof Error
          ? error.message
          : '업로드 중 오류가 발생했습니다.'
      );
    } finally {
      setIsUploading(false);
      setUploadStatus('');
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

          {/* 카테고리 - 원본 그대로! */}
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
                id="cookTime"
                value={[cookTime]}
                onValueChange={(val) => setCookTime(val[0])}
                min={5}
                max={120}
                step={5}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">난이도</Label>
              <Select
                value={difficulty}
                onValueChange={(val) =>
                  setDifficulty(val as '쉬움' | '보통' | '어려움')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="쉬움">쉬움</SelectItem>
                  <SelectItem value="보통">보통</SelectItem>
                  <SelectItem value="어려움">어려움</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 인분 수 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">인분 수</Label>
              <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                <span className="text-sm font-bold text-primary">
                  {servings}인분
                </span>
              </div>
            </div>
            <Slider
              value={[servings]}
              onValueChange={(val) => setServings(val[0])}
              min={1}
              max={10}
              step={1}
            />
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
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadStatus || '분석 중...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    분석하기
                  </>
                )}
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
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadStatus || `${uploadProgress}%`}
                </>
              ) : (
                '공유하기'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
