"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

function HiveMark() {
  // simple hex/honeycomb icon
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-primary">
        <path
          fill="currentColor"
          d="M12 2 6 5v6l6 3 6-3V5l-6-3Zm0 9L6 8m6 3 6-3M6 13v6l6 3 6-3v-6l-6 3-6-3Z"
          stroke="currentColor"
          strokeWidth="1"
          fillOpacity="0.08"
        />
      </svg>
      <span className="font-semibold tracking-tight">Hive</span>
    </div>
  )
}

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/agents", label: "Agents" },
  { href: "/settings", label: "Settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="h-full flex flex-col">
      <HiveMark />
      <ul className="flex-1 px-2">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/")
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <span className="i-lucide-hexagon h-4 w-4" aria-hidden />
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="px-4 py-4 text-xs text-muted-foreground">v0 preview • P2P CI/CD</div>
    </nav>
  )
}
