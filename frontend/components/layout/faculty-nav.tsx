"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  Settings,
  ChevronLeft,
  Clock,
  LogOut,
  Map,
  Compass,
  BookOpen,
  DoorOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings-context"
import { useAuth } from "@/lib/auth"
import { EmergencySOSButton } from "@/components/emergency/emergency-sos-button"
import { LocationConsentBanner } from "@/components/ui/location-consent-banner"
import { Footer } from "@/components/ui/footer"
import { NotificationCenter, useNotifications } from "@/components/ui/notification-center"
import { motion, AnimatePresence } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/faculty/dashboard", label: "Campus", icon: LayoutDashboard },
      { href: "/faculty/tour", label: "3D Digital Twin", icon: Compass },
    ],
  },
  {
    title: "Academics",
    items: [
      { href: "/faculty/classes", label: "My Classes", icon: Users },
      { href: "/faculty/classroom", label: "Classroom Notes", icon: BookOpen },
      { href: "/faculty/rooms", label: "Vacant Rooms", icon: DoorOpen },
      { href: "/faculty/students", label: "Students", icon: Users },
      { href: "/faculty/schedule", label: "Timetable", icon: Calendar },
      { href: "/faculty/availability", label: "Availability", icon: Clock },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/faculty/events", label: "Events", icon: Calendar },
      { href: "/faculty/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Nexus",
    items: [
      { href: "/faculty/ai", label: "NEXUS AI", icon: LayoutDashboard },
      { href: "/faculty/profile", label: "Profile", icon: Users },
    ],
  }
];

const iconMicroAnimations: Record<string, string> = {
  "Campus": "group-hover:-translate-y-0.5",
  "3D Digital Twin": "group-hover:rotate-45",
  "My Classes": "group-hover:scale-105",
  "Classroom Notes": "group-hover:scale-105 group-hover:rotate-[-4deg]",
  "Vacant Rooms": "group-hover:translate-x-0.5",
  "Students": "group-hover:scale-105",
  "Timetable": "group-hover:scale-110",
  "Availability": "group-hover:rotate-45",
  "Events": "group-hover:scale-110",
  "Notifications": "group-hover:rotate-[-12deg]",
  "NEXUS AI": "group-hover:scale-110 group-hover:text-cyan-400",
  "Profile": "group-hover:scale-105",
};

export default function FacultyNav() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, openSettings } = useSettings()
  const { logout } = useAuth()
  const { unreadCount } = useNotifications()
  const prefersReduced = useReducedMotion()

  // Flatten for mobile nav
  const flatNavItems = navGroups.flatMap((g) => g.items)

  const navContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.035,
        delayChildren: 0.05,
      },
    },
  }

  const navItemVariants = {
    hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, x: -8 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.22, ease: "easeOut" },
    },
  }

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: prefersReduced ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 glass-dark border-r border-white/5 z-50 overflow-hidden shadow-2xl"
      >
        <div className="flex flex-col flex-1 min-h-0 w-[256px]">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/5 flex-shrink-0">
            <Link href="/faculty/dashboard" className="flex items-center gap-2 min-w-0 group">
              {sidebarCollapsed ? (
                <span className="text-xl font-bold text-campus-primary w-8 text-center transition-transform group-hover:scale-110 duration-200">
                  N
                </span>
              ) : (
                <div className="flex items-center gap-1.5 transition-transform group-hover:scale-[1.02] duration-200">
                  <span className="text-xl font-bold text-campus-primary tracking-tight">CAMPUS</span>
                  <span className="text-xl font-bold text-white tracking-tight">NEXUS</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-1">
                    FACULTY
                  </span>
                </div>
              )}
            </Link>
            {!sidebarCollapsed && <NotificationCenter />}
          </div>

          {/* Navigation — scrollable with smooth scrollbar */}
          <motion.nav
            variants={navContainerVariants}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4 sidebar-scroll"
          >
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-2 px-3 mb-2 pt-1">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                      {group.title}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  const iconAnim = iconMicroAnimations[item.label] || "group-hover:scale-105"

                  return (
                    <motion.div key={item.href} variants={navItemVariants}>
                      <Link
                        href={item.href}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative group overflow-hidden select-none",
                          sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
                          isActive
                            ? "text-white font-semibold"
                            : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                        )}
                      >
                        {/* Animated glowing active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId={prefersReduced ? undefined : "facultyActiveNavIndicator"}
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-campus-primary/25 via-campus-primary/10 to-transparent border border-campus-primary/30 shadow-[0_0_18px_rgba(165,28,48,0.22)] pointer-events-none"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-campus-primary shadow-[0_0_8px_rgba(165,28,48,0.9)]" />
                          </motion.div>
                        )}

                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0 relative z-10 transition-transform duration-200 ease-out",
                            isActive ? "text-campus-primary" : "text-gray-400 group-hover:text-white",
                            !prefersReduced && iconAnim
                          )}
                        />

                        <AnimatePresence initial={false}>
                          {!sidebarCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -4 }}
                              transition={{ duration: 0.16, ease: "easeInOut" }}
                              className="relative z-10 whitespace-nowrap overflow-hidden"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {!sidebarCollapsed && item.label === "Notifications" && unreadCount > 0 && (
                          <div className="ml-auto relative flex items-center justify-center z-10">
                            {!prefersReduced && (
                              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40 duration-1000 pointer-events-none" />
                            )}
                            <motion.span
                              key={unreadCount}
                              initial={prefersReduced ? false : { scale: 0.6, opacity: 0 }}
                              animate={{ scale: [1, 1.3, 1], opacity: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 14 }}
                              className="relative px-1.5 py-0.5 bg-campus-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg shadow-red-500/30 border border-red-400/40"
                            >
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </motion.span>
                          </div>
                        )}

                        {sidebarCollapsed && item.label === "Notifications" && unreadCount > 0 && (
                          <div className="absolute top-1 right-2 z-10">
                            {!prefersReduced && (
                              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40 duration-1000 pointer-events-none" />
                            )}
                            <motion.span
                              key={unreadCount}
                              initial={prefersReduced ? false : { scale: 0.6, opacity: 0 }}
                              animate={{ scale: [1, 1.3, 1], opacity: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 14 }}
                              className="relative bg-campus-red text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md shadow-red-500/30 border border-red-400/40"
                            >
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </motion.span>
                          </div>
                        )}

                        {sidebarCollapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900/95 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 pointer-events-none transition-all duration-200 whitespace-nowrap z-[60] border border-white/10 shadow-2xl backdrop-blur-md">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </motion.nav>

          {/* Footer Controls */}
          <div className="p-3 border-t border-white/5 space-y-1 flex-shrink-0">
            <button
              onClick={openSettings}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-200 w-full relative group select-none",
                sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-300 ease-out" />
              <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.16 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Preferences
                  </motion.span>
                )}
              </AnimatePresence>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900/95 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 pointer-events-none transition-all duration-200 whitespace-nowrap z-[60] border border-white/10 shadow-2xl backdrop-blur-md">
                  Preferences
                </div>
              )}
            </button>

            <button
              onClick={toggleSidebar}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-200 w-full group select-none",
                sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              )}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.div
                animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.28, ease: "easeInOut" }}
                className="h-5 w-5 flex items-center justify-center flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.div>
              <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.16 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Collapse
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={logout}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 active:scale-[0.98] transition-all duration-200 w-full relative group select-none",
                sidebarCollapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"
              )}
              title="Logout"
            >
              <LogOut className="h-5 w-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform duration-200 ease-out" />
              <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.16 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900/95 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 pointer-events-none transition-all duration-200 whitespace-nowrap z-[60] border border-white/10 shadow-2xl backdrop-blur-md">
                  Logout
                </div>
              )}
            </button>

            {!sidebarCollapsed && <Footer isSidebar />}
          </div>
        </div>
      </motion.aside>

      {/* Emergency SOS & Location Consent */}
      <EmergencySOSButton />
      <LocationConsentBanner />

      {/* Spacer for fixed sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: prefersReduced ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:block flex-shrink-0"
      />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 z-50">
        <div className="flex items-center justify-around py-2">
          {flatNavItems.slice(0, 6).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative",
                  isActive ? "text-campus-primary" : "text-gray-400"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="facultyMobileActiveNavIndicator"
                    className="absolute inset-0 bg-campus-primary/10 rounded-lg"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-5 w-5 relative z-10" />
                <span className="text-xs relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
