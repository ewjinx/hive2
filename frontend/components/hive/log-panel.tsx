"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useSWR from "swr"
import { ResourceChart } from "./resource-chart"
import api from "@/lib/api"
import { useWebSocket } from "@/hooks/useWebSocket"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

export function LogPanel({ id }: { id: string }) {
  const { data: swrData } = useSWR<any>(
    `/api/jobs/${id}/logs`,
    fetcher,
    { refreshInterval: 2500 }, // Fallback poll rate reduced, WS handles live
  )
  
  const { data: wsData, isConnected } = useWebSocket(`/api/v1/ws/jobs/${id}/logs`)

  // SWR returns [{id, content}], map it to strings
  const fallbackLogs = Array.isArray(swrData) ? swrData.map((l: any) => l.content || "") : []
  
  // Use WS data if fresh, otherwise fallback to SWR
  const displayLogs = wsData?.logs || fallbackLogs
  const displayMetrics = wsData?.metrics || swrData?.metrics || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs & Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="w-full">
          <TabsList>
            <TabsTrigger value="logs">Console</TabsTrigger>
            <TabsTrigger value="metrics">Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="logs">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-zinc-500"}`} />
              {isConnected ? "Live Stream Connected" : "Polling Archive"}
            </div>
            <pre className="mt-1 h-64 overflow-auto rounded-md bg-secondary p-3 text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap font-mono">
              {displayLogs.length > 0 ? displayLogs.join("\n") : "Waiting for logs..."}
            </pre>
          </TabsContent>
          <TabsContent value="metrics">
            <div className="mt-3">
              <ResourceChart data={displayMetrics} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
