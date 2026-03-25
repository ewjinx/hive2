"use client"

import useSWR from "swr"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import api from "@/lib/api"

// ── Types ──────────────────────────────────────────────────────

type JobDistribution = { pending: number; running: number; completed: number; failed: number }
type DurationPoint = { time: string; avgDuration: number }
type ResourcePoint = { time: string; cpu: number; memory: number }
type CreditTrendPoint = { time: string; balance: number; earned: number; spent: number }
type AgentActivity = { online: number; idle: number; busy: number; offline: number; total: number }
type Credits = { earned: number; spent: number }

type HistoryResponse = {
  jobDistribution: JobDistribution
  durations: DurationPoint[]
  resources: ResourcePoint[]
  creditTrend: CreditTrendPoint[]
  agentActivity: AgentActivity
}

type AnalyticsResponse = {
  jobDistribution: JobDistribution
  durations: DurationPoint[]
  resources: ResourcePoint[]
  credits: Credits
}

const fetcher = (url: string) => api.get(url).then((r) => r.data)

export default function AnalyticsPanel() {
  // Fetch from both endpoints concurrently
  const { data, isLoading } = useSWR<AnalyticsResponse>("/api/analytics", fetcher, { refreshInterval: 3000 })
  const { data: history } = useSWR<HistoryResponse>("/api/analytics/history", fetcher, { refreshInterval: 5000 })

  const jobPie = [
    { name: "Pending", key: "pending", value: data?.jobDistribution.pending ?? 0 },
    { name: "Running", key: "running", value: data?.jobDistribution.running ?? 0 },
    { name: "Completed", key: "completed", value: data?.jobDistribution.completed ?? 0 },
    { name: "Failed", key: "failed", value: data?.jobDistribution.failed ?? 0 },
  ]

  const creditsPie = [
    { name: "Earned", key: "earned", value: data?.credits.earned ?? 0 },
    { name: "Spent", key: "spent", value: data?.credits.spent ?? 0 },
  ]

  const agentBars = history?.agentActivity
    ? [
        { name: "Idle", value: history.agentActivity.idle, key: "idle" },
        { name: "Busy", value: history.agentActivity.busy, key: "busy" },
        { name: "Offline", value: history.agentActivity.offline, key: "offline" },
      ]
    : []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Loading analytics...</CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {/* ── 1. Job Distribution (Pie) ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Job Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              pending: { label: "Pending", color: "var(--color-pending)" },
              running: { label: "Running", color: "var(--color-running)" },
              completed: { label: "Completed", color: "var(--color-completed)" },
              failed: { label: "Failed", color: "var(--color-failed)" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={jobPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  isAnimationActive
                >
                  {jobPie.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 2. Avg Build/Test Duration (Line) ──────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avg Build/Test Duration</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              duration: { label: "Avg Duration (s)", color: "var(--color-duration)" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.durations || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgDuration"
                  name="Avg Duration (s)"
                  stroke="var(--color-duration)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 3. CPU + Memory Utilization (Area) ─────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cluster Utilization</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              cpu: { label: "CPU %", color: "var(--color-cpu)" },
              memory: { label: "Memory %", color: "var(--color-memory)" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.resources || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU %"
                  stroke="var(--color-cpu)"
                  fill="var(--color-cpu)"
                  fillOpacity={0.25}
                  isAnimationActive
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="Memory %"
                  stroke="var(--color-memory)"
                  fill="var(--color-memory)"
                  fillOpacity={0.2}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 4. Credit Balance Trend (Area) ─────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Credit Balance Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              balance: { label: "Net Balance", color: "var(--color-chart-1)" },
              earned: { label: "Earned", color: "var(--color-earned)" },
              spent: { label: "Spent", color: "var(--color-spent)" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history?.creditTrend || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Net Balance"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 5. Credits Donut ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Credits Overview</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              earned: { label: "Earned", color: "var(--color-earned)" },
              spent: { label: "Spent", color: "var(--color-spent)" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={creditsPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  isAnimationActive
                >
                  {creditsPie.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 6. Agent Activity (Bar) ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Agent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              idle: { label: "Idle", color: "var(--color-completed)" },
              busy: { label: "Busy", color: "var(--color-running)" },
              offline: { label: "Offline", color: "var(--color-failed)" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentBars} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width={28} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" name="Agents" isAnimationActive radius={[4, 4, 0, 0]}>
                  {agentBars.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
