"use client";

/**
 * 비디오/이미지 업로드 단계
 * 위치: src/features/upload/components/VideoUploadStep.tsx
 */

import { Video, Image as ImageIcon, UploadIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoUploadStepProps {
  file: File | null;
  previewUrl: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onNext: () => void;
}

export default function VideoUploadStep({
  file,
  previewUrl,
  onFileChange,
  onRemoveFile,
  onNext,
}: VideoUploadStepProps) {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <div className="bg-card rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">새 레시피 올리기</h1>
          <p className="text-muted-foreground mt-1">
            동영상을 업로드하고 레시피를 공유하세요
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!file ? (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <UploadIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">동영상 또는 이미지 선택</p>
              <p className="text-xs text-muted-foreground">
                파일을 끌어다 놓거나 클릭하여 업로드하세요
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Video className="h-4 w-4" /> MP4, MOV
                </span>
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" /> JPG, PNG
                </span>
              </div>
            </label>
          ) : (
            <div className="relative">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {file.type.startsWith("video") ? (
                  <video src={previewUrl} controls className="w-full h-full" />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-transparent hover:bg-muted-foreground/20 transition-colors"
                onClick={onRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">{file.name}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {file && (
          <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
            <Button size="lg" className="px-8" onClick={onNext}>
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
