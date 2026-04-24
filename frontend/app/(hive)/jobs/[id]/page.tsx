"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogPanel } from "@/components/hive/log-panel"
import { PipelinePanel } from "@/components/hive/pipeline-panel"
import { StatusDot } from "@/components/hive/status-indicator"
import { useParams } from "next/navigation"
import { CheckCircle, AlertCircle, Download } from "lucide-react"
import api from "@/lib/api"
import { useWebSocket } from "@/hooks/useWebSocket"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data: swrData, mutate } = useSWR(`/api/jobs/${id}`, fetcher, { refreshInterval: 2500 })
  const { data: wsData } = useWebSocket(`/api/v1/ws/jobs/${id}/logs`)

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
        <div className="bg-primary/10 border-primary/30 text-foreground border rounded-2xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold font-heading">Job Completed Successfully</h3>
            <p className="text-sm text-muted-foreground">Your execution finished. Logs and artifacts are available below.</p>
          </div>
        </div>
      )}
      
      {data?.status === "failed" && (
        <div className="bg-destructive/10 border-destructive/30 text-foreground border rounded-2xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold font-heading">Job Failed</h3>
            <p className="text-sm text-muted-foreground">The execution encountered an error. Check the logs for details.</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-heading text-xl">
            <span>{data?.name || "Job"}</span>
            <div className="flex items-center gap-2">
              <StatusDot status={data?.status || "pending"} />
              <Badge variant={data?.status === "success" ? "default" : data?.status === "failed" ? "destructive" : "outline"}>
                {data?.status || "pending"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={pause} disabled={data?.status !== "running"}>
            Pause
          </Button>
          <Button onClick={resume} disabled={data?.status !== "paused"}>
            Resume
          </Button>
          <Button variant="secondary" asChild disabled={data?.status !== "success"}>
            <a href={`/api/jobs/${id}/artifact`} download>
              <Download className="h-4 w-4 mr-2" />
              Download Result
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
