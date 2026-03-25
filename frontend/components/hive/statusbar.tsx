"use client"

import useSWR from "swr"

import api from "@/lib/api"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

export function Statusbar() {
  const { data: analytics } = useSWR<{ agentsOnline: number }>("/api/analytics/summary", fetcher, {
    refreshInterval: 5000,
  })
  const { data: user } = useSWR<{ balance: number }>("/api/users/me", fetcher)

  return (
    <div className="bg-(--color-statusbar) text-(--color-statusbar-foreground) border-t">
      <div className="flex h-8 items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: analytics?.agentsOnline ? "var(--online)" : "var(--border)",
              }}
            />
            {analytics?.agentsOnline ? "Online" : "Offline"}
          </span>
          <span className="text-muted-foreground">v0 preview • P2P CI/CD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Credits</span>
          <span className="font-medium">{user?.balance ? user.balance.toFixed(2) : 0}</span>
        </div>
      </div>
    </div>
  )
}
