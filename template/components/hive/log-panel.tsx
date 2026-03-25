"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useSWR from "swr"
import { ResourceChart } from "./resource-chart"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export function LogPanel({ id }: { id: string }) {
  const { data } = useSWR<{ logs: string[]; metrics: { t: string; cpu: number; mem: number }[] }>(
    `/api/jobs/${id}/logs`,
    fetcher,
    { refreshInterval: 1200 },
  )

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
            <pre className="mt-3 h-64 overflow-auto rounded-md bg-secondary p-3 text-xs leading-relaxed">
              {data?.logs?.join("\n") || "Waiting for logs..."}
            </pre>
          </TabsContent>
          <TabsContent value="metrics">
            <div className="mt-3">
              <ResourceChart data={data?.metrics || []} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
