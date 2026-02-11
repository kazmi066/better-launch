import React, { useCallback } from "react";
import { useProjectStore } from "../store";
import type { Slide, TransitionType, TextAnimation } from "../types";
import { TRANSITION_OPTIONS, TEXT_ANIMATION_OPTIONS } from "../types";
import { Upload, X } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const DurationSlider: React.FC<{
  value: number;
  fps: number;
  onChange: (frames: number) => void;
}> = ({ value, fps, onChange }) => {
  const seconds = value / fps;
  return (
    <div className="flex items-center gap-3">
      <Slider
        min={fps}
        max={fps * 15}
        step={Math.round(fps / 2)}
        value={[value]}
        onValueChange={([v]) => {
          if (v !== undefined) onChange(v);
        }}
        className="flex-1"
      />
      <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
        {seconds.toFixed(1)}s
      </span>
    </div>
  );
};

const FileUploadButton: React.FC<{
  accept: string;
  label: string;
  fileName: string;
  onFile: (url: string, fileName: string) => void;
  onClear: () => void;
}> = ({ accept, label, fileName, onFile, onClear }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        onFile(url, file.name);
      }
    },
    [onFile],
  );

  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-dashed border-input hover:border-foreground/30 cursor-pointer transition-colors">
        <Upload className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground truncate text-xs">
          {fileName || label}
        </span>
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </label>
      {fileName && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-md border border-input cursor-pointer relative overflow-hidden"
        style={{ backgroundColor: value }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs font-mono"
      />
    </div>
  </div>
);

const IntroProperties: React.FC<{
  slide: Extract<Slide, { type: "intro" }>;
}> = ({ slide }) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const settings = useProjectStore((s) => s.settings);
  const u = (patch: Partial<typeof slide>) => updateSlide(slide.id, patch);

  return (
    <div className="space-y-5">
      <Field label="Product Name">
        <Input
          value={slide.productName}
          onChange={(e) => u({ productName: e.target.value })}
          placeholder="Your Product"
        />
      </Field>
      <Field label="Tagline">
        <Input
          value={slide.tagline}
          onChange={(e) => u({ tagline: e.target.value })}
          placeholder="The future starts here"
        />
      </Field>
      <Field label="Subtitle">
        <Input
          value={slide.subtitle}
          onChange={(e) => u({ subtitle: e.target.value })}
          placeholder="Built for developers"
        />
      </Field>
      <Field label="Text Animation">
        <Select
          value={slide.textAnimation}
          onValueChange={(v) => u({ textAnimation: v as TextAnimation })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_ANIMATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Duration">
        <DurationSlider
          value={slide.durationFrames}
          fps={settings.fps}
          onChange={(v) => u({ durationFrames: v })}
        />
      </Field>

      <Separator />

      <div className="grid grid-cols-3 gap-3">
        <ColorField
          label="BG"
          value={slide.backgroundColor}
          onChange={(v) => u({ backgroundColor: v })}
        />
        <ColorField
          label="Text"
          value={slide.textColor}
          onChange={(v) => u({ textColor: v })}
        />
        <ColorField
          label="Accent"
          value={slide.accentColor}
          onChange={(v) => u({ accentColor: v })}
        />
      </div>
    </div>
  );
};

const TextProperties: React.FC<{
  slide: Extract<Slide, { type: "text" }>;
}> = ({ slide }) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const settings = useProjectStore((s) => s.settings);
  const u = (patch: Partial<typeof slide>) => updateSlide(slide.id, patch);

  return (
    <div className="space-y-5">
      <Field label="Heading">
        <Input
          value={slide.heading}
          onChange={(e) => u({ heading: e.target.value })}
          placeholder="Your Heading Here"
        />
      </Field>
      <Field label="Subheading">
        <Input
          value={slide.subheading}
          onChange={(e) => u({ subheading: e.target.value })}
          placeholder="Optional subheading"
        />
      </Field>
      <Field label="Text Animation">
        <Select
          value={slide.textAnimation}
          onValueChange={(v) => u({ textAnimation: v as TextAnimation })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_ANIMATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Transition">
        <Select
          value={slide.transition}
          onValueChange={(v) => u({ transition: v as TransitionType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSITION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Duration">
        <DurationSlider
          value={slide.durationFrames}
          fps={settings.fps}
          onChange={(v) => u({ durationFrames: v })}
        />
      </Field>

      <Separator />

      <div className="grid grid-cols-3 gap-3">
        <ColorField
          label="BG"
          value={slide.backgroundColor}
          onChange={(v) => u({ backgroundColor: v })}
        />
        <ColorField
          label="Text"
          value={slide.textColor}
          onChange={(v) => u({ textColor: v })}
        />
        <ColorField
          label="Accent"
          value={slide.accentColor}
          onChange={(v) => u({ accentColor: v })}
        />
      </div>
    </div>
  );
};

const ClipProperties: React.FC<{
  slide: Extract<Slide, { type: "clip" }>;
}> = ({ slide }) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const settings = useProjectStore((s) => s.settings);
  const u = (patch: Partial<typeof slide>) => updateSlide(slide.id, patch);

  return (
    <div className="space-y-5">
      <Field label="Label">
        <Input
          value={slide.label}
          onChange={(e) => u({ label: e.target.value })}
          placeholder="Demo Clip"
        />
      </Field>
      <Field label="Video File">
        <FileUploadButton
          accept=".mp4,.mov,.webm,.avi,.mkv,.m4v,.ogv"
          label="Browse video (.mp4, .mov, .webm ...)"
          fileName={slide.videoFileName}
          onFile={(url, name) => u({ videoUrl: url, videoFileName: name })}
          onClear={() => u({ videoUrl: "", videoFileName: "" })}
        />
      </Field>
      <Field label="Transition">
        <Select
          value={slide.transition}
          onValueChange={(v) => u({ transition: v as TransitionType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSITION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Duration">
        <DurationSlider
          value={slide.durationFrames}
          fps={settings.fps}
          onChange={(v) => u({ durationFrames: v })}
        />
      </Field>
      <div className="flex items-center justify-between">
        <Label className="normal-case tracking-normal text-sm text-foreground">
          Slow Zoom Effect
        </Label>
        <Switch
          checked={slide.zoomEffect}
          onCheckedChange={(v) => u({ zoomEffect: v })}
        />
      </div>
    </div>
  );
};

const OutroProperties: React.FC<{
  slide: Extract<Slide, { type: "outro" }>;
}> = ({ slide }) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const settings = useProjectStore((s) => s.settings);
  const u = (patch: Partial<typeof slide>) => updateSlide(slide.id, patch);

  return (
    <div className="space-y-5">
      <Field label="Logo">
        <FileUploadButton
          accept="image/*"
          label="Choose logo image..."
          fileName={slide.logoFileName}
          onFile={(url, name) => u({ logoUrl: url, logoFileName: name })}
          onClear={() => u({ logoUrl: "", logoFileName: "" })}
        />
      </Field>
      <Field label="Tagline">
        <Input
          value={slide.tagline}
          onChange={(e) => u({ tagline: e.target.value })}
          placeholder="Try it today."
        />
      </Field>
      <Field label="Text Animation">
        <Select
          value={slide.textAnimation}
          onValueChange={(v) => u({ textAnimation: v as TextAnimation })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_ANIMATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Duration">
        <DurationSlider
          value={slide.durationFrames}
          fps={settings.fps}
          onChange={(v) => u({ durationFrames: v })}
        />
      </Field>

      <Separator />

      <div className="grid grid-cols-3 gap-3">
        <ColorField
          label="BG"
          value={slide.backgroundColor}
          onChange={(v) => u({ backgroundColor: v })}
        />
        <ColorField
          label="Text"
          value={slide.textColor}
          onChange={(v) => u({ textColor: v })}
        />
        <ColorField
          label="Accent"
          value={slide.accentColor}
          onChange={(v) => u({ accentColor: v })}
        />
      </div>
    </div>
  );
};

export const PropertiesPanel: React.FC = () => {
  const slides = useProjectStore((s) => s.slides);
  const selectedSlideId = useProjectStore((s) => s.selectedSlideId);
  const slide = slides.find((s) => s.id === selectedSlideId);

  if (!slide) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
        <p>Select a slide from the timeline to edit its properties</p>
      </div>
    );
  }

  const typeLabel: Record<string, string> = {
    intro: "Intro Slide",
    text: "Text Slide",
    clip: "Video Clip",
    outro: "Outro Slide",
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3">
        <h2 className="text-[13px] font-semibold text-foreground">
          {typeLabel[slide.type] || "Properties"}
        </h2>
        <p className="text-[11px] text-muted-foreground">Edit slide settings</p>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-4">
        {slide.type === "intro" && <IntroProperties slide={slide} />}
        {slide.type === "text" && <TextProperties slide={slide} />}
        {slide.type === "clip" && <ClipProperties slide={slide} />}
        {slide.type === "outro" && <OutroProperties slide={slide} />}
      </div>
    </div>
  );
};
