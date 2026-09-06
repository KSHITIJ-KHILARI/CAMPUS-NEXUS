"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export type DrawerPlacement = "left" | "right" | "top" | "bottom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  placement?: DrawerPlacement;
  size?: "sm" | "md" | "lg" | "xl";
  overlay?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

const placementClasses = {
  left: "inset-y-0 left-0 top-0 h-full w-80 max-w-full translate-x-0",
  right: "inset-y-0 right-0 top-0 h-full w-80 max-w-full",
  top: "inset-x-0 top-0 h-auto max-h-[90vh]",
  bottom: "inset-x-0 bottom-0 h-auto max-h-[90vh]",
};

const translateClasses = {
  left: "translate-x-[-100%]",
  right: "translate-x-[100%]",
  top: "translate-y-[-100%]",
  bottom: "translate-y-[100%]",
};

const sizeClasses = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
  xl: "w-[30rem]",
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  placement = "right",
  size = "md",
  overlay = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape) onClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, closeOnEscape]);

  if (!mounted || !open) return null;

  const sizeClass = placement === "left" || placement === "right" ? sizeClasses[size] : "";

  const content = (
    <>
      {overlay && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
      )}
      <div
        className={cn(
          "fixed z-50 rounded-lg border border-surface-700 bg-surface-900/95 backdrop-blur-xl",
          "transition-transform duration-300 ease-out",
          "overflow-y-auto",
          placementClasses[placement],
          !open && translateClasses[placement],
          sizeClass,
          open ? "translate-x-0 translate-y-0" : ""
        )}
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {title && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-surface-100">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

export function useDrawer(initialState = false) {
  const [open, setOpen] = useState(initialState);
  return {
    open,
    setOpen,
    close: () => setOpen(false),
    openDrawer: () => setOpen(true),
    toggle: () => setOpen(!open),
  };
}

