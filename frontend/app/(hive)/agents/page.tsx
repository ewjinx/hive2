"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

export default function AgentsPage() {
  const { data } = useSWR("/api/agents", fetcher, { refreshInterval: 2500 })

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.isArray(data) && data.length > 0 ? data.map((a: any) => (
        <Card key={a.id} className="animate-in fade-in slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{a.name}</span>
              <Badge 
                variant={a.status === "offline" ? "destructive" : "default"}
                className={a.status === "idle" ? "bg-yellow-500 hover:bg-yellow-600 border-transparent text-white" : ""}
              >
                {a.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Allocated CPU Cores:</span>
              <span className="font-mono">{a.cpu_cores} vCPU</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Allocated RAM:</span>
              <span className="font-mono">{a.ram_gb} GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current CPU Load:</span>
              <span className="font-mono">{a.current_cpu_usage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current RAM Load:</span>
              <span className="font-mono">{a.current_ram_usage} GB</span>
            </div>
          </CardContent>
        </Card>
      )) : (
        <div className="col-span-full border border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground bg-muted/20">
          No nodes have reported in yet. Start the Hive Desktop Manager to connect computing power.
        </div>
      )}
    </div>
  )
}
