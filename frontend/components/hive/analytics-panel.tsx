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

// Grass.io-inspired chart colors
const CHART_COLORS = {
  pending: "#FACC15",
  running: "#3B82F6",
  completed: "#3CCD71",   // Grass.io lime green
  failed: "#E21212",      // Grass.io error
  duration: "#6366F1",
  cpu: "#F97316",
  memory: "#14B8A6",
  earned: "#3CCD71",
  spent: "#A855F7",
  balance: "#3B82F6",
  idle: "#3CCD71",
  busy: "#3B82F6",
  offline: "#E21212",
}

export default function AnalyticsPanel() {
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
          <CardTitle className="font-heading text-xl">Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground py-12 text-center">
          <div className="animate-pulse text-3xl mb-3">📊</div>
          <p className="font-medium">Loading analytics...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {/* ── 1. Job Distribution (Pie) ──────────────────────────── */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Job Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              pending: { label: "Pending", color: CHART_COLORS.pending },
              running: { label: "Running", color: CHART_COLORS.running },
              completed: { label: "Completed", color: CHART_COLORS.completed },
              failed: { label: "Failed", color: CHART_COLORS.failed },
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
                    <Cell key={entry.key} fill={CHART_COLORS[entry.key as keyof typeof CHART_COLORS]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 2. Avg Build/Test Duration (Line) ──────────────────── */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Avg Build/Test Duration</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              duration: { label: "Avg Duration (s)", color: CHART_COLORS.duration },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.durations || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeOpacity={0.1} strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgDuration"
                  name="Avg Duration (s)"
                  stroke={CHART_COLORS.duration}
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
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Cluster Utilization</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              cpu: { label: "CPU %", color: CHART_COLORS.cpu },
              memory: { label: "Memory %", color: CHART_COLORS.memory },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.resources || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeOpacity={0.1} strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU %"
                  stroke={CHART_COLORS.cpu}
                  fill={CHART_COLORS.cpu}
                  fillOpacity={0.15}
                  isAnimationActive
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="Memory %"
                  stroke={CHART_COLORS.memory}
                  fill={CHART_COLORS.memory}
                  fillOpacity={0.1}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 4. Credit Balance Trend (Area) ─────────────────────── */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Credit Balance Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              balance: { label: "Net Balance", color: CHART_COLORS.balance },
              earned: { label: "Earned", color: CHART_COLORS.earned },
              spent: { label: "Spent", color: CHART_COLORS.spent },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history?.creditTrend || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeOpacity={0.1} strokeDasharray="3 3" />
                <XAxis dataKey="time" hide />
                <YAxis width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Net Balance"
                  stroke={CHART_COLORS.balance}
                  fill={CHART_COLORS.balance}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 5. Credits Donut ───────────────────────────────────── */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Credits Overview</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              earned: { label: "Earned", color: CHART_COLORS.earned },
              spent: { label: "Spent", color: CHART_COLORS.spent },
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
                    <Cell key={entry.key} fill={CHART_COLORS[entry.key as keyof typeof CHART_COLORS]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── 6. Agent Activity (Bar) ────────────────────────────── */}
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Agent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              idle: { label: "Idle", color: CHART_COLORS.idle },
              busy: { label: "Busy", color: CHART_COLORS.busy },
              offline: { label: "Offline", color: CHART_COLORS.offline },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentBars} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeOpacity={0.1} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width={28} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" name="Agents" isAnimationActive radius={[8, 8, 0, 0]}>
                  {agentBars.map((entry) => (
                    <Cell key={entry.key} fill={CHART_COLORS[entry.key as keyof typeof CHART_COLORS]} />
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
