import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "avatar" | "button";
}

export function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: "rounded-md",
    card: "rounded-2xl h-32 w-full",
    text: "rounded h-4 w-3/4",
    avatar: "rounded-full h-10 w-10 flex-shrink-0",
    button: "rounded-xl h-10 w-28",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white/5 animate-pulse",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
    </div>
  );
}

export default Skeleton;
