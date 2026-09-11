"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Clock, MapPin, X, BookmarkCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  subject?: string;
  department?: string;
  shelf_location?: string;
  total_copies: number;
  available_copies: number;
}

export function BookDetailsModal({
  book,
  isOpen,
  onClose,
  onReserved,
}: {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onReserved?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleReserve = async () => {
    if (!book) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.library.reserveBook(book.id);
      setSuccessMsg("Book successfully reserved! Pick up at Library Desk within 48 hours.");
      if (onReserved) onReserved();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reserve book. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && book && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-red-400 font-semibold">{book.subject || "Academic Textbook"}</span>
            <h2 className="text-xl font-bold text-white leading-tight">{book.title}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Author: {book.author}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Shelf Location</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-red-400" /> {book.shelf_location || "LLC Floor 2"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-xs text-gray-400">Available Copies</div>
            <div className="text-white font-medium flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> {book.available_copies} of {book.total_copies} available
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 flex-shrink-0" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            Close
          </button>
          {!successMsg && (
            <button
              onClick={handleReserve}
              disabled={loading || book.available_copies <= 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-600/20"
            >
              {loading ? "Reserving..." : "Reserve Book"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
    )}
  </AnimatePresence>
  );
}
