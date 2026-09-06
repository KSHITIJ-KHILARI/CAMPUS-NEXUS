"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    { title = "Something went wrong", message, onRetry, showRetry = true, className },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-8 text-center",
          className
        )}
      >
        <div className="rounded-full bg-red-100/20 p-4 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          {title}
        </h3>
        {message && (
          <p className="max-w-sm text-sm text-surface-500 dark:text-surface-400">
            {message}
          </p>
        )}
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    );
  }
);
ErrorState.displayName = "ErrorState";

export { ErrorState };
