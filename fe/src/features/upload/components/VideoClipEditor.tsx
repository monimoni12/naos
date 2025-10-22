import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Scissors, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoClipEditorProps {
  videoUrl: string;
  postId: string;
  scriptText: string;
  onClose: () => void;
}

export default function VideoClipEditor({ videoUrl, postId, scriptText, onClose }: VideoClipEditorProps) {
  const { toast } = useToast();
  const scriptRef = useRef<HTMLDivElement>(null);
  const [splitPositions, setSplitPositions] = useState<number[]>([]);

  const handleScriptClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scriptRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(scriptRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const caretPosition = preCaretRange.toString().length;
    
    // 같은 위치는 추가하지 않음
    if (!splitPositions.includes(caretPosition) && caretPosition > 0 && caretPosition < scriptText.length) {
      setSplitPositions([...splitPositions, caretPosition].sort((a, b) => a - b));
    }
  };

  const removeSplit = (position: number) => {
    setSplitPositions(splitPositions.filter(p => p !== position));
  };

  const renderScriptWithSplits = () => {
    if (splitPositions.length === 0) {
      return <span>{scriptText}</span>;
    }

    const positions = [0, ...splitPositions, scriptText.length];
    const parts = [];

    for (let i = 0; i < positions.length - 1; i++) {
      const text = scriptText.slice(positions[i], positions[i + 1]);
      parts.push(
        <span key={`text-${i}`} className="inline">
          {text}
        </span>
      );
      
      if (i < positions.length - 2) {
        parts.push(
          <span key={`split-${i}`} className="inline-flex items-center mx-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSplit(positions[i + 1]);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-xs font-medium"
            >
              <Scissors className="h-3 w-3" />
              <span>클립 {i + 1}</span>
            </button>
          </span>
        );
      }
    }

    return <>{parts}</>;
  };

  const handleSave = () => {
    const savedClips = JSON.parse(localStorage.getItem("videoClips") || "{}");
    savedClips[postId] = splitPositions;
    localStorage.setItem("videoClips", JSON.stringify(savedClips));

    toast({
      title: "저장 완료",
      description: `${splitPositions.length + 1}개의 클립으로 나뉩니다.`,
    });
    onClose();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          스크립트 수정하기
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={videoUrl}
            className="w-full h-full object-contain"
            controls
          />
        </div>

        {/* Script Editor */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <Label className="text-base font-semibold">조리 순서 스크립트</Label>
            {splitPositions.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {splitPositions.length + 1}개 클립으로 나뉨
              </span>
            )}
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
            <div
              ref={scriptRef}
              onClick={handleScriptClick}
              className="text-base leading-relaxed cursor-text select-text"
            >
              {renderScriptWithSplits()}
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-mocha/10 rounded-lg p-4">
            <Scissors className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              스크립트를 클릭하여 클립을 나눌 위치를 지정하세요. 
              클릭한 위치마다 가위 아이콘이 표시되며, 클릭하면 제거할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1" variant="mocha">
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
