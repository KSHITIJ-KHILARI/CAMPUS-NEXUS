"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Box,
  BarChart3,
  Play,
  AlertTriangle,
  Calendar,
  Users,
  Settings,
  Command,
  ChevronLeft,
  ChevronRight,
  Siren,
  BookOpen,
  Search,
  GraduationCap,
  LogOut,
  Gauge,
  Map,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings-context"
import { useAuth } from "@/lib/auth"
import { EmergencySOSButton } from "@/components/emergency/emergency-sos-button"
import { LocationConsentBanner } from "@/components/ui/location-consent-banner"
import { Footer } from "@/components/ui/footer"

const navGroups = [
  {
    title: "Management",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/students", label: "Students", icon: GraduationCap },
      { href: "/admin/faculty", label: "Faculty", icon: Users },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
    ],
  },
  {
    title: "Campus",
    items: [
      { href: "/admin/digital-twin", label: "3D Digital Twin", icon: Box },
      { href: "/admin/control-center", label: "Campus Control", icon: Gauge },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/events", label: "Events", icon: Calendar },
      { href: "/admin/library", label: "Library", icon: BookOpen },
      { href: "/admin/lost-found", label: "Lost & Found", icon: Search },
      { href: "/admin/emergency", label: "Emergency", icon: Siren },
      { href: "/admin/issues", label: "Issues", icon: AlertTriangle },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings & Preferences", icon: Settings },
    ],
  }
];

export default function AdminNav() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, openSettings } = useSettings()
  const { logout } = useAuth()

  // Flatten for mobile nav
  const flatNavItems = navGroups.flatMap(g => g.items)

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 glass-dark border-r border-white/5 z-50 transition-all duration-300",
          sidebarCollapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center h-16 px-4 border-b border-white/5">
            <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
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

          {/* Navigation — scrollable when content overflows viewport */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
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
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-campus-card text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-white/10 shadow-lg">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 space-y-1">
            {/* NEXUS AI indicator */}
            {!sidebarCollapsed && (
              <div className="glass-dark rounded-xl p-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Command className="h-4 w-4 text-campus-primary" />
                  <span className="text-xs font-medium text-campus-primary">NEXUS AI</span>
                </div>
                <p className="text-xs text-gray-400">Command center ready</p>
              </div>
            )}

            {/* Settings button */}
            <button
              onClick={openSettings}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full relative group",
                sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Preferences</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-campus-card text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-white/10 shadow-lg">
                  Preferences
                </div>
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
          {flatNavItems.slice(0, 5).map((item) => {
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
