import { NextResponse } from "next/server"
import { getStore } from "../_store"

export async function GET() {
  const s = getStore()
  return NextResponse.json(s.agents)
}

export async function PATCH(req: Request) {
  const s = getStore()
  const body = await req.json()
  const a = s.agents.find((x) => x.id === body.id)
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 })
  Object.assign(a, {
    cpuLimit: body.cpuLimit ?? a.cpuLimit,
    memLimit: body.memLimit ?? a.memLimit,
    participating: body.participating ?? a.participating,
  })
  return NextResponse.json(a)
}
