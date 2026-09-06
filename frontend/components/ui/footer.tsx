"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
  isSidebar?: boolean;
}

export function Footer({ className, isSidebar = false }: FooterProps) {
  if (isSidebar) {
    return (
      <div className={cn("px-3 py-2.5 border-t border-white/5 text-[11px] text-gray-500", className)}>
        <p className="font-medium text-gray-400">Campus NEXUS</p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          Built by Kshitij, Harshit &amp; Piyush
        </p>
      </div>
    );
  }

  return (
    <footer className={cn("w-full py-4 px-6 border-t border-white/5 text-center text-xs text-gray-500", className)}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} Somaiya Vidyavihar University &bull; Campus NEXUS
        </p>
        <p className="text-gray-400">
          Built by <span className="text-white font-medium">Kshitij, Harshit &amp; Piyush</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
