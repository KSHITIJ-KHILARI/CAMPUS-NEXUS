"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function ScrollProgress() {
  const prefersReduced = useReducedMotion();
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 30,
    restDelta: 0.001,
  });

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setShowScrollTop(latest > 350);
    });
  }, [scrollY]);

  const handleScrollToTop = () => {
    if (typeof window !== "undefined") {
      const lenis = (window as any).__lenis;
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  if (prefersReduced) return null;

  return (
    <>
      {/* Top radiant scroll progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-campus-primary via-red-500 to-amber-500 z-[100] origin-left shadow-[0_0_12px_rgba(239,68,68,0.8)] pointer-events-none"
        style={{ scaleX }}
      />

      {/* Floating smooth scroll-to-top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-20 z-40 p-2.5 rounded-full glass-dark border border-white/15 text-white/80 hover:text-white hover:border-campus-primary/50 hover:bg-campus-primary/20 shadow-xl shadow-black/40 active:scale-95 transition-all duration-200 group flex items-center justify-center backdrop-blur-xl"
            title="Smooth scroll to top"
            aria-label="Smooth scroll to top"
          >
            <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 duration-200" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
