import React from "react";
import { cn } from "../lib/utils";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className,
  title = "BetterLaunch",
}) => {
  const gradientId = React.useId();

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}>
      <defs>
        <linearGradient
          id={gradientId}
          x1="10"
          y1="9"
          x2="22"
          y2="23"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-mark-fill, #7dd3fc)" />
          <stop
            offset="1"
            stopColor="var(--brand-mark-detail, #c4b5fd)"
          />
        </linearGradient>
      </defs>
      <rect
        x="3.5"
        y="3.5"
        width="25"
        height="25"
        rx="7.5"
        stroke="currentColor"
      />
      <path d="M11 10.25v11.5l10-5.75-10-5.75Z" fill={`url(#${gradientId})`} />
      <path
        d="M8 7.75h4.25M19.75 7.75H24M8 24.25h4.25M19.75 24.25H24"
        stroke="var(--brand-mark-detail, #c4b5fd)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".75"
      />
    </svg>
  );
};

export const BrandLockup: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => (
  <div className="flex items-center gap-2.5">
    <div className="brand-mark-shell">
      <BrandMark className="h-5 w-5" />
    </div>
    {!compact && (
      <div className="leading-none">
        <div className="text-base font-semibold tracking-[-0.025em] text-foreground">
          BetterLaunch
        </div>
        <div className="mt-0.5 text-xs font-medium text-muted-foreground">
          Launch video studio
        </div>
      </div>
    )}
  </div>
);
