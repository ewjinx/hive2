"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import useSWR from "swr"
import api from "@/lib/api"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        document.documentElement.classList.toggle("dark")
      }}
      className="rounded-full bg-secondary hover:bg-secondary/80"
      title="Toggle theme"
    >
      <svg className="h-5 w-5 dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <svg className="h-5 w-5 hidden dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    </Button>
  )
}

export function Navbar() {
  const { data: user } = useSWR<{ balance: number; email: string }>("/api/users/me", fetcher)
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-6 border-b border-foreground/10">
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Image src="/hive_logo.png" alt="Hive Logo" width={28} height={28} className="transition-transform group-hover:scale-105" />
          <span className="text-lg font-bold tracking-tight font-heading">
            Hive<sup className="text-[0.5em] text-muted-foreground ml-0.5">™</sup>
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5">
              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.93-3.12 3.19z"/>
              </svg>
              <span className="text-sm font-bold">{user.balance.toFixed(2)}</span>
            </div>
          )}
          <ThemeToggle />
          <Avatar className="h-9 w-9 border-2 border-primary/30 cursor-pointer hover:border-primary transition-colors">
            <AvatarFallback className="bg-primary/20 text-foreground font-bold text-xs">
              {user?.email ? user.email.charAt(0).toUpperCase() : "H"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
