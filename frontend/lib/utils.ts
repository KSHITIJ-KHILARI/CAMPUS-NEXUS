import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | number, fmt = "PPP"): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    return format(d, fmt);
  } catch {
    return "Invalid date";
  }
}

export function formatDateTime(date: string | Date | number): string {
  return formatDate(date, "PPp");
}

export function formatTime(date: string | Date | number): string {
  return formatDate(date, "p");
}

export const IST_TIMEZONE = "Asia/Kolkata";

function formatInTimezone(
  date: string | Date | number,
  options: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === "string" ? new Date(date) : new Date(date);
    if (Number.isNaN(d.getTime())) return "Invalid date";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      ...options,
    }).format(d);
  } catch {
    return "Invalid date";
  }
}

export function formatIstDate(date: string | Date | number): string {
  return formatInTimezone(date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatIstDateTime(date: string | Date | number): string {
  return formatInTimezone(date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatIstTime(date: string | Date | number): string {
  return formatInTimezone(date, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatRelativeTime(date: string | Date | number): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

export function formatTimeAgo(date: string | Date | number): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date, "PPp");
  } catch {
    return "Unknown";
  }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatCapacity(current: number, max: number): string {
  if (max === 0) return `${current}`;
  const pct = Math.round((current / max) * 100);
  return `${current} (${pct}%)`;
}

export function truncate(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return "—";
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

export function calculateProgress(
  current: number,
  min: number,
  max: number
): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((current - min) / (max - min)) * 100));
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRun >= delay) {
      fn(...args);
      lastRun = now;
    }
  };
}

export { format, formatDistanceToNow, parseISO };
