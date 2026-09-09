import { Sparkles } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative">
        <div className="absolute inset-[-8px] bg-campus-primary/10 rounded-full animate-ping" />
        <Sparkles className="h-8 w-8 text-campus-primary relative z-10" />
      </div>
      <p className="text-gray-400 text-sm font-medium">Loading...</p>
    </div>
  );
}
