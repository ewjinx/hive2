"use client"

import useSWR from "swr"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export function Statusbar() {
  const { data } = useSWR<{ credits: number; online: boolean }>("/api/summary", fetcher, {
    refreshInterval: 3000,
  })

  return (
    <div className="bg-(--color-statusbar) text-(--color-statusbar-foreground) border-t">
      <div className="flex h-8 items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: data?.online ? "var(--online)" : "var(--border)",
              }}
            />
            {data?.online ? "Online" : "Offline"}
          </span>
          <span className="text-muted-foreground">v0 preview • P2P CI/CD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Credits</span>
          <span className="font-medium">{data?.credits ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
