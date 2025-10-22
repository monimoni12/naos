import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Volume2, Sparkles, Check, Loader2, Scissors } from "lucide-react";
import RecipeCard from "@/features/recipes/components/RecipeCard";
import VideoClipEditor from "@/features/upload/components/VideoClipEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/features/toast/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { toast } = useToast();
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [summary, setSummary] = useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showClipEditor, setShowClipEditor] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load recipe data
  useEffect(() => {
    if (!postId) return;
    
    const loadRecipe = async () => {
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", postId)
        .single();

      if (recipeError) {
        console.error("Error loading recipe:", recipeError);
        setLoading(false);
        return;
      }

      if (!recipeData) {
        setLoading(false);
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .eq("user_id", recipeData.user_id)
        .single();

      setRecipe({
        ...recipeData,
        profiles: profileData
      });
      setLoading(false);
    };

    loadRecipe();
  }, [postId]);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, []);

  // Load progress from localStorage
  useEffect(() => {
    const progress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
    if (progress[postId || "1"]) {
      setCheckedSteps(progress[postId || "1"].completed);
    }
  }, [postId]);

  // Scroll smoothly after starting cooking
  useEffect(() => {
    const justStarted = sessionStorage.getItem("justStartedCooking");
    if (justStarted === postId) {
      sessionStorage.removeItem("justStartedCooking");
      setTimeout(() => {
        window.scrollBy({ top: 150, behavior: 'smooth' });
      }, 100);
    }
  }, [postId]);

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
      
      // Save to localStorage
      const progress = JSON.parse(localStorage.getItem("cookingProgress") || "{}");
      progress[postId || ""] = {
        completed: newChecked,
        total: recipe?.steps?.length || 0
      };
      localStorage.setItem("cookingProgress", JSON.stringify(progress));
      
      return newChecked;
    });
  };

  const handleSummarize = async () => {
    if (!recipe?.steps) return;
    
    setLoadingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-recipe", {
        body: { steps: recipe.steps },
      });

      if (error) throw error;

      setSummary(data.summary);
      toast({
        title: "요약 완료!",
        description: "핵심 단계만 추려냈습니다.",
      });
    } catch (error) {
      console.error("Error summarizing recipe:", error);
      toast({
        title: "요약 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const speakStep = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 0.9;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "지원하지 않는 기능",
        description: "이 브라우저는 음성 안내를 지원하지 않습니다.",
        variant: "destructive",
      });
    }
  };

  const handleNextStep = () => {
    if (!recipe?.steps) return;
    
    if (currentStep < recipe.steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      speakStep(`${nextStep + 1}단계. ${recipe.steps[nextStep].description}`);
    } else {
      speakStep("조리가 완료되었습니다!");
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">레시피를 불러오는 중...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">레시피를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
        <RecipeCard 
          key={postId} 
          id={recipe.id}
          author={{
            name: recipe.profiles?.username || "익명",
            avatar: recipe.profiles?.avatar_url || "",
            isFollowing: false,
            userId: recipe.user_id,
          }}
          images={recipe.image_url && recipe.video_url ? [recipe.image_url, recipe.video_url] : recipe.video_url ? [recipe.video_url] : recipe.image_url ? [recipe.image_url] : []}
          title={recipe.title}
          description={recipe.description || ""}
          likes={recipe.likes_count || 0}
          comments={recipe.comments_count || 0}
          timestamp={new Date(recipe.created_at).toLocaleDateString("ko-KR")}
          steps={recipe.steps}
          currentUserId={currentUserId || undefined}
          externalCheckedSteps={checkedSteps}
          onStepCheck={handleStepCheck}
          disableClick={true}
        />

        {/* Script Edit Button */}
        {!showClipEditor && (
          <Button
            onClick={() => setShowClipEditor(true)}
            variant="outline"
            className="w-full"
          >
            <Scissors className="mr-2 h-4 w-4" />
            스크립트 수정하기
          </Button>
        )}

        {/* Video Clip Editor */}
        {showClipEditor && recipe.video_url && (
          <VideoClipEditor
            videoUrl={recipe.video_url}
            postId={postId || ""}
            scriptText={recipe.steps?.map((s: any) => s.description).join(" ") || ""}
            onClose={() => setShowClipEditor(false)}
          />
        )}

        {/* Nutrition Info */}
        {recipe.nutrition && (
          <Card>
            <CardHeader>
              <CardTitle>영양 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-mocha">{recipe.nutrition.calories}</p>
                <p className="text-xs text-muted-foreground">칼로리(kcal)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-mocha">{recipe.nutrition.protein}g</p>
                <p className="text-xs text-muted-foreground">단백질</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-mocha">{recipe.nutrition.carbs}g</p>
                <p className="text-xs text-muted-foreground">탄수화물</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-mocha">{recipe.nutrition.fat}g</p>
                <p className="text-xs text-muted-foreground">지방</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
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
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          )}
        </Card>

        {/* Cooking Steps with TTS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>조리 순서</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={isSpeaking ? stopSpeaking : handleNextStep}
            >
              {isSpeaking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  중지
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  음성 안내 {currentStep + 1}/{recipe.steps?.length || 0}
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recipe.steps?.map((step: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  i === currentStep && isSpeaking
                    ? "bg-mocha/10 border border-mocha"
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
                  <span className="font-semibold">{i + 1}단계.</span> {step.description}
                </label>
                {checkedSteps.includes(i) && (
                  <Check className="h-5 w-5 text-mocha flex-shrink-0 mt-1" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground pb-4">
          {checkedSteps.length === (recipe.steps?.length || 0) && recipe.steps?.length > 0 && (
            <p className="text-mocha font-semibold">🎉 조리 완료! 맛있게 드세요!</p>
          )}
        </div>
      </div>
    </div>
  );
}
