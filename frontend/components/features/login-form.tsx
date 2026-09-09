"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { BookOpen, Lock, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { motion } from "framer-motion"

interface LoginFormProps {
  defaultRole?: string
}

function setTokenCookie(token: string) {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)
  document.cookie = `nexus_token=${encodeURIComponent(token)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
}

export default function LoginForm({ defaultRole = "student" }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await login(email, password)
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found'
          ? "Invalid email or password."
          : err?.message || "An error occurred. Please try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (role: string) => {
    const emails: Record<string, string> = {
      student: "student@somaiya.edu",
      faculty: "faculty@somaiya.edu",
      admin: "admin@somaiya.edu",
    }
    setEmail(emails[role] || "student@somaiya.edu")
    setPassword("demo123")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
    >
      <Card className="p-8 relative overflow-hidden">
        {/* Subtle gradient shimmer */}
        <div className="absolute inset-0 bg-gradient-to-br from-campus-primary/5 via-transparent to-campus-blue/5 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8 relative z-10"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.div
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <BookOpen className="h-8 w-8 text-campus-primary" />
            </motion.div>
            <span className="text-2xl font-bold text-white">CAMPUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-primary to-campus-blue">NEXUS</span></span>
          </div>
          <p className="text-sm text-gray-400">Somaiya Vidyavihar University</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-campus-red/10 border border-campus-red/20 rounded-xl"
            >
              <p className="text-sm text-campus-red">{error}</p>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@somaiya.edu"
                className="pl-10 bg-white/5 border-white/10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 bg-white/5 border-white/10"
                required
              />
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </motion.div>
        </motion.form>

        <motion.div
          className="mt-6 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <p className="text-xs text-gray-400 text-center mb-3">Quick Demo Access</p>
          <div className="grid grid-cols-3 gap-2">
            {(["student", "faculty", "admin"] as const).map((role, i) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" size="sm" onClick={() => quickLogin(role)} className="text-xs w-full capitalize">
                  {role}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="text-center mt-4 space-y-1 relative z-10">
          <p className="text-[11px] text-gray-500">
            Built by <span className="text-gray-400 font-medium">Kshitij, Harshit &amp; Piyush</span>
          </p>
        </div>
      </Card>
    </motion.div>
  )
}