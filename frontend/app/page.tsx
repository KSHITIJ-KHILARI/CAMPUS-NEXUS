"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-campus-darker flex flex-col items-center justify-between overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-campus-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-campus-blue/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex-1 flex items-center justify-center max-w-md w-full p-6 relative z-10">
        <motion.div 
          className="w-full space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
              Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-primary to-campus-blue">NEXUS</span>
            </h1>
            <p className="text-gray-300 font-medium">
              The Intelligence Layer for a Living Campus
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Somaiya Vidyavihar University
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h2 className="text-xl font-semibold text-center text-white relative z-10">
              Welcome to Campus NEXUS
            </h2>
            <p className="text-gray-400 text-center text-sm relative z-10">
              Your AI-powered campus companion. Navigate, schedule, and stay informed.
            </p>

            <div className="space-y-4 relative z-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/auth/login")}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-campus-primary to-campus-blue hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                Sign In
              </motion.button>
              <div className="text-center text-xs text-gray-500">
                Demo accounts: student / faculty / admin @somaiya.edu
              </div>
            </div>

            <div className="border-t border-white/10 pt-5 relative z-10">
              <h3 className="text-xs font-medium text-gray-400 mb-3 text-center uppercase tracking-wider">Quick Access</h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/auth/login?role=student")}
                  className="p-3 glass-dark rounded-xl text-center hover:bg-white/10 transition-colors border border-white/5 hover:border-campus-green/50"
                >
                  <div className="text-campus-green font-semibold">Student</div>
                </motion.button>
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/auth/login?role=faculty")}
                  className="p-3 glass-dark rounded-xl text-center hover:bg-white/10 transition-colors border border-white/5 hover:border-campus-blue/50"
                >
                  <div className="text-campus-blue font-semibold">Faculty</div>
                </motion.button>
                <motion.button 
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/auth/login?role=admin")}
                  className="p-3 glass-dark rounded-xl text-center hover:bg-white/10 transition-colors border border-white/5 hover:border-campus-purple/50"
                >
                  <div className="text-campus-purple font-semibold">Admin</div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}