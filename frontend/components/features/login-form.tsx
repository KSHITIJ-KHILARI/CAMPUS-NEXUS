"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { BookOpen, Lock, Mail } from "lucide-react"
import { api } from "@/lib/api-client"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res: any = await api.auth.login({ email, password })
      const token = res?.access_token || res?.token
      const user = res?.user
      if (!token || !user) {
        setError("Authentication failed: server did not return a token.")
        setLoading(false)
        return
      }

      try {
        localStorage.setItem("auth_token", token)
        localStorage.setItem("auth_user", JSON.stringify(user))
        if (res.refresh_token) {
          localStorage.setItem("refresh_token", res.refresh_token)
        }
        setTokenCookie(token)
      } catch {
        //
      }

      const role = (user as any).role
      if (role === "admin") {
        router.push("/admin/dashboard")
      } else if (role === "faculty") {
        router.push("/faculty/dashboard")
      } else {
        router.push("/student/dashboard")
      }
      router.refresh()
    } catch (err: any) {
      const msg =
        err?.status === 401
          ? "Invalid email or password."
          : err?.status === 422
          ? "Please enter both email and password."
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
    <Card className="p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-8 w-8 text-campus-primary" />
          <span className="text-2xl font-bold text-white">CAMPUS <span className="text-campus-primary">NEXUS</span></span>
        </div>
        <p className="text-sm text-gray-400">Somaiya Vidyavihar University</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-campus-red/10 border border-campus-red/20 rounded-xl">
            <p className="text-sm text-campus-red">{error}</p>
          </div>
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6">
        <p className="text-xs text-gray-400 text-center mb-3">Quick Demo Access</p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => quickLogin("student")} className="text-xs">
            Student
          </Button>
          <Button variant="outline" size="sm" onClick={() => quickLogin("faculty")} className="text-xs">
            Faculty
          </Button>
          <Button variant="outline" size="sm" onClick={() => quickLogin("admin")} className="text-xs">
            Admin
          </Button>
        </div>
      </div>

      <div className="text-center mt-4 space-y-1">
        <p className="text-xs text-gray-500">
          Demo password: <span className="font-mono text-gray-400">demo123</span>
        </p>
        <p className="text-[11px] text-gray-500">
          Built by <span className="text-gray-400 font-medium">Kshitij, Harshit &amp; Piyush</span>
        </p>
      </div>
    </Card>
  )
}