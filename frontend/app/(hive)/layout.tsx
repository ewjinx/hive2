import type { ReactNode } from "react"
import { Sidebar } from "@/components/hive/sidebar"
import { Titlebar } from "@/components/hive/titlebar"
import { AppMenubar } from "@/components/hive/app-menubar"
import { Statusbar } from "@/components/hive/statusbar"
import { AuthGuard } from "@/components/auth-guard"

export default function HiveLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh grid grid-rows-[auto_auto_1fr_auto]">
        {/* Desktop titlebar */}
        <Titlebar />

        {/* App menu bar */}
        <div className="border-b">
          <AppMenubar />
        </div>

        {/* App body */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block border-r bg-sidebar text-sidebar-foreground">
            <Sidebar />
          </aside>
          <main className="min-h-0 p-4 md:p-6">{children}</main>
        </div>

        {/* Desktop status bar */}
        <Statusbar />
      </div>
    </AuthGuard>
  )
}
