"use client";

import { Search, MapPin, Clock, Tag, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LostFoundRecord {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  type: string;
  status: string;
  reported_by: string;
  reported_at: string;
}

export function LostItemDetailsModal({
  item,
  isOpen,
  onClose,
}: {
  item: LostFoundRecord | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mt-0.5">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={item.type === "lost" ? "danger" : "success"}>
                {item.type.toUpperCase()}
              </Badge>
              <Badge variant="info">{item.status}</Badge>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{item.title}</h2>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <div className="text-xs text-gray-400 font-medium">Description</div>
            <p className="text-gray-200 text-sm leading-relaxed">{item.description || "No description provided."}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-gray-400">Location</div>
              <div className="text-white font-medium flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" /> {item.location}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-gray-400">Category</div>
              <div className="text-white font-medium flex items-center gap-1.5 mt-1 capitalize">
                <Tag className="w-3.5 h-3.5 text-blue-400" /> {item.category.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
