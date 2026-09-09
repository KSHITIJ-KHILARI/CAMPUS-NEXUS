"use client";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out fill-mode-forwards">
      {children}
    </div>
  );
}
