import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"

export default function LoginPage() {
  return (
    <div className="relative">
      <div className="absolute right-0 top-0 -translate-y-10 sm:translate-y-0 px-0 sm:px-6">
        <div className="flex justify-end">
          <span className="text-sm text-muted-foreground">Need an account?</span>
          <Link
            href="/signup"
            className="ml-3 inline-flex items-center rounded-md bg-primary/90 px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary"
          >
            Create Account
          </Link>
        </div>
      </div>

      <AuthCard variant="login" />
    </div>
  )
}
