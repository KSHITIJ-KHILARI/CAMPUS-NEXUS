"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-6">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
      >
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-[-12px] bg-campus-primary/10 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Inner glow */}
        <div className="absolute inset-0 bg-campus-primary/20 blur-xl rounded-full" />
        <Sparkles className="h-10 w-10 text-campus-primary relative z-10" />
      </motion.div>

      <div className="flex items-center gap-1">
        <motion.p
          className="text-gray-400 text-sm font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Syncing NEXUS Data
        </motion.p>
        {/* Animated dots */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="text-campus-primary text-sm font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            .
          </motion.span>
        ))}
      </div>
    </div>
  );
}
