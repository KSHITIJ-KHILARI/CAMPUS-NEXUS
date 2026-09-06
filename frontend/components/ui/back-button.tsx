"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  label?: string;
  fallbackPath?: string;
  className?: string;
}

export function BackButton({
  label = "Back",
  fallbackPath = "/",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    const hasInternalHistory =
      typeof window !== "undefined" && window.history.length > 1;
    if (hasInternalHistory) {
      router.back();
    } else {
      router.push(fallbackPath);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBack}
      className={`border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 text-xs transition-all ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Button>
  );
}

export default BackButton;
