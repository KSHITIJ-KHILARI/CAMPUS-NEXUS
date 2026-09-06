import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "maplibre-gl/dist/maplibre-gl.css"
import { AuthProvider } from "@/lib/auth"
import { SettingsProvider } from "@/lib/settings-context"
import { LocationProvider } from "@/lib/location-context"
import SettingsModal from "@/components/ui/settings-modal"
import { QueryProvider } from "@/lib/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Campus NEXUS | Somaiya Vidyavihar University",
  description: "AI-powered Digital Twin and Campus Intelligence Platform for Somaiya Vidyavihar University",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
           <AuthProvider>
             <SettingsProvider>
               <LocationProvider>
                 {children}
                 <SettingsModal />
               </LocationProvider>
             </SettingsProvider>
           </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}