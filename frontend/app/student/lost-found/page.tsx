"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Plus, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { ReportLostFoundModal } from "@/components/campus/ReportLostFoundModal";
import { LostItemDetailsModal } from "@/components/campus/LostItemDetailsModal";

export default function LostFoundPage() {
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.lostFound.getItems(activeTab, searchQuery);
      setItems(data || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        <Button
          onClick={() => setIsReportModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Report Item
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Lost & Found Intelligence Registry</h1>
        <p className="text-gray-400">File reports and search missing or recovered personal belongings across campus</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "lost" ? "default" : "outline"}
          onClick={() => setActiveTab("lost")}
          className={activeTab === "lost" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          Lost Items
        </Button>
        <Button
          variant={activeTab === "found" ? "default" : "outline"}
          onClick={() => setActiveTab("found")}
          className={activeTab === "found" ? "bg-red-600 text-white" : "border-white/10 text-gray-300"}
        >
          Found Items
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search items by keyword or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading && (
          <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading Lost & Found reports...
          </div>
        )}

        {!loading && items.length === 0 && (
          <Card className="p-8 text-center text-sm text-gray-400 border-white/10">No {activeTab} item reports found matching search.</Card>
        )}

        {!loading &&
          items.map((item) => (
            <Card key={item.id} className="card-hover p-4 border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mt-1">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-base">{item.title}</h3>
                      <Badge variant={item.type === "lost" ? "danger" : "success"}>
                        {item.type}
                      </Badge>
                      <Badge variant="info">{item.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-red-400" />
                        {item.location}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedItem(item)}
                  className="border-white/10 text-xs text-gray-300 hover:text-white"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
      </div>

      {/* Modals */}
      <ReportLostFoundModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportCreated={fetchItems}
      />

      <LostItemDetailsModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
