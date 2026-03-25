"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function AgentsPage() {
  const { data, mutate } = useSWR("/api/agents", fetcher, { refreshInterval: 2500 })

  async function update(id: string, body: any) {
    await fetch("/api/agents", { method: "PATCH", body: JSON.stringify({ id, ...body }) })
    mutate()
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data?.map((a: any) => (
        <Card key={a.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{a.name}</span>
              <span className="text-xs text-muted-foreground">{a.credits} cr</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>CPU limit</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  defaultValue={a.cpuLimit}
                  onChange={(e) => update(a.id, { cpuLimit: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Memory limit (GB)</Label>
                <Input
                  type="number"
                  min={1}
                  max={32}
                  defaultValue={a.memLimit}
                  onChange={(e) => update(a.id, { memLimit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`participate-${a.id}`} className="text-sm">
                Participating
              </Label>
              <Switch
                id={`participate-${a.id}`}
                checked={a.participating}
                onCheckedChange={(v) => update(a.id, { participating: v })}
              />
            </div>
            <Button variant="outline" onClick={() => update(a.id, { participating: !a.participating })}>
              {a.participating ? "Pause" : "Resume"}
            </Button>
          </CardContent>
        </Card>
      )) || <div className="text-sm text-muted-foreground">No agents yet.</div>}
    </div>
  )
}
