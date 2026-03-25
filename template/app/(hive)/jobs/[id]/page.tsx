"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogPanel } from "@/components/hive/log-panel"
import { StatusDot } from "@/components/hive/status-indicator"
import { useParams } from "next/navigation"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data, mutate } = useSWR(`/api/jobs/${id}`, fetcher, { refreshInterval: 2500 })

  async function pause() {
    await fetch(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ action: "pause" }) })
    mutate()
  }
  async function resume() {
    await fetch(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ action: "resume" }) })
    mutate()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{data?.name || "Job"}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusDot status={data?.status || "pending"} />
              {data?.status || "pending"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={pause} disabled={data?.status !== "running"}>
            Pause
          </Button>
          <Button onClick={resume} disabled={data?.status !== "paused"}>
            Resume
          </Button>
          <Button variant="secondary" asChild>
            <a href={`/api/jobs/${id}/artifact`} download>
              Download Encrypted Result
            </a>
          </Button>
        </CardContent>
      </Card>

      <LogPanel id={id} />
    </div>
  )
}
