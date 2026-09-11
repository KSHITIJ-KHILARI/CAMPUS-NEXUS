"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Global smooth scroll provider using Lenis.
 * - Wraps page content with inertia-based scrolling
 * - Respects prefers-reduced-motion (disables when set)
 * - Elements with [data-lenis-prevent] attribute are excluded (e.g. chat containers)
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReduced) {
      // Clean up any existing instance
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.15,
      touchMultiplier: 1.8,
      infinite: false,
    });

    lenisRef.current = lenis;
    if (typeof window !== "undefined") {
      (window as any).__lenis = lenis;
    }

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      if (typeof window !== "undefined") {
        delete (window as any).__lenis;
      }
    };
  }, [prefersReduced]);

  return <>{children}</>;
}
