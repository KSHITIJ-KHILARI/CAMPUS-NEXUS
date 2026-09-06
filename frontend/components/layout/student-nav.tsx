"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {   Home, Map, CalendarDays, Activity, Bot, Bell, Search, BookOpen, Settings, ChevronLeft, ChevronRight, User, Users, LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useSettings } from "@/lib/settings-context"
import { useAuth } from "@/lib/auth"
import { EmergencySOSButton } from "@/components/emergency/emergency-sos-button"
import { LocationConsentBanner } from "@/components/ui/location-consent-banner"
import { Footer } from "@/components/ui/footer"

const navItems = [
  { href: "/student/dashboard", label: "Home", icon: Home },
  { href: "/student/map", label: "Map", icon: Map },
  { href: "/student/my-day", label: "My Day", icon: CalendarDays },
  { href: "/student/pulse", label: "Pulse", icon: Activity },
  { href: "/student/explore", label: "Explore", icon: Search },
  { href: "/student/events", label: "Events", icon: CalendarDays },
  { href: "/student/faculty", label: "Faculty", icon: Users },
  { href: "/student/portfolio", label: "Portfolio", icon: BookOpen },
  { href: "/student/profile", label: "Profile", icon: User },
  { href: "/student/lost-found", label: "Lost & Found", icon: BookOpen },
  { href: "/student/ai", label: "NEXUS AI", icon: Bot },
  { href: "/student/notifications", label: "Alerts", icon: Bell },
  { href: "/student/tour", label: "360 Campus Tour", icon: Map },
  { href: "/student/settings", label: "Settings", icon: Settings },
]

export default function StudentNav() {
  const pathname = usePathname()
  const [notifications] = useState(3)
  const { sidebarCollapsed, toggleSidebar, openSettings } = useSettings()
  const { logout } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 glass-dark border-r border-white/5 z-50 transition-all duration-300",
          sidebarCollapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center h-16 px-4 border-b border-white/5">
            <Link href="/student/dashboard" className="flex items-center gap-2 min-w-0">
              {sidebarCollapsed ? (
                <span className="text-xl font-bold text-campus-primary mx-auto">N</span>
              ) : (
                <>
                  <span className="text-xl font-bold text-campus-primary">CAMPUS</span>
                  <span className="text-xl font-bold text-white">NEXUS</span>
                </>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                    sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
                    isActive
                      ? "bg-campus-primary/10 text-campus-primary"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {!sidebarCollapsed && item.label === "Alerts" && notifications > 0 && (
                    <span className="ml-auto bg-campus-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                  {sidebarCollapsed && item.label === "Alerts" && notifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-campus-red text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-campus-card text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-white/10 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 space-y-1">
            {/* Settings button */}
            <button
              onClick={openSettings}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full relative group",
                sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-campus-card text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-white/10 shadow-lg">
                  Settings
                </div>
              )}
            </button>

            {/* Collapse toggle */}
            <button
              onClick={toggleSidebar}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full",
                sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              )}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 flex-shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 flex-shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full relative group",
                sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              )}
              title="Logout"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-campus-card text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-white/10 shadow-lg">
                  Logout
                </div>
              )}
            </button>

            {!sidebarCollapsed && <Footer isSidebar />}
          </div>
        </div>
      </aside>

      {/* Emergency SOS & Location Consent */}
      <EmergencySOSButton />
      <LocationConsentBanner />

      {/* Spacer for fixed sidebar */}
      <div className={cn("hidden md:block flex-shrink-0 transition-all duration-300", sidebarCollapsed ? "md:w-[72px]" : "md:w-64")} />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                  isActive ? "text-campus-primary" : "text-gray-400"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
