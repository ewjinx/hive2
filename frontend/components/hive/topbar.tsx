"use client"

import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import api from "@/lib/api"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

function ThemeToggle() {
  // simple dark/light toggle by toggling .dark on <html>
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        const html = document.documentElement
        html.classList.toggle("dark")
      }}
      className="text-muted-foreground"
      title="Toggle theme"
    >
      <span className="i-lucide-sun h-5 w-5 dark:hidden" />
      <span className="i-lucide-moon h-5 w-5 hidden dark:inline" />
    </Button>
  )
}

export function Topbar() {
  const { data: analytics } = useSWR<{ agentsOnline: number }>("/api/analytics/summary", fetcher, {
    refreshInterval: 5000,
  })
  const { data: user } = useSWR<{ balance: number }>("/api/users/me", fetcher)

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-(--color-online)" aria-hidden />
            {analytics?.agentsOnline ? "Online" : "Offline"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">Credits: {user?.balance ? user.balance.toFixed(2) : 0}</Badge>
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-foreground/80">HX</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
