"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      // Replace with real auth integration when ready (e.g., Supabase).
      console.log("[v0] Auth submit:", variant)
      await new Promise((r) => setTimeout(r, 600))
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
              <Input id="email" type="email" placeholder="you@company.com" required autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <Input
                id="password"
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
