import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-foreground/5">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Image src="/hive_logo.png" alt="Hive Logo" width={28} height={28} className="transition-transform group-hover:scale-105" />
          <span className="text-lg font-bold tracking-tight font-heading">
            Hive<sup className="text-[0.5em] text-muted-foreground ml-0.5">™</sup>
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-foreground/5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hive. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
