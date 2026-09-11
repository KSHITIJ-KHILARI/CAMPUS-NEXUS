"use client";

import { cn } from "@/lib/utils";

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={item.onClick}
          className={cn(
            "group relative p-5 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between",
            "border border-white/10 bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 backdrop-blur-xl shadow-xl",
            "hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] hover:border-white/20 hover:-translate-y-1 will-change-transform",
            item.onClick && "cursor-pointer active:scale-[0.99]",
            item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
            {
              "border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.4)] -translate-y-0.5":
                item.hasPersistentHover,
            }
          )}
        >
          {/* Subtle hover radial dots */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } transition-opacity duration-300`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:6px_6px]" />
          </div>

          <div className="relative z-10 flex flex-col space-y-3.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/10 group-hover:border-white/25 group-hover:bg-white/15 transition-all duration-300">
                {item.icon}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10",
                  "bg-white/5 text-gray-200 transition-colors duration-300 group-hover:bg-white/15"
                )}
              >
                {item.status || "Active"}
              </span>
            </div>

            <div className="space-y-1.5 flex-1">
              <h3 className="font-bold text-white tracking-tight text-base flex items-baseline">
                {item.title}
                {item.meta && (
                  <span className="ml-2 text-xs text-neutral-400 font-normal">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>

            {item.children && (
              <div className="pt-2">
                {item.children}
              </div>
            )}
          </div>

          <div className="relative z-10 flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs text-neutral-400">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              {item.tags?.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-neutral-300 text-[11px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
            {item.cta && (
              <span className="text-xs font-semibold text-red-400 group-hover:text-red-300 flex items-center gap-1 transition-colors group-hover:translate-x-0.5 duration-200">
                {item.cta}
              </span>
            )}
          </div>

          {/* Glowing subtle border accent */}
          <div
            className={`absolute inset-0 -z-10 rounded-2xl p-px bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none ${
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } transition-opacity duration-300`}
          />
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
