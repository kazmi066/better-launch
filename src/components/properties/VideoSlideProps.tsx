import React, { useCallback } from "react";
import { useProjectStore } from "../../store";
import type { VideoSlide } from "../../types";
import { Upload, X, Clock } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

function probeVideoDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve(video.duration);
      video.src = "";
    };
    video.onerror = () => reject(new Error("Could not read video metadata"));
    video.src = url;
  });
}

export const VideoSlideProps: React.FC<{ slide: VideoSlide }> = ({ slide }) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const u = (patch: Partial<VideoSlide>) => updateSlide(slide.id, patch);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      try {
        const duration = await probeVideoDuration(url);
        u({
          videoUrl: url,
          videoFileName: file.name,
          durationSeconds: Math.round(duration * 10) / 10,
        });
      } catch {
        u({ videoUrl: url, videoFileName: file.name });
      }
    },
    [u],
  );

  const handleClear = useCallback(() => {
    u({ videoUrl: "", videoFileName: "", durationSeconds: 0 });
  }, [u]);

  return (
    <div className="space-y-5">
      <Field label="Label">
        <Input
          value={slide.label}
          onChange={(e) => u({ label: e.target.value })}
          placeholder="Video Clip"
        />
      </Field>

      <Field label="Video File">
        <div className="flex items-center gap-2">
          <label className="flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-dashed border-input hover:border-foreground/30 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate text-xs">
              {slide.videoFileName || "Browse video (.mp4, .mov, .webm ...)"}
            </span>
            <input
              type="file"
              accept=".mp4,.mov,.webm,.avi,.mkv,.m4v,.ogv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          {slide.videoFileName && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </Field>

      {slide.durationSeconds > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Duration:{" "}
            <strong className="text-foreground">
              {slide.durationSeconds.toFixed(1)}s
            </strong>{" "}
            (from source video)
          </span>
        </div>
      )}
    </div>
  );
};
