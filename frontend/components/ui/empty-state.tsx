"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title = "No results found",
      message = "There's nothing to show here yet.",
      icon: Icon,
      action,
      className,
    },
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
        {Icon && (
          <div className="rounded-full bg-surface-100/20 p-4 dark:bg-surface-800">
            <Icon className="h-8 w-8 text-surface-500" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
          {title}
        </h3>
        {message && (
          <p className="max-w-sm text-sm text-surface-500 dark:text-surface-400">
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
