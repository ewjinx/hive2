"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusDot } from "@/components/hive/status-indicator"
import AnalyticsPanel from "@/components/hive/analytics-panel"
import { Badge } from "@/components/ui/badge"

import api from "@/lib/api"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

function SummaryCards() {
  const { data } = useSWR<{
    queue: number
    running: number
    completed: number
    failed: number
    totalJobs: number
    agentsOnline: number
    agentsTotal: number
    credits: { earned: number; spent: number }
  }>("/api/analytics/summary", fetcher, { refreshInterval: 2500 })

  const items = [
    { label: "Job Queue", value: data?.queue ?? 0, icon: "📋", color: "bg-yellow-400/10 text-yellow-600" },
    { label: "Running", value: data?.running ?? 0, icon: "⚡", color: "bg-blue-400/10 text-blue-600" },
    { label: "Completed", value: data?.completed ?? 0, icon: "✅", color: "bg-green-400/10 text-green-600" },
    { label: "Agents Online", value: `${data?.agentsOnline ?? 0} / ${data?.agentsTotal ?? 0}`, icon: "🖥️", color: "bg-primary/10 text-green-600" },
    { label: "Credits Earned", value: (data?.credits?.earned ?? 0).toFixed(1), icon: "💰", color: "bg-emerald-400/10 text-emerald-600" },
    { label: "Credits Spent", value: (data?.credits?.spent ?? 0).toFixed(1), icon: "💸", color: "bg-purple-400/10 text-purple-600" },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {items.map((it) => (
        <Card key={it.label} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl ${it.color} flex items-center justify-center text-lg`}>
                {it.icon}
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{it.label}</p>
            <p className="text-2xl font-bold">{it.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AgentsList() {
  const { data } = useSWR<{ id: string; name: string; status: "pending" | "running" | "paused" | "completed" }[]>(
    "/api/agents/",
    fetcher,
    { refreshInterval: 2500 },
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Distributed Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.isArray(data) && data.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-xl border border-foreground/10 p-4 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <StatusDot status={a.status} />
                <span className="text-sm font-medium">{a.name}</span>
              </div>
              <Badge variant={a.status === "running" ? "default" : "outline"} className="text-xs">
                {a.status}
              </Badge>
            </li>
          )) || <div className="text-sm text-muted-foreground">No agents yet.</div>}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your distributed CI/CD infrastructure</p>
      </div>
      <SummaryCards />
      <AnalyticsPanel />
      <AgentsList />
    </div>
  )
}
