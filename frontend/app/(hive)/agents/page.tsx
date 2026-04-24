"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

export default function AgentsPage() {
  const { data } = useSWR("/api/agents", fetcher, { refreshInterval: 2500 })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1">Agents</h1>
        <p className="text-muted-foreground text-sm">Manage your distributed computing nodes</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.isArray(data) && data.length > 0 ? data.map((a: any) => (
          <Card key={a.id} className="animate-in fade-in slide-in-from-bottom-2 hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between font-heading">
                <span>{a.name}</span>
                <Badge 
                  variant={a.status === "offline" ? "destructive" : "default"}
                  className={a.status === "idle" ? "bg-yellow-400 hover:bg-yellow-500 border-transparent text-black" : ""}
                >
                  {a.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Allocated CPU Cores:</span>
                <span className="font-mono font-semibold">{a.cpu_cores} vCPU</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Allocated RAM:</span>
                <span className="font-mono font-semibold">{a.ram_gb} GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current CPU Load:</span>
                <span className="font-mono font-semibold">{a.current_cpu_usage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current RAM Load:</span>
                <span className="font-mono font-semibold">{a.current_ram_usage} GB</span>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full border-2 border-dashed border-foreground/10 rounded-2xl p-12 text-center text-sm text-muted-foreground bg-accent/30">
            <div className="text-4xl mb-4">🖥️</div>
            <p className="font-semibold mb-1">No nodes connected</p>
            <p>Start the Hive Desktop Manager to connect computing power.</p>
          </div>
        )}
      </div>
    </div>
  )
}
