"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

export type StatusType =
  | "operational"
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "maintenance"
  | "closed_status"
  | "available"
  | "occupied"
  | "out_of_order"
  | "active"
  | "inactive"
  | "suspended"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "pending"
  | "approved"
  | "rejected";

const statusStyles: Record<StatusType, string> = {
  operational: "bg-green-100/20 text-green-400",
  open: "bg-blue-100/20 text-blue-400",
  in_progress: "bg-yellow-100/20 text-yellow-400",
  resolved: "bg-green-100/20 text-green-400",
  closed: "bg-surface-500/20 text-surface-500",
  maintenance: "bg-yellow-100/20 text-yellow-400",
  closed_status: "bg-red-100/20 text-red-400",
  available: "bg-green-100/20 text-green-400",
  occupied: "bg-red-100/20 text-red-400",
  out_of_order: "bg-red-100/20 text-red-400",
  active: "bg-green-100/20 text-green-400",
  inactive: "bg-surface-500/20 text-surface-500",
  suspended: "bg-red-100/20 text-red-400",
  upcoming: "bg-brand-100/20 text-brand-400",
  ongoing: "bg-purple-100/20 text-purple-400",
  completed: "bg-surface-500/20 text-surface-500",
  cancelled: "bg-red-100/20 text-red-400",
  pending: "bg-yellow-100/20 text-yellow-400",
  approved: "bg-green-100/20 text-green-400",
  rejected: "bg-red-100/20 text-red-400",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusType;
  variant?: "default" | "outline" | "ghost";
  dot?: boolean;
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status = "operational", variant = "default", dot = true, children, ...props }, ref) => {
    const label =
      children ??
      status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const variantClass = variant === "outline" ? "border" : variant === "ghost" ? "bg-transparent" : "";

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          statusStyles[status] || statusStyles.operational,
          variantClass,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              STATUS_COLORS[status as keyof typeof STATUS_COLORS] ??
                STATUS_COLORS.operational
            )}
          />
        )}
        <span>{label}</span>
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
