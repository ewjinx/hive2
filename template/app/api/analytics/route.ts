import { NextResponse } from "next/server"

export async function GET() {
  // Basic pseudo-random walk to make data feel "live"
  const points = 28
  const now = Date.now()
  const step = 12_000 // 12s between points

  // seeded random-ish based on time
  const seed = Math.floor(now / 3000)
  function rand(n: number, scale = 1) {
    return (Math.sin(seed + n) + 1) * 0.5 * scale
  }

  const durations = Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - i) * step)
    const base = 40 + rand(i, 25) + (i % 7 === 0 ? 10 : 0) // seconds
    return {
      time: t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      avgDuration: Math.max(10, Math.round(base)),
    }
  })

  const resources = Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - i) * step)
    const cpu = Math.min(100, Math.max(6, Math.round(25 + rand(i, 55))))
    const mem = Math.min(100, Math.max(8, Math.round(30 + rand(i + 1, 45))))
    return {
      time: t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      cpu,
      memory: mem,
    }
  })

  // Job distribution adds some variability
  const pending = Math.round(6 + rand(2, 10))
  const running = Math.round(8 + rand(4, 12))
  const completed = Math.round(60 + rand(6, 40))
  const failed = Math.round(3 + rand(1, 6))

  const creditsEarned = Math.round(800 + rand(3, 400))
  const creditsSpent = Math.round(450 + rand(5, 300))

  return NextResponse.json({
    jobDistribution: { pending, running, completed, failed },
    durations,
    resources,
    credits: { earned: creditsEarned, spent: creditsSpent },
  })
}
