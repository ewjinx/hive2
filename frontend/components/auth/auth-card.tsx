"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import api from "@/lib/api"

export function AuthCard({
  variant,
}: {
  variant: "signup" | "login"
}) {
  const [loading, setLoading] = useState(false)

  const title = variant === "signup" ? "Welcome to Hive" : "Welcome back"
  const description =
    variant === "signup"
      ? "Create an account to run distributed builds and tests with Hive."
      : "Sign in to continue orchestrating your distributed CI/CD jobs."

  const buttonLabel = variant === "signup" ? "Create Account" : "Log In"
  const bottomPrompt =
    variant === "signup"
      ? { text: "Already have an account?", href: "/login", cta: "Log In" }
      : { text: "New to Hive?", href: "/signup", cta: "Create an account" }

  const router = useRouter() // Import likely needed, adding import in separate block or verify exisiting

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      if (variant === "signup") {
        // Register
        await api.post("/api/users/", { email, password })
        toast.success("Account created! Logging you in...")
      }

      // Login (for both explicit login and auto-login after signup)
      const params = new URLSearchParams()
      params.append("username", email)
      params.append("password", password)

      const res = await api.post("/api/login/access-token", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      localStorage.setItem("token", res.data.access_token)
      toast.success("Welcome back!")
      router.push("/dashboard")
      router.refresh() // Ensure middleware/layout state updates
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Card className="bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70 border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-balance text-2xl font-semibold">{title}</CardTitle>
          <CardDescription className="text-center text-pretty">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input id="email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete={variant === "signup" ? "new-password" : "current-password"}
              />
            </div>

            {/* Captcha-like placeholder box for visual parity without an external dependency */}
            <div
              aria-label="Verification placeholder"
              className="rounded-md border bg-muted/30 px-3 py-3 text-xs text-muted-foreground"
            >
              {"I’m not a robot (placeholder)"}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (variant === "signup" ? "Creating..." : "Signing in...") : buttonLabel}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to our{" "}
              <Link href="#" className="underline underline-offset-4 hover:text-foreground">
                terms
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline underline-offset-4 hover:text-foreground">
                privacy policy
              </Link>
              .
            </p>
          </form>

          {/* Social proof row */}
          <div className="mt-8">
            <p className="text-center text-sm text-muted-foreground">Join the community</p>
            <div className="mt-3 grid grid-cols-4 items-center gap-4 opacity-70">
              {/* Placeholder logos — replace with real logos later */}
              <div className="h-6 rounded bg-muted" />
              <div className="h-6 rounded bg-muted" />
              <div className="h-6 rounded bg-muted" />
              <div className="h-6 rounded bg-muted" />
            </div>
          </div>

          {/* Bottom prompt */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {bottomPrompt.text}{" "}
            <Link href={bottomPrompt.href} className="font-medium text-primary underline-offset-4 hover:underline">
              {bottomPrompt.cta}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
