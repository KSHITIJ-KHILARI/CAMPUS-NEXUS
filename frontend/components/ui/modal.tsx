"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full h-full m-0",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, closeOnEscape]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? {} : { opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, scale: 0.95, y: 10 }}
              transition={{
                duration: prefersReduced ? 0 : 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                "relative m-4 w-full rounded-2xl border border-surface-700 bg-surface-900/95 shadow-2xl",
                "scrollbar-hide max-h-[90vh] overflow-y-auto",
                sizeClasses[size]
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="flex items-center justify-between p-6">
                  <h2 className="text-2xl font-bold text-surface-100">{title}</h2>
                  <button
                    onClick={onClose}
                    className="rounded-md p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="p-6 pt-0">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function useModal(initialState = false) {
  const [open, setOpen] = useState(initialState);
  return {
    open,
    setOpen,
    close: () => setOpen(false),
    openModal: () => setOpen(true),
    toggle: () => setOpen(!open),
  };
}
