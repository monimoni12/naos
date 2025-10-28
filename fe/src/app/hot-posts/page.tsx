import RecipeCard from "@/features/recipes/components/RecipeCard";
import { Flame } from "lucide-react";

const mockHotPosts = [
  {
    id: "1",
    author: {
      name: "건강요리",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=healthy1",
      isFollowing: false,
    },
    images: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop",
    ],
    title: "다이어트 도시락",
    description: "500kcal 이하 영양 만점 도시락 🍱",
    likes: 2456,
    comments: 187,
    bookmarks: 892,
    timestamp: "2일 전",
  },
  {
    id: "2",
    author: {
      name: "다이어트마스터",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diet1",
      isFollowing: false,
    },
    images: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop",
    ],
    title: "저탄고지 샐러드",
    description: "탄수화물 10g 이하! 포만감 최고 🥗",
    likes: 1987,
    comments: 142,
    bookmarks: 743,
    timestamp: "3일 전",
  },
  {
    id: "3",
    author: {
      name: "요리왕 김셰프",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=chef1",
      isFollowing: true,
    },
    images: [
      "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=600&fit=crop",
    ],
    title: "닭가슴살 스테이크",
    description: "고단백 저칼로리 닭가슴살 레시피 🍗",
    likes: 1654,
    comments: 98,
    bookmarks: 621,
    timestamp: "4일 전",
  },
];

export default function HotPosts() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Flame className="h-7 w-7 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold">핫게시물</h1>
          <p className="text-sm text-muted-foreground">
            많은 사랑을 받고 있는 인기 레시피
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {mockHotPosts.map((post) => (
          <RecipeCard key={post.id} {...post} />
        ))}
      </div>
    </div>
  );
}
