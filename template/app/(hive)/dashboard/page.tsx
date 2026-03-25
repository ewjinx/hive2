import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusDot } from "@/components/hive/status-indicator"
import AnalyticsPanel from "@/components/hive/analytics-panel"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

function SummaryCards() {
  const { data } = useSWR<{
    queue: number
    completed: number
    agentsOnline: number
    credits: number
  }>("/api/summary", fetcher, { refreshInterval: 2500 })

  const items = [
    { label: "Job Queue", value: data?.queue ?? 0 },
    { label: "Completed", value: data?.completed ?? 0 },
    { label: "Active Agents", value: data?.agentsOnline ?? 0 },
    { label: "Credits", value: data?.credits ?? 0 },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{it.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{it.value}</CardContent>
        </Card>
      ))}
    </div>
  )
}

function AgentsList() {
  const { data } = useSWR<{ id: string; name: string; status: "pending" | "running" | "paused" | "completed" }[]>(
    "/api/agents",
    fetcher,
    { refreshInterval: 2500 },
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distributed Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data?.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <StatusDot status={a.status} />
                <span className="text-sm">{a.name}</span>
              </div>
              <span className="text-xs text-muted-foreground uppercase">{a.status}</span>
            </li>
          )) || <div className="text-sm text-muted-foreground">No agents yet.</div>}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <SummaryCards />
      <AnalyticsPanel />
      <AgentsList />
    </div>
  )
}
