"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export type BottomSheetSnap = "auto" | number;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: BottomSheetSnap[];
  showHandle?: boolean;
  rounded?: boolean;
  overlay?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  children,
  snapPoints = ["auto"],
  showHandle = true,
  rounded = true,
  overlay = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

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

  const offset = open ? "translate-y-0" : "translate-y-full";

  return createPortal(
    <>
      {overlay && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
      )}
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl",
          "border-t border-surface-700 bg-surface-900/95 backdrop-blur-xl",
          "transition-transform duration-300 ease-out",
          rounded && "rounded-t-2xl",
          open ? offset : "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showHandle && (
          <div className="flex justify-center py-2">
            <div className="h-1 w-12 rounded-full bg-surface-600" />
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}

export function useBottomSheet(initialState = false) {
  const [open, setOpen] = useState(initialState);
  return {
    open,
    setOpen,
    close: () => setOpen(false),
    openSheet: () => setOpen(true),
    toggle: () => setOpen(!open),
  };
}

