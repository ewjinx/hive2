"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
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

  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      if (variant === "signup") {
        await api.post("/api/users/", { email, password })
        toast.success("Account created! Logging you in...")
      }

      const params = new URLSearchParams()
      params.append("username", email)
      params.append("password", password)

      const res = await api.post("/api/login/access-token", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      localStorage.setItem("token", res.data.access_token)
      toast.success("Welcome back!")
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Auth Card */}
      <div className="bg-card rounded-3xl border border-foreground/10 p-8 md:p-10">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-center text-3xl font-bold font-heading">{title}</h1>
          <p className="text-center text-muted-foreground text-sm">{description}</p>
        </div>

        {/* Form */}
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-semibold">
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

          {/* Captcha placeholder */}
          <div
            aria-label="Verification placeholder"
            className="rounded-xl border border-foreground/10 bg-accent px-4 py-3 text-xs text-muted-foreground flex items-center gap-3"
          >
            <div className="h-5 w-5 rounded border-2 border-foreground/20" />
            <span>{"I'm not a robot"}</span>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
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
            </Link>.
          </p>
        </form>

        {/* Bottom prompt */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {bottomPrompt.text}{" "}
          <Link href={bottomPrompt.href} className="font-bold text-foreground underline-offset-4 hover:underline">
            {bottomPrompt.cta}
          </Link>
        </div>
      </div>
    </div>
  )
}
