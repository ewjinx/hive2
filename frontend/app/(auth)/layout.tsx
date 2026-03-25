import type { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="min-h-dvh flex flex-col">
        <header className="flex items-center justify-between px-6 py-4">
          {/* Brand - simple mark consistent with Hive */}
          <Link href="/" className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block size-5 rounded-[4px] bg-primary/90" />
            <span className="text-sm font-semibold tracking-tight">Hive</span>
          </Link>
          {/* Right-side slot filled by individual pages (login/signup toggle) */}
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="px-6 py-6">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hive. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  )
}
