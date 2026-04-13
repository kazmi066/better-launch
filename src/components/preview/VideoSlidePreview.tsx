import React, { useRef, useEffect } from "react";
import type { VideoSlide } from "../../types";

interface Props {
  slide: VideoSlide;
  progress: number;
  isPlaying: boolean;
  isExporting?: boolean;
}

export const VideoSlidePreview: React.FC<Props> = ({
  slide,
  progress,
  isPlaying,
  isExporting = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !slide.videoUrl || !video.duration) return;

    if (isExporting) {
      video.currentTime = progress * video.duration;
      return;
    }

    if (!isPlaying) {
      video.currentTime = progress * video.duration;
    }
  }, [progress, isExporting, isPlaying, slide.videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !slide.videoUrl || isExporting) return;

    if (isPlaying) {
      if (video.duration) {
        video.currentTime = progress * video.duration;
      }
      video.play().catch(() => {});
      wasPlayingRef.current = true;
    } else {
      video.pause();
      wasPlayingRef.current = false;
    }
  }, [isPlaying, isExporting, slide.videoUrl]);

  if (!slide.videoUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-card">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No video selected</p>
          <p className="text-sm mt-1">
            Upload a video file in the properties panel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        src={slide.videoUrl}
        muted
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
};
