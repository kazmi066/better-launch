import React, { useRef, useCallback, useState } from "react";
import { useProjectStore } from "./store";
import type { ProjectSettings } from "./types";
import { SlideList } from "./components/Timeline";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Preview, type PreviewHandle } from "./components/Preview";
import { MusicTrack } from "./components/MusicTrack";
import { BrandLockup } from "./components/BrandMark";
import { LaunchIntro } from "./components/LaunchIntro";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Monitor,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Label } from "./components/ui/label";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./components/ui/tooltip";
import { exportVideo, downloadBlob, isWebCodecsSupported } from "./lib/export";

// ── Types ────────────────────────────────────────────────────────────

type ExportState =
  | { status: "idle" }
  | { status: "rendering"; percent: number; currentFrame: number }
  | { status: "done"; blob: Blob; duration: number }
  | { status: "error"; message: string };

// ── Small sub-components ─────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-border/80 bg-secondary/60 p-3">
    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-base font-medium text-foreground">{value}</p>
  </div>
);

const TransportControls: React.FC<{
  isPlaying: boolean;
  settings: ProjectSettings;
  totalSeconds: number;
  onTogglePlay: () => void;
  onRestart: () => void;
}> = ({ isPlaying, settings, totalSeconds, onTogglePlay, onRestart }) => (
  <div className="flex h-14 items-center justify-center gap-2">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRestart}
          aria-label="Restart video"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Restart</TooltipContent>
    </Tooltip>
    <Button
      size="icon"
      onClick={onTogglePlay}
      aria-label={isPlaying ? "Pause video" : "Play video"}
      className="brand-button h-10 w-10 rounded-full">
      {isPlaying ? (
        <Pause className="w-3.5 h-3.5" />
      ) : (
        <Play className="ml-0.5 w-3.5 h-3.5" />
      )}
    </Button>
    <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
      <Monitor className="w-3.5 h-3.5" />
      <span>
        {settings.width}×{settings.height} · {settings.fps}fps ·{" "}
        {totalSeconds.toFixed(1)}s
      </span>
    </div>
  </div>
);

const ExportActions: React.FC<{
  state: ExportState;
  totalFrames: number;
  onExport: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onReset: () => void;
}> = ({ state, totalFrames, onExport, onCancel, onDownload, onReset }) => {
  switch (state.status) {
    case "idle":
      return (
        <Button
          className="w-full"
          onClick={onExport}
          disabled={!isWebCodecsSupported() || totalFrames === 0}>
          <Download className="w-4 h-4 mr-2" />
          Render MP4
        </Button>
      );
    case "rendering":
      return (
        <Button variant="outline" className="w-full" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel Export
        </Button>
      );
    case "done":
      return (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download MP4
          </Button>
          <Button variant="outline" onClick={onReset}>
            Re-export
          </Button>
        </div>
      );
    case "error":
      return (
        <Button variant="outline" className="w-full" onClick={onReset}>
          Try Again
        </Button>
      );
  }
};

const ExportStatusBanner: React.FC<{
  state: ExportState;
  totalFrames: number;
}> = ({ state, totalFrames }) => {
  switch (state.status) {
    case "rendering":
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Rendering frame {state.currentFrame} of {totalFrames}
            </span>
            <span className="text-foreground font-medium tabular-nums">
              {state.percent}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-foreground h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${state.percent}%` }}
            />
          </div>
        </div>
      );
    case "done":
      return (
        <div className="flex items-start gap-2 bg-success/10 border border-success/20 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
          <div className="text-xs text-success">
            <p className="font-medium">Export complete!</p>
            <p className="mt-0.5 opacity-80">
              Rendered in {state.duration.toFixed(1)}s ·{" "}
              {(state.blob.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        </div>
      );
    case "error":
      return (
        <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive">{state.message}</p>
        </div>
      );
    default:
      return null;
  }
};

// ── Dialogs ──────────────────────────────────────────────────────────

const ExportDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ProjectSettings;
  totalFrames: number;
  totalSeconds: number;
  exportState: ExportState;
  onExport: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onReset: () => void;
}> = ({
  open,
  onOpenChange,
  settings,
  totalFrames,
  totalSeconds,
  exportState,
  onExport,
  onCancel,
  onDownload,
  onReset,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Render video
        </DialogTitle>
        <DialogDescription>
          Turn this story into a polished, shareable MP4.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Resolution"
            value={`${settings.width}×${settings.height}`}
          />
          <StatCard label="Frame Rate" value={`${settings.fps} fps`} />
          <StatCard label="Duration" value={`${totalSeconds.toFixed(1)}s`} />
          <StatCard label="Total Frames" value={String(totalFrames)} />
        </div>
        <div className="flex items-start gap-2 bg-secondary rounded-lg p-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            H.264 High Profile · 20 Mbps · MP4 container · Rendered
            frame-by-frame at full resolution using WebCodecs.
          </p>
        </div>
        {!isWebCodecsSupported() && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              WebCodecs is not supported in this browser. Please use Chrome 94+
              or Edge 94+.
            </p>
          </div>
        )}
        <ExportStatusBanner state={exportState} totalFrames={totalFrames} />
        <ExportActions
          state={exportState}
          totalFrames={totalFrames}
          onExport={onExport}
          onCancel={onCancel}
          onDownload={onDownload}
          onReset={onReset}
        />
      </div>
    </DialogContent>
  </Dialog>
);

const SettingsDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ProjectSettings;
  onSettingsChange: (patch: Partial<ProjectSettings>) => void;
}> = ({ open, onOpenChange, settings, onSettingsChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Project settings
        </DialogTitle>
        <DialogDescription>Choose the format for your final cut.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select
            value={`${settings.width}x${settings.height}`}
            onValueChange={(v) => {
              const [w, h] = v.split("x").map(Number);
              if (w && h) onSettingsChange({ width: w, height: h });
            }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1920x1080">1920×1080 (Full HD)</SelectItem>
              <SelectItem value="1280x720">1280×720 (HD)</SelectItem>
              <SelectItem value="3840x2160">3840×2160 (4K)</SelectItem>
              <SelectItem value="1080x1920">1080×1920 (Vertical)</SelectItem>
              <SelectItem value="1080x1080">1080×1080 (Square)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Frame Rate</Label>
          <Select
            value={String(settings.fps)}
            onValueChange={(v) => onSettingsChange({ fps: Number(v) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 fps (Cinema)</SelectItem>
              <SelectItem value="30">30 fps (Standard)</SelectItem>
              <SelectItem value="60">60 fps (Smooth)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// ── Main App ─────────────────────────────────────────────────────────

function App() {
  const settings = useProjectStore((s) => s.settings);
  const setSettings = useProjectStore((s) => s.setSettings);
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const setCurrentTime = useProjectStore((s) => s.setCurrentTime);

  const previewRef = useRef<PreviewHandle>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({
    status: "idle",
  });

  const totalSeconds = useProjectStore((s) => s.totalDurationSeconds());
  const totalFrames = useProjectStore((s) => s.totalDurationFrames());

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      previewRef.current?.pause();
    } else {
      previewRef.current?.play();
    }
  }, [isPlaying]);

  const restart = useCallback(() => {
    previewRef.current?.pause();
    setCurrentTime(0);
    previewRef.current?.play();
  }, [setCurrentTime]);

  const handleExport = useCallback(async () => {
    previewRef.current?.pause();

    const ac = new AbortController();
    abortRef.current = ac;
    setExportState({ status: "rendering", percent: 0, currentFrame: 0 });
    const startTime = Date.now();

    const storeSnapshot = useProjectStore.getState();
    const slidesSnapshot = storeSnapshot.slides;
    const audioTrackSnapshot = storeSnapshot.audioTrack;

    try {
      const blob = await exportVideo({
        slides: slidesSnapshot,
        settings,
        audioTrack: audioTrackSnapshot,
        onProgress: (percent, cf) =>
          setExportState({ status: "rendering", percent, currentFrame: cf }),
        signal: ac.signal,
      });
      setExportState({
        status: "done",
        blob,
        duration: (Date.now() - startTime) / 1000,
      });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setExportState({ status: "idle" });
      } else {
        setExportState({
          status: "error",
          message: e instanceof Error ? e.message : "Export failed",
        });
      }
    } finally {
      abortRef.current = null;
    }
  }, [settings]);

  const cancelExport = useCallback(() => abortRef.current?.abort(), []);

  const handleDownload = useCallback(() => {
    if (exportState.status === "done")
      downloadBlob(exportState.blob, "launch-video.mp4");
  }, [exportState]);

  const handleExportOpenChange = useCallback(
    (open: boolean) => {
      if (!open && exportState.status === "rendering") return;
      setShowExport(open);
      if (!open) setExportState({ status: "idle" });
    },
    [exportState.status],
  );

  return (
    <TooltipProvider>
      <div className="app-shell h-screen overflow-hidden bg-background">
        <LaunchIntro />

        <header className="app-header">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLockup />
            <div className="hidden h-6 w-px bg-border lg:block" />
            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <span className="text-xs text-muted-foreground">Projects</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <span className="max-w-52 truncate text-xs font-medium text-foreground/85">
                Untitled launch
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="mr-1 hidden items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Local render
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-10 rounded-lg px-3 text-sm text-muted-foreground">
              <Settings className="w-3.5 h-3.5 mr-1" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={() => setShowExport(true)}
              className="brand-button h-10 rounded-lg px-4 text-sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              Render video
            </Button>
          </div>
        </header>

        <main className="app-workspace">
          <aside className="app-sidebar app-sidebar--left">
            <SlideList />
          </aside>

          <section className="app-stage">
            <Preview ref={previewRef} />
          </section>

          <aside className="app-sidebar app-sidebar--right">
            <PropertiesPanel />
          </aside>
        </main>

        <div className="app-audio">
          <MusicTrack />
        </div>

        <div className="app-transport">
          <TransportControls
            isPlaying={isPlaying}
            settings={settings}
            totalSeconds={totalSeconds}
            onTogglePlay={togglePlay}
            onRestart={restart}
          />
        </div>

        <ExportDialog
          open={showExport}
          onOpenChange={handleExportOpenChange}
          settings={settings}
          totalFrames={totalFrames}
          totalSeconds={totalSeconds}
          exportState={exportState}
          onExport={handleExport}
          onCancel={cancelExport}
          onDownload={handleDownload}
          onReset={() => setExportState({ status: "idle" })}
        />

        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
