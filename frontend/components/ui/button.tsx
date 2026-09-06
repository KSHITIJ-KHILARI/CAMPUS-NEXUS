import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      default: "bg-campus-primary text-white hover:bg-campus-primary-dark",
      outline: "border border-white/10 bg-transparent hover:bg-white/5",
      ghost: "hover:bg-white/5",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      secondary: "bg-white/10 text-white hover:bg-white/15",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-lg px-3",
      lg: "h-11 rounded-xl px-8",
    }

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
