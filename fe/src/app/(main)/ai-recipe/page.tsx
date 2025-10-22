import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";

export default function AIRecipeGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState("");
  const [time, setTime] = useState("");
  const [calories, setCalories] = useState("");
  const [category, setCategory] = useState("");
  const [recipe, setRecipe] = useState<any>(null);

  const handleGenerate = async () => {
    if (!ingredients || !time || !calories) {
      toast({
        title: "입력값을 확인해주세요",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: { ingredients, time, calories, category },
      });

      if (error) throw error;

      setRecipe(data);
      toast({
        title: "레시피 생성 완료!",
        description: "AI가 맞춤 레시피를 만들었습니다.",
      });
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast({
        title: "레시피 생성 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-3">
          <Sparkles className="h-10 w-10 text-mocha" />
          AI 레시피 생성기
        </h1>
        <p className="text-muted-foreground">
          재료와 조건을 입력하면 AI가 맞춤 다이어트 레시피를 만들어드립니다
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>레시피 조건 입력</CardTitle>
          <CardDescription>
            가지고 있는 재료와 원하는 조리 시간, 칼로리를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredients">재료</Label>
            <Textarea
              id="ingredients"
              placeholder="예: 닭가슴살, 브로콜리, 현미"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">조리 시간 (분)</Label>
              <Input
                id="time"
                type="number"
                placeholder="30"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">목표 칼로리 (kcal)</Label>
              <Input
                id="calories"
                type="number"
                placeholder="400"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택 (선택사항)" />
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

          <Button
            className="w-full"
            variant="mocha"
            size="lg"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                레시피 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                레시피 생성하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recipe && (
        <Card>
          <CardHeader>
            <CardTitle>{recipe.title}</CardTitle>
            <CardDescription>{recipe.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">재료</h3>
              <ul className="list-disc list-inside space-y-1">
                {recipe.ingredients?.map((ingredient: string, i: number) => (
                  <li key={i}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">조리 순서</h3>
              <ol className="list-decimal list-inside space-y-2">
                {recipe.steps?.map((step: string, i: number) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">칼로리</p>
                <p className="text-xl font-bold">{recipe.nutrition?.calories}kcal</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">단백질</p>
                <p className="text-xl font-bold">{recipe.nutrition?.protein}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">탄수화물</p>
                <p className="text-xl font-bold">{recipe.nutrition?.carbs}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">지방</p>
                <p className="text-xl font-bold">{recipe.nutrition?.fat}g</p>
              </div>
            </div>

            {recipe.tips && recipe.tips.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">💡 꿀팁</h3>
                <ul className="list-disc list-inside space-y-1">
                  {recipe.tips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
