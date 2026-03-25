"use client"

import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

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
  const { data } = useSWR<{ credits: number; online: boolean }>("/api/summary", fetcher, {
    refreshInterval: 3000,
  })

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <span className="h-2 w-2 rounded-full bg-(--color-online)" aria-hidden />
            {data?.online ? "Online" : "Offline"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">Credits: {data?.credits ?? 0}</Badge>
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-foreground/80">HX</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
