"use client"

import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { StatusDot } from "@/components/hive/status-indicator"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function JobsPage() {
  const router = useRouter()
  const { data, mutate } = useSWR("/api/jobs", fetcher, { refreshInterval: 2500 })

  async function onSubmit(formData: FormData) {
    const res = await fetch("/api/jobs", { method: "POST", body: formData })
    const json = await res.json()
    mutate()
    router.push(`/jobs/${json.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card asChild>
        <form action={onSubmit}>
          <CardHeader>
            <CardTitle>Submit New Job</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="repo">Git Repository URL</Label>
              <Input id="repo" name="repo" placeholder="https://github.com/org/repo" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="upload">Or Upload Project</Label>
              <Input id="upload" name="upload" type="file" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="build">Build Command</Label>
              <Input id="build" name="build" placeholder="npm ci && npm run build" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="test">Test Command</Label>
              <Input id="test" name="test" placeholder="npm test -- --ci" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>CPU</Label>
                <Select name="cpu" defaultValue="2">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 vCPU</SelectItem>
                    <SelectItem value="2">2 vCPU</SelectItem>
                    <SelectItem value="4">4 vCPU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Memory</Label>
                <Select name="mem" defaultValue="4">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 GB</SelectItem>
                    <SelectItem value="4">4 GB</SelectItem>
                    <SelectItem value="8">8 GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="parallel" className="text-sm">
                Parallelizable
              </Label>
              <Switch id="parallel" name="parallel" defaultChecked />
            </div>
            <Button type="submit" className="justify-self-start">
              Start Job
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.map((j: any) => (
              <button
                key={j.id}
                onClick={() => location.assign(`/jobs/${j.id}`)}
                className="w-full rounded-md border p-3 text-left hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot status={j.status} />
                    <span className="font-medium">{j.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{j.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {j.repo || "uploaded project"} • {j.cpu} vCPU • {j.mem} GB
                </div>
              </button>
            )) || <div className="text-sm text-muted-foreground">No jobs yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
