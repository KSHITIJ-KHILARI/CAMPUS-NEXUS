"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { createPortal } from "react-dom";

interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

function ToastItem({
  id,
  title,
  message,
  type = "info",
  action,
  onRemove,
}: ToastProps & { onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const handleRemove = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  const icons = {
    info: AlertCircle,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle,
  };
  const Icon = icons[type];

  const iconColors = {
    info: "text-brand-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border border-surface-800 bg-surface-900/90 backdrop-blur-xl transition-all duration-300",
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn("mt-0.5 h-5 w-5", iconColors[type])} />
          <div className="flex-1">
            {title && <p className="font-medium text-surface-100">{title}</p>}
            <p className="mt-1 text-sm text-surface-300">{message}</p>
          </div>
          <button
            onClick={handleRemove}
            className="ml-2 rounded-md p-1 text-surface-500 hover:bg-surface-800/50 hover:text-surface-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {action && (
          <div className="mt-3 flex justify-end gap-2 border-t border-surface-800 pt-2">
            <button
              onClick={() => {
                action.onClick();
                handleRemove();
              }}
              className="text-sm font-medium text-brand-500 hover:text-brand-400"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = `toast_${++toastCount}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} {...toast} onRemove={removeToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

