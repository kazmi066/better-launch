import React, { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

const INTRO_DURATION_MS = 1650;

export const LaunchIntro: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="launch-intro" aria-hidden="true">
      <div className="launch-intro__lockup">
        <div className="launch-intro__mark">
          <BrandMark className="h-12 w-12" title="" />
        </div>
        <div className="launch-intro__wordmark">BetterLaunch</div>
        <div className="launch-intro__rule" />
      </div>
    </div>
  );
};
