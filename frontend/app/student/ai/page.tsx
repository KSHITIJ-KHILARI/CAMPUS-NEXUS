import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';

const AIChat = dynamic(() => import("@/components/features/ai-chat"), {
  loading: () => (
    <div className="flex items-center justify-center h-[50vh] text-gray-400">
      <Sparkles className="w-6 h-6 animate-spin mr-2 text-red-500" /> Loading AI interface...
    </div>
  ),
});

export default function AIPage() {
  return <AIChat />
}
