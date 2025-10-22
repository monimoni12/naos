import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ScriptSegment = {
  id: string;
  text: string;
};

interface SegmentEditorStepProps {
  file: File | null;
  previewUrl: string;
  segments: ScriptSegment[];
  onBack: () => void;
  onNext: (segments: ScriptSegment[]) => void;
}

export default function SegmentEditorStep({
  file,
  previewUrl,
  segments: initialSegments,
  onBack,
  onNext,
}: SegmentEditorStepProps) {
  const [segments, setSegments] = useState(initialSegments);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  const currentSegment = segments[currentSegmentIndex];

  const handleSegmentTextChange = (id: string, newText: string) => {
    setSegments(segments.map((seg) => (seg.id === id ? { ...seg, text: newText } : seg)));
  };

  const goToPrevSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
    }
  };

  const goToNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
    }
  };

  const handleNext = () => {
    onNext(segments);
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">레시피 상세 정보</h1>
          <p className="text-muted-foreground mt-1">
            각 구간의 설명을 수정하고 계시 설정을 완료하세요
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Clip Navigation */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              클립 {currentSegmentIndex + 1} / {segments.length}
            </Label>
            <div className="relative">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {file?.type.startsWith("video") ? (
                  <video src={previewUrl} controls className="w-full h-full" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )}
              </div>

              {/* Navigation Arrows */}
              {segments.length > 1 && (
                <>
                  {currentSegmentIndex > 0 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white"
                      onClick={goToPrevSegment}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  )}
                  {currentSegmentIndex < segments.length - 1 && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white"
                      onClick={goToNextSegment}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Segment Indicators */}
            {segments.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {segments.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSegmentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSegmentIndex
                        ? "w-8 bg-mocha"
                        : "w-2 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Editable Description */}
          <div>
            <Label htmlFor="description" className="text-base font-semibold mb-2 block">
              클립 설명 (수정 가능)
            </Label>
            <Textarea
              id="description"
              value={currentSegment?.text || ""}
              onChange={(e) => handleSegmentTextChange(currentSegment.id, e.target.value)}
              className="min-h-24 resize-none"
              placeholder="이 클립에 대한 설명을 입력하세요"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-between">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            이전
          </Button>
          <Button variant="mocha" size="lg" className="px-8" onClick={handleNext}>
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
