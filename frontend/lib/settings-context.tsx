"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

type Theme = "system" | "light" | "dark"

interface SettingsContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  mounted: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const THEME_KEY = "nexus-theme"
const SIDEBAR_KEY = "nexus-sidebar-collapsed"

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return

  const root = document.documentElement
  root.classList.remove("light", "dark")

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.add(prefersDark ? "dark" : "light")
  } else {
    root.classList.add(theme)
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Server-safe defaults — these produce stable HTML on server render
  const [theme, setThemeState] = useState<Theme>("dark")
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // After hydration, read persisted preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null
    const savedSidebar = localStorage.getItem(SIDEBAR_KEY)

    if (savedTheme && ["system", "light", "dark"].includes(savedTheme)) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme("dark")
    }

    if (savedSidebar !== null) {
      setSidebarCollapsedState(savedSidebar === "true")
    }

    setMounted(true)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const current = localStorage.getItem(THEME_KEY) as Theme | null
      if (!current || current === "system") {
        applyTheme("system")
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
    applyTheme(newTheme)
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed)
    localStorage.setItem(SIDEBAR_KEY, String(collapsed))
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        settingsOpen,
        openSettings,
        closeSettings,
        mounted,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}
