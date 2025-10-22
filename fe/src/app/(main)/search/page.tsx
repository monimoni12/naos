import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Bookmark } from "lucide-react";

const mockSearchResults = [
  { id: "1", thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=600&fit=crop", title: "간편 예쁜 샐러드", views: "1.2M" },
  { id: "2", thumbnail: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=600&fit=crop", title: "달콤한 디저트", views: "890K" },
  { id: "3", thumbnail: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=600&fit=crop", title: "건강한 아침 식사", views: "2.1M" },
  { id: "4", thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=600&fit=crop", title: "신선한 과일 볼", views: "654K" },
  { id: "5", thumbnail: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=600&fit=crop", title: "맛있는 파스타", views: "1.5M" },
  { id: "6", thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=600&fit=crop", title: "완벽한 피자", views: "3.2M" },
  { id: "7", thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop", title: "간단한 저녁 요리", views: "987K" },
  { id: "8", thumbnail: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=600&fit=crop", title: "스시 만들기", views: "1.8M" },
  { id: "9", thumbnail: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&h=600&fit=crop", title: "비건 레시피", views: "720K" },
];

export default function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState(mockSearchResults);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = mockSearchResults.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults(mockSearchResults);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto px-4 py-4">
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="검색"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full bg-secondary/10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
        </div>

        {/* Shorts Grid */}
        <div className="grid grid-cols-3 gap-1">
          {results.map((item) => (
            <div 
              key={item.id} 
              className="relative aspect-[2/3] cursor-pointer group"
              onClick={() => navigate("/shorts", { state: { fromSearch: true } })}
            >
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                  <p className="text-xs font-semibold text-white line-clamp-2">
                    {item.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
