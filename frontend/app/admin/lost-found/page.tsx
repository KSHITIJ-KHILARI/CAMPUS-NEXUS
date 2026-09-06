"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api-client";

type LostFoundItem = {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  type: string;
  status: string;
  reported_by: string;
  reported_at: string;
};

const STATUS_OPTIONS_LOST = ["lost", "found", "claimed", "archived"];
const STATUS_OPTIONS_FOUND = ["unclaimed", "claimed", "archived"];

export default function AdminLostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const typeParam = filterType === "all" ? undefined : filterType;
      const data = await api.lostFound.adminGetAll(typeParam);
      setItems(data || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  const handleStatusUpdate = async (itemId: string, newStatus: string) => {
    setUpdatingId(itemId);
    try {
      await api.lostFound.adminUpdateStatus(itemId, { status: newStatus });
      await fetchItems();
    } catch {
      //
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const statusVariant = (status: string, type: string) => {
    if (type === "lost") {
      switch (status) {
        case "found":
          return "success";
        case "claimed":
          return "default";
        case "archived":
          return "info";
        default:
          return "danger";
      }
    } else {
      switch (status) {
        case "claimed":
          return "success";
        case "archived":
          return "info";
        default:
          return "warning";
      }
    }
  };

  const getStatusOptions = (type: string) => (type === "lost" ? STATUS_OPTIONS_LOST : STATUS_OPTIONS_FOUND);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Lost & Found Management</h1>
          <p className="text-gray-400">Moderate and update status of all reported items</p>
        </div>
        <Button
          onClick={fetchItems}
          variant="outline"
          className="border-white/10 text-gray-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "lost", "found"] as const).map((t) => (
          <Button
            key={t}
            variant={filterType === t ? "default" : "outline"}
            onClick={() => setFilterType(t)}
            className={filterType === t ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
          >
            {t === "all" ? "All Items" : t === "lost" ? "Lost Items" : "Found Items"}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by title, category, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-red-500"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading items...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-400 border-white/10">No items found.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="p-4 border-white/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.title}</span>
                    <Badge variant={item.type === "lost" ? "danger" : "success"}>{item.type}</Badge>
                    <Badge variant={statusVariant(item.status, item.type)}>{item.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">{item.description}</p>
                  <p className="text-xs text-gray-500">
                    Category: {item.category} | Reported by: {item.reported_by} | Reported:{" "}
                    {item.reported_at ? new Date(item.reported_at).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                    disabled={updatingId === item.id}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
                  >
                    {getStatusOptions(item.type).map((s) => (
                      <option key={s} value={s} className="bg-neutral-900">
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  {item.type === "lost" && item.status === "lost" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(item.id, "found")}
                      disabled={updatingId === item.id}
                      className="border-white/10 text-xs text-gray-300 hover:text-white"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Found
                    </Button>
                  )}
                  {item.type === "found" && item.status === "unclaimed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(item.id, "claimed")}
                      disabled={updatingId === item.id}
                      className="border-white/10 text-xs text-gray-300 hover:text-white"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Claimed
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(item.id, "archived")}
                    disabled={updatingId === item.id}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Archive
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
