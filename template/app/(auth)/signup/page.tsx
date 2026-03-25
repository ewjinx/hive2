import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"

export default function SignupPage() {
  return (
    <div className="relative">
      <div className="absolute right-0 top-0 -translate-y-10 sm:translate-y-0 px-0 sm:px-6">
        <div className="flex justify-end">
          <span className="text-sm text-muted-foreground">Already got an account?</span>
          <Link
            href="/login"
            className="ml-3 inline-flex items-center rounded-md bg-primary/90 px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary"
          >
            Log In
          </Link>
        </div>
      </div>

      <AuthCard variant="signup" />
    </div>
  )
}
