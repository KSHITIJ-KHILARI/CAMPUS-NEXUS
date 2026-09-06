import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white/10 text-gray-300",
      success: "status-green",
      warning: "status-yellow",
      danger: "status-red",
      info: "bg-campus-blue/10 text-campus-blue border border-campus-blue/20",
      secondary: "bg-white/10 text-gray-300 border border-white/10",
    }

    return (
      <div
        ref={ref}
        className={`status-badge ${variants[variant]} ${className}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
