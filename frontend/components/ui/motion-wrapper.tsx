"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ─── Shared Variants ─── */

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const noMotionVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

/* ─── StaggerContainer ─── */

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Parent wrapper that orchestrates staggered entrance for children
 * wrapped in <FadeUp>. Uses `staggerChildren` + `delayChildren`.
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  as = "div",
}: StaggerContainerProps) {
  const prefersReduced = useReducedMotion();

  const Component = motion[as as "div"] as typeof motion.div;

  return (
    <Component
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReduced ? 0 : staggerDelay,
            delayChildren: prefersReduced ? 0 : 0.1,
          },
        },
      }}
    >
      {children}
    </Component>
  );
}

/* ─── FadeUp ─── */

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

/**
 * Individual child wrapper — fade + slide up on entrance.
 * Must be a child of <StaggerContainer> for staggering, or standalone for single elements.
 */
export function FadeUp({
  children,
  className,
  duration = 0.4,
}: FadeUpProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={prefersReduced ? noMotionVariants : fadeUpVariants}
      transition={{
        duration: prefersReduced ? 0 : duration,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── AnimatedCard ─── */

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps any card element with hover lift + shadow animation.
 * Uses GPU-friendly transform + opacity only.
 */
export function AnimatedCard({ children, className }: AnimatedCardProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      {children}
    </motion.div>
  );
}
