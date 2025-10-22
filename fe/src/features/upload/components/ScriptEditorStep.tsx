import { useState } from "react";
import { Scissors, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ScriptEditorStepProps {
  file: File | null;
  previewUrl: string;
  script: string;
  onBack: () => void;
  onNext: (splitPositions: number[]) => void;
}

export default function ScriptEditorStep({
  file,
  previewUrl,
  script,
  onBack,
  onNext,
}: ScriptEditorStepProps) {
  const [splitPositions, setSplitPositions] = useState<number[]>([]);

  const addSplit = (position: number) => {
    if (!splitPositions.includes(position) && position > 0 && position < script.length) {
      setSplitPositions([...splitPositions, position].sort((a, b) => a - b));
    }
  };

  const removeSplit = (position: number) => {
    setSplitPositions(splitPositions.filter(p => p !== position));
  };

  // 스크립트를 단어 단위로 분할하여 렌더링
  const renderScript = () => {
    const elements: JSX.Element[] = [];
    const words = script.split(/(\s+)/); // 공백을 포함하여 분할
    let currentPos = 0;

    words.forEach((word, wordIndex) => {
      const wordStart = currentPos;
      const wordEnd = currentPos + word.length;

      // 현재 위치에 분할점이 있는지 확인
      const hasSplitAtStart = splitPositions.includes(wordStart);

      // 분할점 표시
      if (hasSplitAtStart && wordStart > 0) {
        const splitIndex = splitPositions.indexOf(wordStart);
        elements.push(
          <button
            key={`split-${wordStart}`}
            onClick={() => removeSplit(wordStart)}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-xs font-medium select-none cursor-pointer"
            title="클릭하여 제거"
          >
            <Scissors className="h-3 w-3" />
            <span>클립 {splitIndex + 1}</span>
          </button>
        );
      }

      // 단어/공백 렌더링
      if (word.match(/\s+/)) {
        // 공백 - 클릭 가능
        elements.push(
          <span
            key={`space-${wordStart}`}
            onClick={() => addSplit(wordStart)}
            className="inline cursor-pointer"
            title="클릭하여 분할점 추가"
          >
            {word}
          </span>
        );
      } else {
        // 단어
        elements.push(
          <span key={`word-${wordStart}`} className="inline">
            {word}
          </span>
        );
      }

      currentPos = wordEnd;
    });

    return elements;
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">레시피 클립 나누기</h1>
          <p className="text-muted-foreground mt-1">
            스크립트를 클릭하여 클립을 나눌 위치를 지정하세요
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {file?.type.startsWith("video") ? (
              <video src={previewUrl} controls className="w-full h-full" />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <Label className="text-base font-semibold">스크립트</Label>
              {splitPositions.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {splitPositions.length + 1}개 클립으로 나뉨
                </span>
              )}
            </div>

            <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <div className="text-base leading-relaxed">
                {renderScript()}
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-mocha/10 rounded-lg p-4">
              <Scissors className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                단어 사이 공백을 클릭하여 분할점을 추가하세요. 분할점을 클릭하면 제거됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-between">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            이전
          </Button>
          <Button
            variant="mocha"
            size="lg"
            className="px-8"
            onClick={() => onNext(splitPositions)}
          >
            다음 ({splitPositions.length + 1}개 클립)
          </Button>
        </div>
      </div>
    </div>
  );
}
