import React, {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
} from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useProjectStore } from "./store";
import type { ProjectSettings } from "./types";
import { VideoComposition } from "./remotion/VideoComposition";
import { Timeline } from "./components/Timeline";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { formatTime } from "./lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Monitor,
  Clapperboard,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
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

type ExportState =
  | { status: "idle" }
  | { status: "rendering"; percent: number; currentFrame: number }
  | { status: "done"; blob: Blob; duration: number }
  | { status: "error"; message: string };

const StatCard: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="bg-secondary rounded-lg p-3">
    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
    <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
  </div>
);

const SeekBar: React.FC<{
  currentFrame: number;
  totalFrames: number;
  fps: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ currentFrame, totalFrames, fps, onSeek }) => (
  <div className="flex items-center gap-3 mt-3">
    <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
      {formatTime(currentFrame, fps)}
    </span>
    <input
      type="range"
      min={0}
      max={Math.max(1, totalFrames - 1)}
      value={currentFrame}
      onChange={onSeek}
      className="flex-1 h-1.5 appearance-none bg-secondary rounded-full cursor-pointer accent-foreground [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer"
    />
    <span className="text-[11px] text-muted-foreground tabular-nums w-12">
      {formatTime(totalFrames, fps)}
    </span>
  </div>
);

const TransportControls: React.FC<{
  isPlaying: boolean;
  settings: ProjectSettings;
  totalFrames: number;
  onTogglePlay: () => void;
  onRestart: () => void;
}> = ({ isPlaying, settings, totalFrames, onTogglePlay, onRestart }) => (
  <div className="flex items-center justify-center gap-2 mt-2">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRestart}
          className="h-9 w-9 text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Restart</TooltipContent>
    </Tooltip>
    <Button
      size="icon"
      onClick={onTogglePlay}
      className="h-10 w-10 rounded-full">
      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
    </Button>
    <div className="flex items-center gap-1.5 ml-2 text-xs text-muted-foreground tabular-nums">
      <Monitor className="w-3.5 h-3.5" />
      <span>
        {settings.width}×{settings.height} · {settings.fps}fps ·{" "}
        {(totalFrames / settings.fps).toFixed(1)}s
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
          Export as MP4
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

const ExportDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ProjectSettings;
  totalFrames: number;
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
          Export Video
        </DialogTitle>
        <DialogDescription>
          Render and download your launch video as MP4
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Resolution"
            value={`${settings.width}×${settings.height}`}
          />
          <StatCard label="Frame Rate" value={`${settings.fps} fps`} />
          <StatCard
            label="Duration"
            value={`${(totalFrames / settings.fps).toFixed(1)}s`}
          />
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
          Project Settings
        </DialogTitle>
        <DialogDescription>Configure video output settings</DialogDescription>
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

function App() {
  const slides = useProjectStore((s) => s.slides);
  const settings = useProjectStore((s) => s.settings);
  const setSettings = useProjectStore((s) => s.setSettings);
  const playerRef = useRef<PlayerRef>(null);
  const exportPlayerRef = useRef<PlayerRef>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({
    status: "idle",
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const poll = () => {
      if (playerRef.current)
        setCurrentFrame(playerRef.current.getCurrentFrame());
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const totalFrames = useMemo(
    () => slides.reduce((sum, s) => sum + s.durationFrames, 0),
    [slides],
  );

  const inputProps = useMemo(() => ({ slides }), [slides]);

  const handleExport = useCallback(async () => {
    if (!exportPlayerRef.current || !exportContainerRef.current) return;
    const ac = new AbortController();
    abortRef.current = ac;
    setExportState({ status: "rendering", percent: 0, currentFrame: 0 });
    const startTime = Date.now();
    try {
      exportPlayerRef.current.pause();
      const playerContent = exportContainerRef.current.querySelector(
        "[data-remotion-player-content]",
      ) as HTMLElement | null;
      const blob = await exportVideo({
        container: playerContent ?? exportContainerRef.current,
        width: settings.width,
        height: settings.height,
        fps: settings.fps,
        totalFrames: Math.max(1, totalFrames),
        seekTo: (frame) => exportPlayerRef.current?.seekTo(frame),
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
  }, [settings, totalFrames]);

  const cancelExport = useCallback(() => abortRef.current?.abort(), []);

  const handleDownload = useCallback(() => {
    if (exportState.status === "done")
      downloadBlob(exportState.blob, "launch-video.mp4");
  }, [exportState]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pause() : playerRef.current.play();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const restart = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = Number(e.target.value);
    playerRef.current?.seekTo(frame);
    setCurrentFrame(frame);
  }, []);

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
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <header className="flex items-center justify-between h-12 px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                BetterLaunchs
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs text-muted-foreground">
              Launch Video Maker
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-8 text-xs text-muted-foreground">
              <Settings className="w-3.5 h-3.5 mr-1" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={() => setShowExport(true)}
              className="h-8 text-xs">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="w-72 border-r border-border shrink-0 overflow-hidden bg-card">
            <Timeline />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
              <div className="w-full max-w-4xl">
                <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                  {totalFrames > 0 ? (
                    <Player
                      ref={playerRef}
                      component={VideoComposition}
                      inputProps={inputProps}
                      durationInFrames={Math.max(1, totalFrames)}
                      compositionWidth={settings.width}
                      compositionHeight={settings.height}
                      fps={settings.fps}
                      style={{
                        width: "100%",
                        aspectRatio: `${settings.width} / ${settings.height}`,
                      }}
                      acknowledgeRemotionLicense
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center bg-card text-muted-foreground text-sm"
                      style={{
                        aspectRatio: `${settings.width} / ${settings.height}`,
                      }}>
                      Add slides to preview your video
                    </div>
                  )}
                </div>
                {totalFrames > 0 && (
                  <SeekBar
                    currentFrame={currentFrame}
                    totalFrames={totalFrames}
                    fps={settings.fps}
                    onSeek={handleSeek}
                  />
                )}
                <TransportControls
                  isPlaying={isPlaying}
                  settings={settings}
                  totalFrames={totalFrames}
                  onTogglePlay={togglePlay}
                  onRestart={restart}
                />
              </div>
            </div>
          </div>

          <div className="w-80 border-l border-border shrink-0 overflow-hidden bg-card">
            <PropertiesPanel />
          </div>
        </div>

        {showExport && totalFrames > 0 && (
          <div
            ref={exportContainerRef}
            style={{
              position: "fixed",
              left: "-99999px",
              top: 0,
              width: settings.width,
              height: settings.height,
              overflow: "hidden",
            }}>
            <Player
              ref={exportPlayerRef}
              component={VideoComposition}
              inputProps={inputProps}
              durationInFrames={Math.max(1, totalFrames)}
              compositionWidth={settings.width}
              compositionHeight={settings.height}
              fps={settings.fps}
              style={{ width: settings.width, height: settings.height }}
              acknowledgeRemotionLicense
            />
          </div>
        )}

        <ExportDialog
          open={showExport}
          onOpenChange={handleExportOpenChange}
          settings={settings}
          totalFrames={totalFrames}
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
