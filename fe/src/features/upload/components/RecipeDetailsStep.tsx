import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export type ScriptSegment = {
  id: string;
  text: string;
  startTime?: number;
  endTime?: number;
};

interface RecipeDetailsStepProps {
  file: File | null;
  previewUrl: string;
  segments: ScriptSegment[];
  thumbnailTime: number;
  thumbnailBlob: Blob | null;
  onBack: () => void;
}

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export default function RecipeDetailsStep({
  file,
  previewUrl,
  segments,
  thumbnailTime,
  thumbnailBlob,
  onBack,
}: RecipeDetailsStepProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [hideComments, setHideComments] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [hideShares, setHideShares] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 영양 성분 자동 계산 (더미 데이터)
  const handleCalculateNutrition = () => {
    setNutrition({
      calories: 450,
      protein: 35,
      carbs: 42,
      fat: 12,
      fiber: 8,
      sodium: 650,
    });
  };

  const handleSaveDraft = async () => {
    toast({
      title: "임시 저장 완료",
      description: "레시피가 임시 저장되었습니다.",
    });
  };

  const handleShare = async () => {
    console.log('handleShare called');
    console.log('file:', file);
    console.log('category:', category);
    
    if (!file) {
      toast({
        title: "오류",
        description: "업로드할 파일이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "카테고리 선택 필요",
        description: "카테고리를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    console.log('Starting upload...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user);
      
      if (!user) {
        toast({
          title: "로그인 필요",
          description: "게시물을 올리려면 로그인이 필요합니다.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // 파일 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucketName = file.type.startsWith('video') ? 'recipe-videos' : 'recipe-images';
      
      console.log('Uploading to bucket:', bucketName, 'fileName:', fileName);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      console.log('Upload result:', { uploadError });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // 섬네일 업로드
      let thumbnailUrl = null;
      if (thumbnailBlob) {
        const thumbnailFileName = `${user.id}/${Date.now()}_thumb.jpg`;
        const { error: thumbError } = await supabase.storage
          .from('recipe-images')
          .upload(thumbnailFileName, thumbnailBlob);

        if (!thumbError) {
          const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = thumbUrl;
        }
      }

      // 사용자 메시지가 없으면 스크립트 전체를 사용
      const userMessage = message.trim() || segments.map(s => s.text).join('\n\n');

      // 레시피 데이터 생성
      const recipeData: any = {
        user_id: user.id,
        title: segments[0]?.text.slice(0, 50) || "새 레시피",
        description: userMessage,
        category,
        difficulty: "중급",
        cook_time: 30,
        servings: 2,
        ingredients: ingredients.split(',').map(i => ({ name: i.trim(), amount: "" })),
        steps: segments.map((seg, idx) => ({
          step: idx + 1,
          description: seg.text,
          startTime: seg.startTime,
          endTime: seg.endTime,
        })),
        nutrition: nutrition ? JSON.parse(JSON.stringify(nutrition)) : null,
      };

      // 비디오 파일인 경우 video_url과 image_url(섬네일) 모두 설정
      if (file.type.startsWith('video')) {
        recipeData.video_url = publicUrl;
        if (thumbnailUrl) {
          recipeData.image_url = thumbnailUrl;
        }
      } else {
        // 이미지 파일인 경우 image_url만 설정
        recipeData.image_url = publicUrl;
      }

      console.log('Inserting recipe data:', recipeData);
      
      const { data: recipeResult, error: insertError } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single();

      console.log('Insert result:', { insertError });
      if (insertError) throw insertError;

      // 레시피 업로드 포인트 적립 (100점)
      if (recipeResult) {
        const { error: pointsError } = await supabase.rpc("add_points", {
          p_user_id: user.id,
          p_points: 100,
          p_reason: "레시피 업로드",
          p_reference_id: recipeResult.id,
        });

        if (pointsError) {
          console.error("포인트 적립 실패:", pointsError);
        }
      }

      toast({
        title: "게시 완료!",
        description: "레시피가 성공적으로 게시되었습니다.",
      });

      navigate("/");
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "업로드 실패",
        description: "게시물 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">레시피 상세 정보</h1>
          <p className="text-muted-foreground mt-1">
            각 구간의 설명을 수정하고 게시 설정을 완료하세요
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* User Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-base font-semibold">
              메시지
            </Label>
            <Textarea
              id="message"
              placeholder="게시물에 표시될 메시지를 입력하세요 (비워두면 스크립트 전체가 사용됩니다)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Category Selection */}
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

          {/* AI Nutrition Calculator */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">AI 영양 성분 분석</Label>
              <Button variant="outline" size="sm" onClick={handleCalculateNutrition}>
                <Sparkles className="mr-2 h-4 w-4" />
                자동 계산
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

            {nutrition && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">칼로리</p>
                  <p className="text-xl font-bold text-mocha">{nutrition.calories}kcal</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">단백질</p>
                  <p className="text-xl font-bold text-mocha">{nutrition.protein}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">탄수화물</p>
                  <p className="text-xl font-bold text-mocha">{nutrition.carbs}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">지방</p>
                  <p className="text-xl font-bold text-mocha">{nutrition.fat}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">식이섬유</p>
                  <p className="text-xl font-bold text-mocha">{nutrition.fiber}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">나트륨</p>
                  <p className="text-xl font-bold text-mocha">{nutrition.sodium}mg</p>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
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
              <Switch id="hide-likes" checked={hideLikes} onCheckedChange={setHideLikes} />
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
              <Switch id="hide-shares" checked={hideShares} onCheckedChange={setHideShares} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-between">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            이전
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={handleSaveDraft} disabled={isUploading}>
              임시 저장
            </Button>
            <Button variant="mocha" size="lg" className="px-8" onClick={handleShare} disabled={isUploading}>
              {isUploading ? "업로드 중..." : "공유하기"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
