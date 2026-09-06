"use client";

import { useState, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Building, MapPin } from "lucide-react";
import { CrowdState } from "@/lib/types";
import { CROWD_COLORS } from "@/lib/constants";

export interface PulseData {
  buildingId: string;
  buildingName: string;
  level: "low" | "medium" | "high" | "critical";
  count: number;
  capacity: number;
  coordinates: { lat: number; lng: number };
  trend: "increasing" | "decreasing" | "stable";
}

export interface PulsePanelProps {
  data?: PulseData[];
  isLoading?: boolean;
  onItemClick?: (item: PulseData) => void;
  className?: string;
}

const levelColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
} as const;

const levelTextColors = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
} as const;

export const PulsePanel = forwardRef<HTMLDivElement, PulsePanelProps>(
  ({ data, isLoading, onItemClick, className }, ref) => {
    const [selectedItem, setSelectedItem] = useState<PulseData | null>(null);
    const items = data ?? [];

    const handleItemClick = (item: PulseData) => {
      setSelectedItem(item);
      onItemClick?.(item);
    };

    const getPercentage = (item: PulseData) => {
      return Math.min(100, Math.round((item.count / item.capacity) * 100));
    };

    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex h-full flex-col rounded-xl border border-surface-700 bg-surface-900/50 p-4",
            className
          )}
        >
          <h3 className="text-lg font-semibold text-surface-100 mb-4">
            Campus Pulse
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-surface-800/50"
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full flex-col rounded-xl border border-surface-700 bg-surface-900/50",
          className
        )}
      >
        <div className="border-b border-surface-700 p-4">
          <h3 className="text-lg font-semibold text-surface-100">
            Campus Pulse
          </h3>
          <p className="text-xs text-surface-500">
            Real-time crowd density across campus
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {items
              .filter((item) => item.level !== "low")
              .sort((a, b) => {
                const levelOrder = { low: 0, medium: 1, high: 2, critical: 3 };
                return levelOrder[b.level] - levelOrder[a.level];
              })
              .map((item) => {
                const pct = getPercentage(item);
                const color = levelColors[item.level];
                const textColor = levelTextColors[item.level];

                return (
                  <button
                    key={item.buildingId}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full rounded-lg border border-surface-700/50 p-3 text-left transition-all",
                      selectedItem?.buildingId === item.buildingId
                        ? "border-brand-500 bg-surface-800/50"
                        : "hover:bg-surface-800/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-surface-400" />
                        <span className="font-medium text-surface-100">
                          {item.buildingName}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          textColor
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full animate-pulse",
                            color
                          )}
                        />
                        <span className="uppercase">{item.level}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-surface-800">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            color
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-500">
                        {pct}%
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs text-surface-500">
                      <span>
                        {item.count}/{item.capacity}
                      </span>
                      <MapPin className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}

              {items.length === 0 && (
                <div className="p-6 text-center text-surface-500">
                  No crowd data available
                </div>
              )}
          </div>
        </div>

        {selectedItem && (
          <div className="border-t border-surface-700 p-4">
            <h4 className="text-sm font-medium text-surface-100">
              {selectedItem.buildingName}
            </h4>
            <p className="text-xs text-surface-400 mt-1">
              {selectedItem.count} / {selectedItem.capacity} occupancy
            </p>
          </div>
        )}
      </div>
    );
  }
);
PulsePanel.displayName = "PulsePanel";

