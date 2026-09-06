"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CROWD_COLORS } from "@/lib/constants";
import { CrowdLevel } from "@/lib/types";

export interface CrowdIndicatorProps {
  level: CrowdLevel;
  count?: number;
  capacity?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

const LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;

const CrowdIndicator = forwardRef<HTMLDivElement, CrowdIndicatorProps>(
  (
    {
      level,
      count,
      capacity,
      showLabel = true,
      showPercentage = false,
      size = "md",
      className,
    },
    ref
  ) => {
    const colors = CROWD_COLORS[level];
    const iconSize = SIZE_CLASS[size];
    const percentage = count && capacity ? Math.round((count / capacity) * 100) : 0;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2",
          className
        )}
      >
        <div
          className={cn(
            "rounded-full",
            iconSize,
            level === "low" && colors.bg,
            level === "medium" && colors.bg,
            level === "high" && colors.bg,
            level === "critical" && colors.bg,
            "transition-all duration-300"
          )}
        >
          <span className="sr-only">{LABELS[level]} crowd level</span>
        </div>
        {showLabel && (
          <span
            className={cn(
              "text-xs font-medium",
              level === "low" && "text-green-400",
              level === "medium" && "text-yellow-400",
              level === "high" && "text-orange-400",
              level === "critical" && "text-red-400"
            )}
          >
            {LABELS[level]}
          </span>
        )}
        {showPercentage && count && capacity && (
          <span className="text-xs text-surface-400">
            {percentage}%
          </span>
        )}
        {count && capacity && showPercentage && (
          <span className="text-xs text-surface-500">
            ({count}/{capacity})
          </span>
        )}
      </div>
    );
  }
);
CrowdIndicator.displayName = "CrowdIndicator";

export { CrowdIndicator };
