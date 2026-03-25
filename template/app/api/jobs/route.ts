import { NextResponse } from "next/server"
import { getStore, type Job } from "../_store"

export async function GET() {
  const s = getStore()
  // return newest first
  return NextResponse.json([...s.jobs].reverse())
}

export async function POST(req: Request) {
  const s = getStore()
  const form = await req.formData()
  const repo = String(form.get("repo") || "") || undefined
  const name = repo ? repo.split("/").slice(-1)[0] : "uploaded-project"
  const cpu = Number(form.get("cpu") || 2)
  const mem = Number(form.get("mem") || 4)
  const parallel = String(form.get("parallel")) === "on"
  const id = Math.random().toString(36).slice(2, 9)
  const job: Job = {
    id,
    name,
    repo,
    cpu,
    mem,
    parallel,
    status: "running",
    logs: ["Initializing containers...", "Pulling dependencies...", "Starting build..."],
    metrics: [],
  }
  s.jobs.push(job)
  return NextResponse.json({ id })
}
