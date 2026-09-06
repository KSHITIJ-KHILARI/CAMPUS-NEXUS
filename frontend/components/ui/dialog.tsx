"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  overlay?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full h-full m-0 rounded-none",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  overlay = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

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

  if (!mounted || !open) return null;

  const content = (
    <>
      {overlay && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        onClick={closeOnOverlayClick ? onClose : undefined}
      >
        <div
          ref={dialogRef}
          className={cn(
            "relative m-4 w-full rounded-xl border border-surface-700 bg-surface-900/95 backdrop-blur-xl",
            "scrollbar-hide max-h-[90vh] overflow-y-auto",
            sizeClasses[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {title && (
              <h2 className="text-xl font-semibold text-surface-100">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-surface-400">{description}</p>
            )}
            <div className="mt-4">{children}</div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-md p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

export function useDialog(initialState = false) {
  const [open, setOpen] = useState(initialState);
  return {
    open,
    setOpen,
    close: () => setOpen(false),
    openDialog: () => setOpen(true),
    toggle: () => setOpen(!open),
  };
}

