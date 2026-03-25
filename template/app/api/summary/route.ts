import { NextResponse } from "next/server"
import { getStore } from "../_store"

export async function GET() {
  const s = getStore()
  const queue = s.jobs.filter((j) => j.status === "pending" || j.status === "running" || j.status === "paused").length
  const completed = s.jobs.filter((j) => j.status === "completed").length
  const agentsOnline = s.agents.filter((a) => a.participating).length
  return NextResponse.json({ queue, completed, agentsOnline, credits: s.credits, online: agentsOnline > 0 })
}
