"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { SmoothScrollProvider } from "@/components/ui/smooth-scroll-provider";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <PageTransition>
        {children}
      </PageTransition>
    </SmoothScrollProvider>
  );
}
