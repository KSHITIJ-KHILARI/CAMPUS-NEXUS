"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "bars" | "pulse" | "dots";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  ({ size = "md", variant = "spinner", className, text, fullScreen = false }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    };

    const renderSpinner = () => (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", sizeClasses[size], className)}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-surface-300 border-t-brand-600 dark:border-surface-700 dark:border-t-brand-500",
            size === "sm" && "h-4 w-4 border-2",
            size === "md" && "h-8 w-8 border-2",
            size === "lg" && "h-12 w-12 border-3",
            size === "xl" && "h-16 w-16 border-4"
          )}
        />
      </div>
    );

    const renderBars = () => (
      <div ref={ref} className={cn("flex space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-brand-600 dark:bg-brand-500",
              size === "sm" && "h-4 w-1 animate-bounce",
              size === "md" && "h-6 w-1.5 animate-bounce",
              size === "lg" && "h-8 w-2 animate-bounce",
              size === "xl" && "h-12 w-3 animate-bounce"
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );

    const renderPulse = () => (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-full bg-surface-300 dark:bg-surface-700",
          className,
          size === "sm" && "h-4 w-4",
          size === "md" && "h-8 w-8",
          size === "lg" && "h-12 w-12",
          size === "xl" && "h-16 w-16"
        )}
      />
    );

    const renderDots = () => (
      <div ref={ref} className={cn("flex space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-brand-600 dark:bg-brand-500 animate-pulse",
              size === "sm" && "h-2 w-2",
              size === "md" && "h-3 w-3",
              size === "lg" && "h-4 w-4",
              size === "xl" && "h-6 w-6"
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    );

    const renderVariant = () => {
      switch (variant) {
        case "bars":
          return renderBars();
        case "pulse":
          return renderPulse();
        case "dots":
          return renderDots();
        default:
          return renderSpinner();
      }
    };

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {renderVariant()}
            {text && <p className="text-sm text-surface-400">{text}</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2">
        {renderVariant()}
        {text && <p className="text-sm text-surface-400">{text}</p>}
      </div>
    );
  }
);
Loading.displayName = "Loading";

export { Loading };
