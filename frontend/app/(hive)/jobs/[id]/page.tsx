"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogPanel } from "@/components/hive/log-panel"
import { PipelinePanel } from "@/components/hive/pipeline-panel"
import { StatusDot } from "@/components/hive/status-indicator"
import { useParams } from "next/navigation"
import { CheckCircle, AlertCircle } from "lucide-react"
import api from "@/lib/api"
import { useWebSocket } from "@/hooks/useWebSocket"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data: swrData, mutate } = useSWR(`/api/jobs/${id}`, fetcher, { refreshInterval: 2500 })
  const { data: wsData } = useWebSocket(`/api/v1/ws/jobs/${id}/logs`)

  // Favor real-time WebSocket data if present
  const data = wsData?.status ? wsData : swrData

  async function pause() {
    await fetch(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ action: "pause" }) })
    mutate()
  }
  async function resume() {
    await fetch(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ action: "resume" }) })
    mutate()
  }

  const hasPipelineSteps = data?.pipeline_steps && data.pipeline_steps.length > 0

  return (
    <div className="space-y-6">
      {data?.status === "success" && (
        <div className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 border p-4 rounded-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Job Completed Successfully</h3>
            <p className="text-sm opacity-90">Your execution finished. Logs and artifacts are available below.</p>
          </div>
        </div>
      )}
      
      {data?.status === "failed" && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive border p-4 rounded-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Job Failed</h3>
            <p className="text-sm opacity-90">The execution encountered an error. Check the logs for details.</p>
          </div>
        </div>
      )}

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
          <Button variant="secondary" asChild disabled={data?.status !== "success"}>
            <a href={`/api/jobs/${id}/artifact`} download>
              Download Encrypted Result
            </a>
          </Button>
        </CardContent>
      </Card>

      {hasPipelineSteps ? (
        <PipelinePanel steps={data.pipeline_steps} />
      ) : (
        <LogPanel id={id} />
      )}
    </div>
  )
}
