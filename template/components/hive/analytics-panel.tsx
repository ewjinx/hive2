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
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type JobDistribution = {
  pending: number
  running: number
  completed: number
  failed: number
}

type DurationPoint = {
  time: string
  avgDuration: number
}

type ResourcePoint = {
  time: string
  cpu: number
  memory: number
}

type Credits = {
  earned: number
  spent: number
}

type AnalyticsResponse = {
  jobDistribution: JobDistribution
  durations: DurationPoint[]
  resources: ResourcePoint[]
  credits: Credits
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AnalyticsPanel() {
  const { data, isLoading } = useSWR<AnalyticsResponse>("/api/analytics", fetcher, {
    refreshInterval: 3000,
  })

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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {/* Job Distribution (Pie) */}
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Job Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              pending: { label: "Pending", color: "hsl(var(--chart-1))" },
              running: { label: "Running", color: "hsl(var(--chart-2))" },
              completed: { label: "Completed", color: "hsl(var(--chart-3))" },
              failed: { label: "Failed", color: "hsl(var(--chart-4))" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" valueKey="value" />} />
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

      {/* Avg Build/Test Duration (Line) */}
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avg Build/Test Duration</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              duration: { label: "Avg Duration (s)", color: "hsl(var(--chart-2))" },
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

      {/* CPU + Memory Utilization (Area) */}
      <Card className="lg:col-span-2 xl:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cluster Utilization</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              cpu: { label: "CPU %", color: "hsl(var(--chart-3))" },
              memory: { label: "Memory %", color: "hsl(var(--chart-4))" },
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

      {/* Credits (Donut) - optional small */}
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Credits</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            className="aspect-auto w-full h-[240px]"
            config={{
              earned: { label: "Earned", color: "hsl(var(--chart-1))" },
              spent: { label: "Spent", color: "hsl(var(--chart-5))" },
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
    </div>
  )
}
