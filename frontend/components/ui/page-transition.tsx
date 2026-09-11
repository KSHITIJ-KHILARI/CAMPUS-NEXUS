"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Page transition wrapper using Framer Motion.
 * Provides a smooth fade + subtle slide + blur clear on every route change.
 * Keyed by pathname to guarantee execution on every navigation item click.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();
  const pathname = usePathname();

  if (prefersReduced) {
    return <div className="h-full w-full">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="h-full w-full will-change-[opacity,transform,filter]"
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
