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

import { motion, LayoutGroup } from "framer-motion";

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
    } catch (err) {
      console.error("Failed to load lost/found items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        <Button
          onClick={() => setIsReportModalOpen(true)}
          className="bg-campus-primary hover:bg-campus-primary/90 text-white flex items-center gap-2 rounded-xl shadow-lg shadow-campus-primary/25"
        >
          <Plus className="h-4 w-4" />
          Report Item
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Lost & Found Intelligence Registry</h1>
        <p className="text-gray-400">File reports and search missing or recovered personal belongings across campus</p>
      </div>

      {/* Tabs */}
      <LayoutGroup id="lostFoundTabs">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start w-fit">
          <button
            onClick={() => setActiveTab("lost")}
            className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 select-none ${
              activeTab === "lost" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {activeTab === "lost" && (
              <motion.div
                layoutId="lostFoundTabActivePill"
                className="absolute inset-0 bg-campus-primary rounded-lg shadow-lg shadow-campus-primary/25"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">Lost Items</span>
          </button>
          <button
            onClick={() => setActiveTab("found")}
            className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 select-none ${
              activeTab === "found" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {activeTab === "found" && (
              <motion.div
                layoutId="lostFoundTabActivePill"
                className="absolute inset-0 bg-campus-primary rounded-lg shadow-lg shadow-campus-primary/25"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">Found Items</span>
          </button>
        </div>
      </LayoutGroup>

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
