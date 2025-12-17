'use client';

import { useState } from 'react';
import { Filter, RotateCcw, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterValues } from '../types';

interface FeedFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  currentFilters?: FilterValues;
}

export function FeedFilter({ onFilterChange, currentFilters }: FeedFilterProps) {
  const [open, setOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(currentFilters?.maxPrice ?? 50000);
  const [maxCookTime, setMaxCookTime] = useState<number>(currentFilters?.maxCookTime ?? 120);
  const [category, setCategory] = useState<string>(currentFilters?.category ?? 'all');
  const [difficulty, setDifficulty] = useState<string>(currentFilters?.difficulty ?? 'all');
  const [sortBy, setSortBy] = useState<string>(currentFilters?.sortBy ?? 'RECENT');

  const handleApply = () => {
    onFilterChange({
      maxPrice: maxPrice < 50000 ? maxPrice : undefined,
      maxCookTime: maxCookTime < 120 ? maxCookTime : undefined,
      category: category !== 'all' ? category : undefined,
      difficulty: difficulty !== 'all' ? difficulty : undefined,
      sortBy: sortBy as 'RECENT' | 'COST_EFFICIENCY',
    });
    setOpen(false);
  };

  const handleReset = () => {
    setMaxPrice(50000);
    setMaxCookTime(120);
    setCategory('all');
    setDifficulty('all');
    setSortBy('RECENT');
    onFilterChange({});
  };

  const hasActiveFilters =
    maxPrice < 50000 ||
    maxCookTime < 120 ||
    category !== 'all' ||
    difficulty !== 'all' ||
    sortBy !== 'RECENT';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative group hover:border-mocha/50 transition-all duration-300 bg-card shadow-md px-4 h-10 text-sm"
        >
          <Filter className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm">필터</span>
          {hasActiveFilters && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-mocha opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-mocha" />
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="w-full bg-white dark:bg-gray-900 overflow-y-auto max-h-[80vh] flex flex-col items-center"
      >
        <div className="w-full max-w-2xl px-8 py-6">
          <SheetHeader className="pb-6 border-b border-mocha/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-mocha" />
                  <SheetTitle className="text-2xl font-bold">필터</SheetTitle>
                </div>
                <SheetDescription className="text-muted-foreground mt-1">
                  원하는 조건으로 레시피를 찾아보세요
                </SheetDescription>
              </div>
              <button
                onClick={() => setSortBy(sortBy === 'RECENT' ? 'COST_EFFICIENCY' : 'RECENT')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  sortBy === 'COST_EFFICIENCY'
                    ? 'bg-mocha text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                {sortBy === 'COST_EFFICIENCY' ? '가성비순' : '최신순'}
              </button>
            </div>
          </SheetHeader>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* 좌측 컬럼 */}
            <div className="space-y-8">
              {/* 가격 필터 */}
              <div className="space-y-4 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price" className="text-base font-semibold">
                    최대 가격
                  </Label>
                  <div className="px-3 py-1.5 bg-mocha/10 rounded-lg">
                    <span className="text-sm font-bold text-mocha">
                      {maxPrice.toLocaleString()}원
                    </span>
                  </div>
                </div>
                <Slider
                  id="price"
                  min={0}
                  max={50000}
                  step={1000}
                  value={[maxPrice]}
                  onValueChange={(value) => setMaxPrice(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium">0원</span>
                  <span className="font-medium">50,000원</span>
                </div>
              </div>

              {/* 조리 시간 필터 */}
              <div className="space-y-4 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="time" className="text-base font-semibold">
                    최대 조리 시간
                  </Label>
                  <div className="px-3 py-1.5 bg-mocha/10 rounded-lg">
                    <span className="text-sm font-bold text-mocha">{maxCookTime}분</span>
                  </div>
                </div>
                <Slider
                  id="time"
                  min={0}
                  max={120}
                  step={5}
                  value={[maxCookTime]}
                  onValueChange={(value) => setMaxCookTime(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-medium">0분</span>
                  <span className="font-medium">120분</span>
                </div>
              </div>
            </div>

            {/* 우측 컬럼 */}
            <div className="space-y-8">
              {/* 카테고리 필터 */}
              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-semibold">
                  카테고리
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger
                    id="category"
                    className="h-12 border-mocha/20 hover:border-mocha/50 transition-colors duration-200"
                  >
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="반찬">🥗 반찬</SelectItem>
                    <SelectItem value="간식">🍪 간식</SelectItem>
                    <SelectItem value="저탄수화물">🥑 저탄수화물</SelectItem>
                    <SelectItem value="저염식">🧂 저염식</SelectItem>
                    <SelectItem value="고단백">🍗 고단백</SelectItem>
                    <SelectItem value="비건">🌱 비건</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 난이도 필터 */}
              <div className="space-y-3">
                <Label htmlFor="difficulty" className="text-base font-semibold">
                  난이도
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger
                    id="difficulty"
                    className="h-12 border-mocha/20 hover:border-mocha/50 transition-colors duration-200"
                  >
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="EASY">⭐ 쉬움</SelectItem>
                    <SelectItem value="MEDIUM">⭐⭐ 보통</SelectItem>
                    <SelectItem value="HARD">⭐⭐⭐ 어려움</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-3 pt-6 border-t border-mocha/20">
            <Button
              variant="outline"
              className="flex-1 h-12 border-mocha/30 hover:border-mocha hover:bg-mocha/5 transition-all duration-200"
              onClick={handleReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              초기화
            </Button>
            <Button
              className="flex-1 h-12 bg-mocha hover:bg-mocha/90 text-white font-semibold shadow-lg shadow-mocha/20 hover:shadow-mocha/30 transition-all duration-200"
              onClick={handleApply}
            >
              <Check className="mr-2 h-4 w-4" />
              적용하기
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default FeedFilter;
