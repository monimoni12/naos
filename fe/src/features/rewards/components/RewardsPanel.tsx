import { useEffect, useState } from "react";
import { Award, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserPoints {
  total_points: number;
  current_level: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  required_level: string;
  required_points: number;
}

const levelConfig = {
  bronze: { name: "브론즈", next: "silver", color: "bg-[#C9B18C]", points: 500 },
  silver: { name: "실버", next: "gold", color: "bg-gray-400", points: 2000 },
  gold: { name: "골드", next: "platinum", color: "bg-yellow-500", points: 5000 },
  platinum: { name: "플래티넘", next: "diamond", color: "bg-blue-400", points: 10000 },
  diamond: { name: "다이아몬드", next: null, color: "bg-cyan-400", points: 10000 },
};

export default function RewardsPanel() {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    // 포인트 조회
    const { data: pointsData } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (pointsData) {
      setUserPoints(pointsData);
    } else {
      // 초기 포인트 레코드 생성
      const { data: newPoints } = await supabase
        .from("user_points")
        .insert([{ user_id: session.user.id }])
        .select()
        .single();
      if (newPoints) setUserPoints(newPoints);
    }

    // 리워드 목록 조회
    const { data: rewardsData } = await supabase
      .from("rewards")
      .select("*")
      .eq("is_active", true)
      .order("required_points");
    if (rewardsData) setRewards(rewardsData);

    // 받은 리워드 조회
    const { data: claimedData } = await supabase
      .from("user_rewards")
      .select("reward_id")
      .eq("user_id", session.user.id);
    if (claimedData) {
      setClaimedRewards(new Set(claimedData.map(r => r.reward_id)));
    }
    
    setLoading(false);
  };

  const claimReward = async (rewardId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("user_rewards")
      .insert([{ user_id: session.user.id, reward_id: rewardId }]);

    if (error) {
      toast({
        title: "리워드 받기 실패",
        description: "이미 받은 리워드이거나 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "🎉 리워드 획득!",
        description: "축하합니다! 리워드를 받았습니다.",
      });
      loadUserData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">리워드를 확인하려면 로그인해주세요</p>
        </div>
      </div>
    );
  }

  if (!userPoints) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">포인트 정보를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  const currentLevelConfig = levelConfig[userPoints.current_level as keyof typeof levelConfig];
  const progressToNext = currentLevelConfig.next
    ? (userPoints.total_points / currentLevelConfig.points) * 100
    : 100;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="h-10 w-10 text-mocha" />
          <h1 className="text-3xl font-bold">리워드 & 등급</h1>
        </div>
        <p className="text-muted-foreground">
          레시피를 올리고 활동하며 포인트를 모아보세요
        </p>
      </div>

      {/* 레벨 및 포인트 현황 */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${currentLevelConfig.color}`}>
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl">{currentLevelConfig.name} 등급</h3>
            <p className="text-muted-foreground">
              {userPoints.total_points.toLocaleString()} 포인트
            </p>
          </div>
        </div>

        {currentLevelConfig.next && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">다음 등급까지</span>
              <span className="font-semibold">
                {currentLevelConfig.points - userPoints.total_points} 포인트
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}
      </div>

      <div className="h-px bg-border my-8" />

      {/* 포인트 적립 방법 */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">포인트 적립 방법</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">레시피 업로드</span>
            <Badge variant="secondary" className="bg-mocha/20 text-mocha border-0">+100P</Badge>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">좋아요 받기</span>
            <Badge variant="secondary" className="bg-mocha/20 text-mocha border-0">+10P</Badge>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm">댓글 작성</span>
            <Badge variant="secondary" className="bg-mocha/20 text-mocha border-0">+5P</Badge>
          </div>
        </div>
      </div>

      <div className="h-px bg-border my-8" />

      {/* 리워드 목록 */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-mocha" />
          리워드
        </h3>
        <div className="space-y-3">
          {rewards.map((reward) => {
            const canClaim = 
              userPoints.total_points >= reward.required_points &&
              !claimedRewards.has(reward.id);
            const claimed = claimedRewards.has(reward.id);

            return (
              <div
                key={reward.id}
                className={`p-4 rounded-xl border transition-all ${
                  claimed
                    ? "bg-mocha/10 border-mocha/30"
                    : canClaim
                    ? "bg-mocha/5 border-mocha/20"
                    : "bg-muted/20 border-border"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{reward.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {reward.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    {claimed ? (
                      <Badge className="bg-mocha text-white border-0">완료</Badge>
                    ) : canClaim ? (
                      <button
                        onClick={() => claimReward(reward.id)}
                        className="px-4 py-2 bg-mocha text-white rounded-lg text-sm font-semibold hover:bg-mocha/90 transition-colors"
                      >
                        받기
                      </button>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground/30">
                        {reward.required_points}P 필요
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
