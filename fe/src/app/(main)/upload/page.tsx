import { useState } from "react";
import VideoUploadStep from "@/features/upload/components/VideoUploadStep";
import ScriptEditorStep from "@/features/upload/components/ScriptEditorStep";
import SegmentEditorStep, { ScriptSegment } from "@/features/upload/components/SegmentEditorStep";
import ThumbnailSelectorStep from "@/features/upload/components/ThumbnailSelectorStep";
import RecipeDetailsStep from "@/features/upload/components/RecipeDetailsStep";

type UploadStep = "upload" | "script" | "segments" | "thumbnail" | "details";

export default function Upload() {
  const [step, setStep] = useState<UploadStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fullScript, setFullScript] = useState("재료를 준비합니다. 손질한 재료를 넣고 조리합니다. 간을 맞추고 완성합니다.");
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl("");
    setStep("upload");
    setSegments([]);
  };

  const handleUploadNext = () => {
    if (!file) return;
    setStep("script");
  };

  const handleScriptBack = () => {
    setStep("upload");
  };

  const handleScriptNext = (splitPositions: number[]) => {
    const positions = [0, ...splitPositions, fullScript.length];
    const newSegments: ScriptSegment[] = [];

    for (let i = 0; i < positions.length - 1; i++) {
      const text = fullScript.slice(positions[i], positions[i + 1]).trim();
      if (text) {
        newSegments.push({
          id: String(i + 1),
          text: text,
        });
      }
    }

    setSegments(newSegments);
    setStep("segments");
  };

  const handleSegmentsBack = () => {
    setStep("script");
  };

  const handleSegmentsNext = (editedSegments: ScriptSegment[]) => {
    setSegments(editedSegments);
    setStep("thumbnail");
  };

  const handleThumbnailBack = () => {
    setStep("segments");
  };

  const handleThumbnailNext = (selectedTime: number, blob: Blob) => {
    setThumbnailTime(selectedTime);
    setThumbnailBlob(blob);
    setStep("details");
  };

  const handleDetailsBack = () => {
    setStep("thumbnail");
  };

  if (step === "upload") {
    return (
      <VideoUploadStep
        file={file}
        previewUrl={previewUrl}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        onNext={handleUploadNext}
      />
    );
  }

  if (step === "script") {
    return (
      <ScriptEditorStep
        file={file}
        previewUrl={previewUrl}
        script={fullScript}
        onBack={handleScriptBack}
        onNext={handleScriptNext}
      />
    );
  }

  if (step === "segments") {
    return (
      <SegmentEditorStep
        file={file}
        previewUrl={previewUrl}
        segments={segments}
        onBack={handleSegmentsBack}
        onNext={handleSegmentsNext}
      />
    );
  }

  if (step === "thumbnail") {
    return (
      <ThumbnailSelectorStep
        file={file}
        previewUrl={previewUrl}
        onBack={handleThumbnailBack}
        onNext={handleThumbnailNext}
      />
    );
  }

  return (
    <RecipeDetailsStep
      file={file}
      previewUrl={previewUrl}
      segments={segments}
      thumbnailTime={thumbnailTime}
      thumbnailBlob={thumbnailBlob}
      onBack={handleDetailsBack}
    />
  );
}
