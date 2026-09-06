"use client";

import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  chartType?: "line" | "bar" | "area";
  data?: unknown[];
  className?: string;
  loading?: boolean;
}

export const AnalyticsCard = forwardRef<HTMLDivElement, AnalyticsCardProps>(
  (
    {
      title,
      value,
      change,
      changeLabel,
      icon,
      chartType = "line",
      data,
      className,
      loading = false,
    },
    ref
  ) => {
    const isPositive = change && change >= 0;

    return (
      <Card
        ref={ref}
        className={cn(
          "group transition-all duration-200 hover:shadow-xl",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-surface-400">
            {title}
          </CardTitle>
          {icon && (
            <div className="rounded-lg bg-surface-800/50 p-2 text-surface-300">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-3/4 animate-pulse rounded bg-surface-700" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-700" />
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-surface-100">{value}</div>
              {change !== undefined && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "font-medium",
                      isPositive ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {change.toFixed(1)}%
                  </span>
                  {changeLabel && (
                    <span className="text-surface-500">{changeLabel}</span>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }
);
AnalyticsCard.displayName = "AnalyticsCard";

