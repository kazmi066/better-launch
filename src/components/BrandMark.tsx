import React from "react";
import { cn } from "../lib/utils";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className,
  title = "BetterLaunch",
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    role="img"
    aria-label={title}
    className={cn("shrink-0", className)}>
    <path
      d="M19.25 7.25H12.2a4.2 4.2 0 0 0-4.2 4.2v9.3a4.2 4.2 0 0 0 4.2 4.2h7.6a4.2 4.2 0 0 0 4.2-4.2V15"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M13.15 12.2v7.6c0 .5.55.8.96.52l6.05-3.8a.64.64 0 0 0 0-1.04l-6.05-3.8a.64.64 0 0 0-.96.52Z"
      fill="currentColor"
    />
  </svg>
);

export const BrandLockup: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => (
  <div className="flex items-center gap-2.5">
    <div className="brand-mark-shell">
      <BrandMark className="h-5 w-5" />
    </div>
    {!compact && (
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">
          BetterLaunch
        </div>
        <div className="mt-1 text-xs font-medium text-muted-foreground">
          Launch video studio
        </div>
      </div>
    )}
  </div>
);
