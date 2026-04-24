import type { ReactNode } from "react"
import { Sidebar } from "@/components/hive/sidebar"
import { Navbar } from "@/components/hive/navbar"
import { AuthGuard } from "@/components/auth-guard"

export default function HiveLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh flex flex-col bg-background">
        {/* Top Navbar */}
        <Navbar />

        {/* App body: Sidebar + Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block border-r border-foreground/5 bg-sidebar">
            <Sidebar />
          </aside>
          <main className="min-h-0 p-6 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
