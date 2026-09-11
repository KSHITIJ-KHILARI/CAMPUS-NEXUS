"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Page transition wrapper using Framer Motion.
 * Provides a smooth fade + subtle slide on route changes.
 * Replaces the previous CSS-only animate-in approach.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className="h-full w-full">{children}</div>;
  }

  return (
    <motion.div
      className="h-full w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
