import { Home, PlaySquare, PlusCircle, Heart, User, Sparkles, Flame, Award, Search as SearchIcon, X, ChevronLeft } from "lucide-react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import logo from "@/assets/logo.png";
import speechBubble from "@/assets/speech-bubble.png";
import naosIcon from "@/assets/naos-icon.gif";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const isHotPage = location.pathname === "/hot";
  const isHomePage = location.pathname === "/" || location.pathname === "/hot";
  const isShortsPage = location.pathname === "/shorts";
  const bubbleMessage = isHotPage ? "전체 게시물 볼래!" : "핫게시물 볼래!";
  const targetPath = isHotPage ? "/" : "/hot";
  
  // Pages that need back button (AI 레시피, 리워드, 검색, 레시피 상세, 다른 유저 프로필, 유저 게시물, 프로필 피드 뷰, 팔로잉 리스트, 팔로워 리스트)
  const needsBackButton = ["/rewards", "/ai-recipe", "/search", "/following/list", "/followers"].includes(location.pathname) || 
                          location.pathname.startsWith("/post/") ||
                          location.pathname.startsWith("/user/") ||
                          (location.pathname === "/profile" && location.search.includes("view=feed"));
  
  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/shorts", icon: PlaySquare, label: "쇼츠" },
    { path: "/upload", icon: PlusCircle, label: "업로드" },
    { path: "/following", icon: Heart, label: "팔로잉" },
    { path: "/profile", icon: User, label: "내 페이지" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setShowSpeechBubble(false);
      }
    };

    if (isSearchOpen || showSpeechBubble) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, showSpeechBubble]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <header className={`sticky top-0 z-50 w-full ${isShortsPage ? 'bg-black' : 'bg-background'}`} ref={searchRef}>
        <div className={`flex h-24 items-center justify-between px-4 ${isShortsPage ? 'text-white' : ''}`}>
          {/* 좌측: AI 레시피 + 리워드 + 뒤로가기(필요시) */}
          <div className="flex items-center gap-2 ml-2">
            <button 
              className="p-2 transition-transform duration-200 group"
              onClick={() => navigate("/ai-recipe")}
            >
              <Sparkles className="h-5 w-5 group-hover:animate-[sparkle_0.8s_ease-in-out]" />
            </button>

            <button 
              className="p-2 transition-transform duration-200 group"
              onClick={() => navigate("/rewards")}
            >
              <Award className="h-5 w-5 group-hover:animate-[award-shine_0.8s_ease-in-out]" />
            </button>

            {needsBackButton && (
              <button 
                className="p-2 transition-transform duration-200 hover:scale-110"
                onClick={() => {
                  // 프로필 피드 뷰에서는 그리드로 돌아가기
                  if (location.pathname === "/profile" && location.search.includes("view=feed")) {
                    navigate("/profile");
                  } else {
                    navigate(-1);
                  }
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* 중앙: 로고 - 핫게시물일 때는 선글라스 낀 나오스 */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="relative">
              <button 
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
                onMouseEnter={() => isHomePage && setShowSpeechBubble(true)}
                onMouseLeave={() => setShowSpeechBubble(false)}
                onClick={() => !isHomePage && navigate("/")}
              >
                <img src={isHotPage ? naosIcon : logo} alt="Logo" className="h-16 w-auto" />
              </button>
              
              {isHomePage && showSpeechBubble && (
                <div 
                  className="absolute top-14 left-20 z-50"
                  onMouseEnter={() => setShowSpeechBubble(true)}
                  onMouseLeave={() => setShowSpeechBubble(false)}
                >
                  <div 
                    className="relative cursor-pointer transition-transform w-72 h-32"
                    style={{
                      animation: 'bubble-pulse 2s ease-in-out infinite'
                    }}
                    onClick={() => {
                      navigate(targetPath);
                      setShowSpeechBubble(false);
                    }}
                  >
                    {/* 귀여운 생각 말풍선 SVG (뒤집음) */}
                    <svg 
                      viewBox="0 0 320 150" 
                      className="absolute inset-0 w-full h-full drop-shadow-lg"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: 'scaleY(-1)' }}
                    >
                      {/* 꼬리 원들 (왼쪽 아래) */}
                      <circle cx="35" cy="130" r="8" fill="white" stroke="none"/>
                      <circle cx="55" cy="120" r="12" fill="white" stroke="none"/>
                      
                      {/* 메인 구름 모양 말풍선 */}
                      <g>
                        {/* 하단 원들 4개 */}
                        <circle cx="105" cy="105" r="33" fill="white" stroke="none"/>
                        <circle cx="155" cy="108" r="36" fill="white" stroke="none"/>
                        <circle cx="200" cy="108" r="36" fill="white" stroke="none"/>
                        <circle cx="245" cy="105" r="33" fill="white" stroke="none"/>
                        
                        {/* 상단 원들 4개 */}
                        <circle cx="120" cy="65" r="22" fill="white" stroke="none"/>
                        <circle cx="160" cy="60" r="28" fill="white" stroke="none"/>
                        <circle cx="200" cy="60" r="28" fill="white" stroke="none"/>
                        <circle cx="235" cy="65" r="22" fill="white" stroke="none"/>
                        
                        {/* 좌우 측면 원들 (자연스러운 몸 형태) */}
                        <circle cx="85" cy="85" r="25" fill="white" stroke="none"/>
                        <circle cx="265" cy="85" r="25" fill="white" stroke="none"/>
                      </g>
                    </svg>
                    
                    {/* 텍스트 */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(15px, -10px)' }}>
                      <p 
                        className="text-2xl font-bold text-gray-700"
                        style={{ fontFamily: "'Gaegu', 'Comic Sans MS', cursive" }}
                      >
                        {bubbleMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 우측: 검색 */}
          <div className="flex items-center gap-2 mr-2">
            {location.pathname !== "/search" && (
              <button 
                className="p-2 transition-transform duration-200 group"
                onClick={() => navigate("/search")}
              >
                <SearchIcon className="h-5 w-5 group-hover:animate-[search-zoom_0.6s_ease-in-out]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 pb-16 ${isShortsPage ? 'bg-black' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 shadow-lg ${isShortsPage ? 'bg-black' : 'bg-background'}`}>
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all group`
              }
            >
              {({ isActive }) => {
                const getAnimationClass = () => {
                  switch(path) {
                    case '/': return 'group-hover:animate-[home-bounce_0.8s_ease-in-out]';
                    case '/shorts': return 'group-hover:animate-[user-wave_0.55s_ease-in-out]';
                    case '/upload': return 'group-hover:animate-[plus-pop_0.6s_ease-in-out]';
                    case '/following': return 'group-hover:animate-[heart-beat_0.8s_ease-in-out]';
                    case '/profile': return 'group-hover:animate-[play-pulse_0.8s_ease-in-out]';
                    default: return '';
                  }
                };
                
                return (
                  <>
                    {path === '/shorts' && isActive && isShortsPage ? (
                      <svg 
                        className={`h-6 w-6 ${getAnimationClass()}`}
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" fill="white" stroke="white"/>
                        <polygon points="10 8 16 12 10 16 10 8" fill="black" stroke="none"/>
                      </svg>
                    ) : (
                      <Icon 
                        className={`h-6 w-6 ${
                          isShortsPage 
                            ? "text-white"
                            : (isActive ? "text-mocha" : "text-muted-foreground")
                        } ${getAnimationClass()}`}
                      />
                    )}
                    <span className={`text-xs font-medium ${
                      isShortsPage 
                        ? "text-white" 
                        : (isActive ? "text-mocha" : "text-muted-foreground")
                    }`}>
                    {label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
