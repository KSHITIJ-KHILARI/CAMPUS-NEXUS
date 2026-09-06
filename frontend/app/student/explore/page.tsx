"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Search, BookOpen, GraduationCap, CheckCircle, Bookmark, Sparkles, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { BookDetailsModal } from "@/components/campus/BookDetailsModal";

import { useDebounce } from "@/hooks/use-debounce";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<"library" | "resources" | "rooms">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 250);
  const [books, setBooks] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [vacantRooms, setVacantRooms] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bookmarkMsg, setBookmarkMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setErrorMsg("");
      try {
        if (activeTab === "library") {
          const [bList, occ] = await Promise.all([
            api.library.getBooks(debouncedQuery),
            api.library.getOccupancy().catch(() => null),
          ]);
          setBooks(bList || []);
          if (occ) setOccupancy(occ);
        } else if (activeTab === "resources") {
          const rList = await api.resources.search(debouncedQuery);
          setResources(rList || []);
        } else if (activeTab === "rooms") {
          const vList = await api.rooms.getVacant();
          setVacantRooms(vList || []);
        }
      } catch {
        setErrorMsg("Unable to load this section. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [activeTab, debouncedQuery]);

  const handleBookmark = async (resId: string) => {
    try {
      await api.resources.bookmark(resId);
      setBookmarkMsg("Resource bookmarked successfully!");
      setTimeout(() => setBookmarkMsg(""), 2000);
    } catch {
      setBookmarkMsg("");
      setErrorMsg("Could not bookmark this resource. Please try again.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Library & Learning Intelligence</h1>
          <p className="text-gray-400">Browse library catalog, reserve textbooks, and access course learning resources</p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start">
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "library" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Library Catalog
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "resources" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Learning Hub
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "rooms" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-gray-400 hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Vacant Rooms
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={
            activeTab === "library"
              ? "Search books by title, author, subject, or ISBN..."
              : activeTab === "resources"
              ? "Search learning notes, video tutorials, practice sets..."
              : "Search vacant classrooms..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </div>

      {bookmarkMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {bookmarkMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* TAB 1: LIBRARY CATALOG */}
      {activeTab === "library" && (
        <div className="space-y-6">
          {/* Real Library Occupancy Widget */}
          {occupancy && (
            <Card className="bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border-red-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-red-400 font-semibold mb-1">Live Occupancy Telemetry</div>
                  <h3 className="text-lg font-bold text-white">{occupancy.building}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {occupancy.current_occupancy} of {occupancy.capacity} seats currently occupied ({Math.round((occupancy.occupancy_rate || 0.5) * 100)}% density)
                  </p>
                </div>
                <Badge variant={occupancy.status === "high" ? "danger" : "success"}>
                  {occupancy.status === "high" ? "High Density" : "Seats Available"}
                </Badge>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {books.map((book) => (
              <Card key={book.id} className="card-hover flex flex-col justify-between p-5 border-white/10">
                <div className="space-y-2">
                  <Badge variant="info" className="text-[10px] text-red-400 border-red-500/30">
                    {book.subject || "Textbook"}
                  </Badge>
                  <h3 className="font-bold text-white text-base leading-snug">{book.title}</h3>
                  <p className="text-xs text-gray-400">{book.author}</p>
                  <div className="text-xs text-gray-400 pt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> Shelf: {book.shelf_location || "CS-04-B"}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-medium">
                    {book.available_copies} / {book.total_copies} available
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setSelectedBook(book)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl"
                  >
                    View & Reserve
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LEARNING HUB RESOURCES */}
      {activeTab === "resources" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((res) => (
            <Card key={res.id} className="card-hover flex flex-col justify-between p-5 border-white/10">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="info" className="text-[10px] uppercase">
                    {res.type}
                  </Badge>
                  <span className="text-xs text-amber-400 font-semibold">★ {res.rating || 4.8}</span>
                </div>
                <h3 className="font-bold text-white text-base leading-snug">{res.title}</h3>
                <p className="text-xs text-gray-400">Module: {res.module_name || "General"} | Topic: {res.topic}</p>
                <p className="text-xs text-gray-400">Duration: {res.duration_minutes} mins</p>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                <button
                  onClick={() => handleBookmark(res.id)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Bookmark Resource"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <a
                  href={res.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20"
                >
                  Open Resource
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: VACANT ROOM FINDER */}
      {activeTab === "rooms" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vacantRooms.map((rm) => (
            <Card key={rm.id} className="card-hover p-5 border-white/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white text-base">{rm.name}</h3>
                  <p className="text-xs text-gray-400">{rm.building} (Floor {rm.floor})</p>
                </div>
                <Badge variant="success">Vacant Now</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-2">Capacity: {rm.capacity} Seats | Type: {rm.type}</p>
            </Card>
          ))}
          {vacantRooms.length === 0 && (
            <p className="text-gray-400 col-span-3 text-center py-8">No vacant rooms found matching criteria.</p>
          )}
        </div>
      )}

      {/* Book Reserve Modal */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
