import React, { useCallback } from "react";
import { useProjectStore } from "../../store";
import type {
  StandardSlide,
  TextAnimationType,
  TextPosition,
  BackgroundType,
  BackgroundMotionDirection,
} from "../../types";
import {
  PROCEDURAL_BACKGROUND_OPTIONS,
  TEXT_ANIMATION_OPTIONS,
} from "../../types";
import { RefreshCw, Upload, X } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PositionGrid } from "../PositionGrid";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

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
        style={{ backgroundColor: value }}
      >
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
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

export const StandardSlideProps: React.FC<{ slide: StandardSlide }> = ({
  slide,
}) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const u = useCallback(
    (patch: Partial<StandardSlide>) => updateSlide(slide.id, patch),
    [slide.id, updateSlide],
  );
  const proceduralOption = PROCEDURAL_BACKGROUND_OPTIONS.find(
    (option) => option.value === slide.backgroundType,
  );
  const isProcedural = proceduralOption !== undefined;

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
          onValueChange={(v) => u({ textAnimation: v as TextAnimationType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_ANIMATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                <div>
                  <span>{o.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {o.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="space-y-2">
        <Label>Text Position</Label>
        <PositionGrid
          value={slide.textPosition}
          onChange={(pos: TextPosition) => u({ textPosition: pos })}
        />
      </div>

      <Field label="Font Size">
        <div className="flex items-center gap-3">
          <Slider
            min={24}
            max={160}
            step={2}
            value={[slide.fontSize]}
            onValueChange={([v]) => {
              if (v !== undefined) u({ fontSize: v });
            }}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
            {slide.fontSize}px
          </span>
        </div>
      </Field>

      <Field label="Duration">
        <div className="flex items-center gap-3">
          <Slider
            min={1}
            max={15}
            step={0.5}
            value={[slide.durationSeconds]}
            onValueChange={([v]) => {
              if (v !== undefined) u({ durationSeconds: v });
            }}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
            {slide.durationSeconds.toFixed(1)}s
          </span>
        </div>
      </Field>

      <Field label="Hold Delay">
        <div className="flex items-center gap-3">
          <Slider
            min={0}
            max={10}
            step={0.5}
            value={[slide.delaySeconds]}
            onValueChange={([v]) => {
              if (v !== undefined) u({ delaySeconds: v });
            }}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
            {slide.delaySeconds.toFixed(1)}s
          </span>
        </div>
      </Field>

      <Separator />

      <div className="space-y-2">
        <Label>Background</Label>
        <Select
          value={slide.backgroundType}
          onValueChange={(value) => {
            const backgroundType = value as BackgroundType;
            const enablingProcedural = PROCEDURAL_BACKGROUND_OPTIONS.some(
              (option) => option.value === backgroundType,
            );
            u({
              backgroundType,
              ...(enablingProcedural &&
              !isProcedural &&
              slide.backgroundColor === "#09090b"
                ? { backgroundColor: "#0b1020" }
                : {}),
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Solid Color</SelectItem>
            {PROCEDURAL_BACKGROUND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {slide.backgroundType === "color" && (
        <ColorField
          label="Background Color"
          value={slide.backgroundColor}
          onChange={(v) => u({ backgroundColor: v })}
        />
      )}

      {slide.backgroundType === "image" && (
        <Field label="Background Image">
          <FileUploadButton
            accept="image/*"
            label="Choose image..."
            fileName={slide.backgroundImageFileName}
            onFile={(url, name) =>
              u({ backgroundImageUrl: url, backgroundImageFileName: name })
            }
            onClear={() =>
              u({ backgroundImageUrl: "", backgroundImageFileName: "" })
            }
          />
        </Field>
      )}

      {slide.backgroundType === "video" && (
        <Field label="Background Video">
          <FileUploadButton
            accept=".mp4,.mov,.webm"
            label="Choose video..."
            fileName={slide.backgroundVideoFileName}
            onFile={(url, name) =>
              u({ backgroundVideoUrl: url, backgroundVideoFileName: name })
            }
            onClear={() =>
              u({ backgroundVideoUrl: "", backgroundVideoFileName: "" })
            }
          />
        </Field>
      )}

      {isProcedural && (
        <div className="space-y-5 rounded-xl border border-brand/20 bg-brand/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {proceduralOption.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {proceduralOption.description}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-xs text-brand">
              Full quality
            </span>
          </div>

          <ColorField
            label="Base Color"
            value={slide.backgroundColor}
            onChange={(value) => u({ backgroundColor: value })}
          />
          <ColorField
            label="Sky Color"
            value={slide.backgroundSecondaryColor}
            onChange={(value) => u({ backgroundSecondaryColor: value })}
          />
          <ColorField
            label="Violet Color"
            value={slide.backgroundAccentColor}
            onChange={(value) => u({ backgroundAccentColor: value })}
          />

          <Field label="Motion Energy">
            <div className="flex items-center gap-3">
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[slide.backgroundEnergy]}
                onValueChange={([value]) => {
                  if (value !== undefined) u({ backgroundEnergy: value });
                }}
                className="flex-1"
              />
              <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                {Math.round(slide.backgroundEnergy * 100)}%
              </span>
            </div>
          </Field>

          <Field label="Field Scale">
            <div className="flex items-center gap-3">
              <Slider
                min={0.7}
                max={1.4}
                step={0.05}
                value={[slide.backgroundScale]}
                onValueChange={([value]) => {
                  if (value !== undefined) u({ backgroundScale: value });
                }}
                className="flex-1"
              />
              <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                {Math.round(slide.backgroundScale * 100)}%
              </span>
            </div>
          </Field>

          <Field label="Flow Direction">
            <Select
              value={slide.backgroundDirection}
              onValueChange={(value) =>
                u({
                  backgroundDirection: value as BackgroundMotionDirection,
                })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forward">Forward</SelectItem>
                <SelectItem value="reverse">Reverse</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Variation</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Deterministic seed {slide.backgroundSeed}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                u({
                  backgroundSeed:
                    (Math.trunc(slide.backgroundSeed) + 1) % 10_000,
                })
              }
              className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              New variation
            </Button>
          </div>
        </div>
      )}

      <Separator />

      <ColorField
        label="Text Color"
        value={slide.textColor}
        onChange={(v) => u({ textColor: v })}
      />
    </div>
  );
};
