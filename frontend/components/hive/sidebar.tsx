"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"

function HiveMark() {
  // simple hex/honeycomb icon
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <Image src="/hive_logo.png" alt="Hive Logo" width={24} height={24} />
      <span className="font-semibold tracking-tight">Hive</span>
    </div>
  )
}

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/agents", label: "Agents" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settings", label: "Settings" },
]

import useSWR from "swr"
import api from "@/lib/api"

const fetcher = (url: string) => api.get(url).then((res) => res.data)

export function Sidebar() {
  const pathname = usePathname()
  const { data: user } = useSWR("/api/users/me", fetcher)

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
      
      {/* Credit Balance Display */}
      {user && (
        <div className="px-4 py-3 mx-2 mb-2 rounded-lg bg-secondary/50 border border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Balance</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">{user.balance.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">credits</span>
          </div>
        </div>
      )}
      
      <div className="px-4 pb-2 pt-1 border-t mt-auto">
        <button 
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2 py-2"
        >
          <span className="i-lucide-log-out h-4 w-4" aria-hidden />
          Logout
        </button>
      </div>
      <div className="px-4 pb-4 text-xs text-muted-foreground/60">v0 preview • P2P CI/CD</div>
    </nav>
  )
}
