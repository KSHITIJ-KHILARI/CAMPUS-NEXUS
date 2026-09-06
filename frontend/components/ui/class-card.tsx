"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ClassSession, ScheduleEntry } from "@/lib/types";
import { Clock, MapPin, User, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ClassCardProps {
  session?: ClassSession;
  scheduleEntry?: ScheduleEntry;
  status?: "current" | "upcoming" | "recent";
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG = {
  current: {
    bg: "bg-brand-900/30",
    border: "border-brand-500/50",
    badge: "bg-green-500/20 text-green-400",
    badgeText: "In Progress",
  },
  upcoming: {
    bg: "bg-surface-800/50",
    border: "border-surface-600",
    badge: "bg-blue-500/20 text-blue-400",
    badgeText: "Upcoming",
  },
  recent: {
    bg: "bg-surface-800/30",
    border: "border-surface-700",
    badge: "bg-surface-500/20 text-surface-400",
    badgeText: "Completed",
  },
} as const;

const ClassCard = forwardRef<HTMLDivElement, ClassCardProps>(
  (
    { session, scheduleEntry, status = "upcoming", compact = false, onClick, className },
    ref
  ) => {
    const entry = scheduleEntry ?? session?.courseSection?.schedule;
    if (!entry) return null;

    const config = STATUS_CONFIG[status];

    const progressPct = (() => {
      if (status !== "current" || !session) return 0;
      return 50;
    })();

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border transition-all duration-200 cursor-pointer",
          config.bg,
          config.border,
          "hover:scale-[1.02] hover:shadow-xl",
          compact ? "p-3" : "p-4",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                "bg-brand-500/10 text-brand-400"
              )}
            >
              <BookOpen className="h-5 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-surface-100">
                {entry.courseCode}
              </h4>
              {!compact && (
                <p className="text-sm text-surface-400">{entry.courseName}</p>
              )}
            </div>
          </div>

          <Badge variant="secondary" className={cn(config.badge, "border-0")}>
            {config.badgeText}
          </Badge>
        </div>

        {!compact && (
          <div className="mt-3 space-y-1.5 text-sm">
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
          </div>
        )}

        {status === "current" && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-surface-700">
              <div
                className="h-1.5 rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);
ClassCard.displayName = "ClassCard";

export { ClassCard };
