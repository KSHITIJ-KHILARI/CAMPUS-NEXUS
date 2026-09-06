"use client"

import { useEffect, useRef } from "react"
import { X, Sun, Moon, Monitor, PanelLeftClose, PanelLeft, Bell, BellOff, User, LogOut, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/lib/settings-context"
import { useAuth } from "@/lib/auth"
import { LocationTrackingControl } from "@/components/ui/location-tracking-control"

export default function SettingsModal() {
  const { theme, setTheme, sidebarCollapsed, setSidebarCollapsed, settingsOpen, closeSettings } = useSettings()
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { logout } = useAuth() as any
  const router = useRouter()

  // Close on Escape key
  useEffect(() => {
    if (!settingsOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSettings()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [settingsOpen, closeSettings])

  // Prevent body scroll when open
  useEffect(() => {
    if (settingsOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [settingsOpen])

  if (!settingsOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      closeSettings()
    }
  }

  const handleLogout = async () => {
    closeSettings()
    if (logout) {
      await logout()
    } else {
      try {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
        document.cookie = "nexus_token=; path=/; max-age=0"
      } catch {
        //
      }
      router.push("/")
    }
  }

  const themeOptions: { value: "system" | "light" | "dark"; label: string; icon: React.ReactNode }[] = [
    { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  ]

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md bg-campus-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeSettings}
            className="rounded-full h-8 w-8 p-0"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Appearance */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Appearance</h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    theme === opt.value
                      ? "border-campus-primary bg-campus-primary/10 text-campus-primary"
                      : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {opt.icon}
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Sidebar</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  !sidebarCollapsed
                    ? "border-campus-primary bg-campus-primary/10 text-campus-primary"
                    : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <PanelLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Expanded</span>
              </button>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  sidebarCollapsed
                    ? "border-campus-primary bg-campus-primary/10 text-campus-primary"
                    : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-sm font-medium">Collapsed</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Notifications</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-white">Push Notifications</span>
                </div>
                <span className="text-xs text-campus-green font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <BellOff className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-white">Email Alerts</span>
                </div>
                <span className="text-xs text-campus-green font-medium">Enabled</span>
              </div>
            </div>
          </div>

          {/* Location Tracking (Student & Faculty) */}
          <LocationTrackingControl />

          {/* Account */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-3">Account</h3>
            <div className="p-3 bg-white/5 rounded-xl mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-campus-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-campus-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Campus NEXUS User</p>
                  <p className="text-xs text-gray-400">Somaiya Vidyavihar University</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-campus-red border-campus-red/20 hover:bg-campus-red/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <p className="text-xs text-gray-500 text-center">Campus NEXUS v0.1.0 · Somaiya Vidyavihar University</p>
        </div>
      </div>
    </div>
  )
}
