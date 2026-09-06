"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, GraduationCap, MapPin, Calendar, HelpCircle, X, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "book" | "resource" | "faq" | "room" | "faculty" | "action";
  actionUrl?: string;
}

export function GlobalCommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([
        { id: "a1", title: "Where is my next class?", subtitle: "Smart Leave Now & Navigation", type: "action", actionUrl: "/student/my-day" },
        { id: "a2", title: "Search Library Catalog", subtitle: "Books, copies & reservations", type: "book", actionUrl: "/student/explore" },
        { id: "a3", title: "Campus Pulse & Crowds", subtitle: "Canteen & Library real-time density", type: "action", actionUrl: "/student/pulse" },
        { id: "a4", title: "Ask NEXUS AI Assistant", subtitle: "AI campus guidance & tools", type: "action", actionUrl: "/student/ai" },
      ]);
      return;
    }

    const fetchSearch = async () => {
      setLoading(true);
      try {
        const [booksRes, resRes, faqRes] = await Promise.allSettled([
          api.library.getBooks(query),
          api.resources.search(query),
          api.faq.search(query),
        ]);

        const items: SearchResult[] = [];

        if (booksRes.status === "fulfilled" && Array.isArray(booksRes.value)) {
          booksRes.value.forEach((b: any) => {
            items.push({
              id: `b_${b.id}`,
              title: b.title,
              subtitle: `Author: ${b.author} | Shelf: ${b.shelf_location || "LLC"} | Available: ${b.available_copies}/${b.total_copies}`,
              type: "book",
              actionUrl: "/student/explore",
            });
          });
        }

        if (resRes.status === "fulfilled" && Array.isArray(resRes.value)) {
          resRes.value.forEach((r: any) => {
            items.push({
              id: `r_${r.id}`,
              title: r.title,
              subtitle: `Topic: ${r.topic || "General"} | Type: ${r.type?.toUpperCase() || "RESOURCE"}`,
              type: "resource",
              actionUrl: r.url || "/student/explore",
            });
          });
        }

        if (faqRes.status === "fulfilled" && Array.isArray(faqRes.value)) {
          faqRes.value.forEach((f: any) => {
            items.push({
              id: `f_${f.id}`,
              title: f.question,
              subtitle: f.answer,
              type: "faq",
              actionUrl: "/student/explore",
            });
          });
        }

        setResults(items.slice(0, 8));
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSearch, 250);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 border-b border-white/10 py-3 gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search classes, books, resources, FAQs, or ask NEXUS..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-base"
            autoFocus
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          {loading && (
            <div className="p-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" /> Searching Campus NEXUS...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No results matching &quot;{query}&quot;</div>
          )}

          {!loading &&
            results.map((res) => (
              <div
                key={res.id}
                onClick={() => {
                  if (res.actionUrl) router.push(res.actionUrl);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <div className="p-2 rounded-lg bg-white/5 text-red-400 group-hover:bg-red-500/20 transition-colors">
                  {res.type === "book" && <BookOpen className="w-4 h-4" />}
                  {res.type === "resource" && <GraduationCap className="w-4 h-4" />}
                  {res.type === "faq" && <HelpCircle className="w-4 h-4" />}
                  {res.type === "action" && <Sparkles className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white group-hover:text-red-400 transition-colors truncate">
                    {res.title}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{res.subtitle}</div>
                </div>
              </div>
            ))}
        </div>

        <div className="px-4 py-2 bg-white/5 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
          <span>
            Use <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/10 text-white">Ctrl + K</kbd> to open anytime
          </span>
          <span>CAMPUS NEXUS Intelligence</span>
        </div>
      </div>
    </div>
  );
}
