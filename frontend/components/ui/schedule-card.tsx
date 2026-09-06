"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ScheduleEntry } from "@/lib/types";
import { Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ScheduleCardProps {
  entry: ScheduleEntry;
  isCurrent?: boolean;
  isNext?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

const TYPE_COLORS = {
  lecture: "bg-blue-500/20 text-blue-400",
  lab: "bg-purple-500/20 text-purple-400",
  tutorial: "bg-green-500/20 text-green-400",
} as const;

const TYPE_LABELS = {
  lecture: "Lecture",
  lab: "Lab",
  tutorial: "Tutorial",
} as const;

const ScheduleCard = forwardRef<HTMLDivElement, ScheduleCardProps>(
  (
    { entry, isCurrent = false, isNext = false, compact = false, onClick, className },
    ref
  ) => {
    const cardClass = cn(
      "rounded-xl border transition-all duration-200 cursor-pointer",
      "bg-surface-900/50 dark:bg-surface-800/50",
      "border-surface-200 dark:border-surface-700",
      isCurrent && "border-brand-500/50 bg-brand-900/20",
      isNext && "border-surface-300/50 bg-surface-100/5 dark:bg-surface-700/50",
      "hover:shadow-lg",
      compact ? "p-3" : "p-4",
      className
    );

    return (
      <div ref={ref} className={cardClass} onClick={onClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                "bg-brand-500/10 text-brand-400"
              )}
            >
              <Clock className="h-4 w-4" />
            </div>
            <div className={cn(compact && "space-y-0.5")}>
              <h4 className="font-semibold text-surface-100">{entry.courseCode}</h4>
              {!compact && (
                <p className="text-sm text-surface-400">{entry.courseName}</p>
              )}
            </div>
          </div>

          <Badge
            variant="secondary"
            className={cn(
              TYPE_COLORS[entry.type],
              "border-0",
              compact && "text-xs"
            )}
          >
            {TYPE_LABELS[entry.type]}
          </Badge>
        </div>

        {!compact && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-surface-400">
              <Clock className="h-4 w-4" />
              <span>
                {entry.startTime} - {entry.endTime}
              </span>
            </div>
            <div className="flex items-center gap-2 text-surface-400">
              <MapPin className="h-4 w-4" />
              <span>
                {entry.buildingId} · {entry.roomId}
              </span>
            </div>
            <div className="flex items-center gap-2 text-surface-400">
              <User className="h-4 w-4" />
              <span>{entry.faculty}</span>
            </div>
            <div className="flex items-center gap-2 text-surface-400">
              <span className="capitalize">{entry.day}</span>
            </div>
          </div>
        )}

        {isCurrent && (
          <div className="mt-2">
            <div className="h-1 w-full rounded-full bg-surface-700">
              <div className="h-1 w-1/3 rounded-full bg-green-500" />
            </div>
          </div>
        )}
      </div>
    );
  }
);
ScheduleCard.displayName = "ScheduleCard";

export { ScheduleCard };
