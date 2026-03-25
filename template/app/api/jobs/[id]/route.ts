import { NextResponse } from "next/server"
import { getStore } from "../../_store"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const s = getStore()
  const job = s.jobs.find((j) => j.id === params.id)
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = getStore()
  const body = await req.json()
  const job = s.jobs.find((j) => j.id === params.id)
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 })
  if (body.action === "pause") job.status = "paused"
  if (body.action === "resume") job.status = "running"
  return NextResponse.json(job)
}
