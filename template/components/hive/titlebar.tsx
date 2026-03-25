"use client"

import Link from "next/link"

function WindowControls() {
  // purely visual window buttons
  return (
    <div className="flex items-center gap-2">
      <button aria-label="Close window" className="h-3 w-3 rounded-full bg-red-500/90 shadow-xs" title="Close" />
      <button
        aria-label="Minimize window"
        className="h-3 w-3 rounded-full bg-amber-400/90 shadow-xs"
        title="Minimize"
      />
      <button
        aria-label="Maximize window"
        className="h-3 w-3 rounded-full bg-green-500/90 shadow-xs"
        title="Maximize"
      />
    </div>
  )
}

export function Titlebar() {
  return (
    <div className="bg-(--color-titlebar) text-(--color-titlebar-foreground) border-b">
      <div className="flex h-10 items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <WindowControls />
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="text-primary">
              <path
                fill="currentColor"
                d="M12 2 6 5v6l6 3 6-3V5l-6-3Zm0 9L6 8m6 3 6-3M6 13v6l6 3 6-3v-6l-6 3-6-3Z"
                stroke="currentColor"
                strokeWidth="1"
                fillOpacity="0.08"
              />
            </svg>
            <span className="text-sm font-medium tracking-tight">Hive</span>
          </Link>
        </div>

        <div className="text-xs text-muted-foreground">Distributed CI/CD</div>
      </div>
    </div>
  )
}
