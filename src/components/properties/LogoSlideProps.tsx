import React, { useCallback } from "react";
import { useProjectStore } from "../../store";
import type { LogoSlide, LogoAnimationType } from "../../types";
import { LOGO_ANIMATION_OPTIONS } from "../../types";
import { Upload, X, Sparkles } from "lucide-react";
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

export const LogoSlideProps: React.FC<{ slide: LogoSlide }> = ({ slide }) => {
  const updateSlide = useProjectStore((s) => s.updateSlide);
  const u = useCallback(
    (patch: Partial<LogoSlide>) => updateSlide(slide.id, patch),
    [updateSlide, slide.id],
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputEl = e.target;
      const file = inputEl.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      u({ logoImageUrl: url, logoFileName: file.name });
      // Reset so re-selecting the same file fires change again.
      inputEl.value = "";
    },
    [u],
  );

  const handleClear = useCallback(() => {
    u({ logoImageUrl: "", logoFileName: "" });
  }, [u]);

  return (
    <div className="space-y-5">
      <Field label="Label">
        <Input
          value={slide.label}
          onChange={(e) => u({ label: e.target.value })}
          placeholder="Brand Logo"
        />
      </Field>

      <Field label="Logo Image">
        <div className="flex items-center gap-2">
          <label className="flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-dashed border-input hover:border-foreground/30 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate text-xs">
              {slide.logoFileName || "Upload logo (PNG, SVG, JPG)"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          {slide.logoFileName && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Tip: use a transparent PNG or SVG so the logo blends with the
          background.
        </p>
      </Field>

      <Field label="Caption (optional)">
        <Input
          value={slide.caption}
          onChange={(e) => u({ caption: e.target.value })}
          placeholder="Tagline, brand name, or call-to-action"
        />
      </Field>

      {slide.caption && (
        <Field label="Caption Size">
          <div className="flex items-center gap-3">
            <Slider
              min={14}
              max={72}
              step={2}
              value={[slide.captionFontSize]}
              onValueChange={([v]) => {
                if (v !== undefined) u({ captionFontSize: v });
              }}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
              {slide.captionFontSize}px
            </span>
          </div>
        </Field>
      )}

      <Field label="Logo Size">
        <div className="flex items-center gap-3">
          <Slider
            min={0.1}
            max={0.6}
            step={0.02}
            value={[slide.logoSize]}
            onValueChange={([v]) => {
              if (v !== undefined) u({ logoSize: v });
            }}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
            {Math.round(slide.logoSize * 100)}%
          </span>
        </div>
      </Field>

      <Field label="Animation">
        <Select
          value={slide.animation}
          onValueChange={(v) => u({ animation: v as LogoAnimationType })}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {LOGO_ANIMATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Duration">
        <div className="flex items-center gap-3">
          <Slider
            min={1}
            max={10}
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

      <ColorField
        label="Background"
        value={slide.backgroundColor}
        onChange={(v) => u({ backgroundColor: v })}
      />

      <ColorField
        label="Caption Color"
        value={slide.textColor}
        onChange={(v) => u({ textColor: v })}
      />
    </div>
  );
};
