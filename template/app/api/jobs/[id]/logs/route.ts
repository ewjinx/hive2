import { NextResponse } from "next/server"
import { getStore } from "../../../_store"

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const s = getStore()
  const job = s.jobs.find((j) => j.id === params.id)
  if (!job) return NextResponse.json({ logs: [], metrics: [] })

  // simulate new logs & metrics on each poll
  const step = job.logs.length + 1
  if (job.status === "running") {
    job.logs.push(`[${new Date().toISOString()}] Step ${step}: working...`)
    if (Math.random() > 0.9) job.status = "completed"
  }

  const t = new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })
  job.metrics.push({ t, cpu: rand(15, 95), mem: rand(20, 90) })
  job.metrics = job.metrics.slice(-20)

  return NextResponse.json({ logs: job.logs.slice(-200), metrics: job.metrics })
}
