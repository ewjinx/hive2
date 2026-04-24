"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusDot } from "@/components/hive/status-indicator"
import { Plus, Trash2, AlertCircle } from "lucide-react"

import api from "@/lib/api"

const fetcher = (u: string) => api.get(u).then((r) => r.data)

export default function JobsPage() {
  const router = useRouter()
  const { data: jobsData, mutate } = useSWR("/api/jobs/", fetcher, { refreshInterval: 2500 })
  const { data: user } = useSWR("/api/users/me", fetcher)
  
  const [jobMode, setJobMode] = useState<"simple" | "pipeline">("simple")
  const [steps, setSteps] = useState([{ name: "Install", command: "" }])
  
  const [cpuReq, setCpuReq] = useState(1)
  const [ramReq, setRamReq] = useState(1.0)
  const [estDuration, setEstDuration] = useState(60)
  const [arraySize, setArraySize] = useState(1)

  const addStep = () => {
    setSteps([...steps, { name: `Step ${steps.length + 1}`, command: "" }])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const baseFee = 2.0
  const cpuCostPerSec = 0.03
  const ramCostPerSec = 0.007
  const estimatedVariableCost = (cpuReq * cpuCostPerSec * estDuration) + (ramReq * ramCostPerSec * estDuration)
  const estimatedCost = (baseFee + estimatedVariableCost) * arraySize
  
  const hasEnoughBalance = user ? user.balance >= estimatedCost : true

  async function onSubmit(formData: FormData) {
    if (jobMode === "pipeline") {
      formData.delete("run_command")
      formData.delete("build_command")
      const validSteps = steps.filter(s => s.name.trim() !== "" && s.command.trim() !== "")
      formData.append("steps", JSON.stringify(validSteps))
    }

    const res = await api.post("/api/jobs/", formData)
    const json = res.data
    mutate()
    router.push(`/jobs/${json.id}`)
  }

  const handleAddCredits = async () => {
    try {
      await api.post("/api/users/me/add-credits", { amount: 100 })
      mutate()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1">Jobs</h1>
        <p className="text-muted-foreground text-sm">Submit and manage your distributed CI/CD jobs</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card asChild>
          <form action={onSubmit}>
            <CardHeader>
              <CardTitle className="font-heading text-xl">Submit New Job</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="file" className="font-semibold">Upload Project (Zip)</Label>
                <Input id="file" name="file" type="file" required />
              </div>

              <Tabs value={jobMode} onValueChange={(v) => setJobMode(v as "simple" | "pipeline")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simple">Simple Command</TabsTrigger>
                  <TabsTrigger value="pipeline">Multi-Step Pipeline</TabsTrigger>
                </TabsList>
                
                <TabsContent value="simple" className="grid gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="build_command" className="font-semibold">Build Command (Optional)</Label>
                    <Input id="build_command" name="build_command" placeholder="e.g., pip install -r requirements.txt" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="run_command" className="font-semibold">Run Command</Label>
                    <Input id="run_command" name="run_command" placeholder="e.g., python main.py" required={jobMode === "simple"} />
                  </div>
                </TabsContent>

                <TabsContent value="pipeline" className="grid gap-4 mt-4">
                  <div className="space-y-4 rounded-2xl border border-foreground/10 p-5 bg-accent/50">
                    <Label className="font-semibold">Pipeline Steps</Label>
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input 
                          placeholder="Name (e.g. Test)" 
                          value={step.name} 
                          onChange={(e) => updateStep(idx, "name", e.target.value)} 
                          className="w-1/3"
                          required={jobMode === "pipeline"}
                        />
                        <Input 
                          placeholder="Command (e.g. pytest)" 
                          value={step.command} 
                          onChange={(e) => updateStep(idx, "command", e.target.value)} 
                          className="flex-1 font-mono text-sm"
                          required={jobMode === "pipeline"}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(idx)} disabled={steps.length === 1}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-2" /> Add Step
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-foreground/5 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="cpu_req" className="font-semibold text-xs">CPU Cores</Label>
                  <Input id="cpu_req" name="cpu_req" type="number" min="1" max="64" value={cpuReq} onChange={(e) => setCpuReq(parseInt(e.target.value) || 1)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ram_req" className="font-semibold text-xs">RAM (GB)</Label>
                  <Input id="ram_req" name="ram_req" type="number" min="0.5" max="256" step="0.5" value={ramReq} onChange={(e) => setRamReq(parseFloat(e.target.value) || 1.0)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="array_size" className="font-semibold text-xs">Array Task Nodes</Label>
                  <Input id="array_size" name="array_size" type="number" min="1" max="1000" value={arraySize} onChange={(e) => setArraySize(parseInt(e.target.value) || 1)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="est_dur" className="font-semibold text-xs">Est. Dur. (s)</Label>
                  <Input id="est_dur" type="number" min="5" value={estDuration} onChange={(e) => setEstDuration(parseInt(e.target.value) || 60)} />
                </div>
              </div>

              {/* Estimated Cost Preview */}
              <div className={`mt-2 p-5 rounded-2xl border ${hasEnoughBalance ? "bg-primary/5 border-primary/20" : "bg-destructive/10 border-destructive/30"}`}>
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-bold text-sm">Estimated Cost Preview</Label>
                  <span className="font-mono font-bold text-lg">{estimatedCost.toFixed(2)} credits</span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Base Network Fee ({arraySize}x nodes):</span>
                  <span>{(baseFee * arraySize).toFixed(2)} credits</span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Variable Compute ({estDuration}s × {arraySize}x nodes):</span>
                  <span>{(estimatedVariableCost * arraySize).toFixed(3)} credits</span>
                </div>
                
                {!hasEnoughBalance && user && (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2 items-center text-sm font-semibold text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>Insufficient balance (You have {user.balance.toFixed(2)} credits)</span>
                    </div>
                    <div className="text-xs text-destructive/80">
                      Please reduce CPU/RAM requirements, shorten your estimated duration, or add credits to proceed.
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={handleAddCredits}>
                      Mock Purchase: +100 Credits
                    </Button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" disabled={!hasEnoughBalance}>
                Submit {jobMode === "pipeline" ? "Pipeline" : "Job"}
              </Button>

            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(jobsData) && jobsData.map((j: any) => (
                <button
                  key={j.id}
                  onClick={() => location.assign(`/jobs/${j.id}`)}
                  className="w-full rounded-xl border border-foreground/10 p-4 text-left hover:bg-accent hover:border-primary/30 focus:bg-accent transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusDot status={j.status} />
                      <span className="font-semibold">{j.name || `Job #${j.id}`}</span>
                    </div>
                    <Badge variant={j.status === "success" ? "default" : j.status === "failed" ? "destructive" : "outline"}>
                      {j.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                    <span>{j.pipeline_steps?.length > 0 ? `${j.pipeline_steps.length} Steps` : "Simple Command"}</span>
                    <span>{j.cpu_req} vCPU • {j.ram_req} GB</span>
                  </div>
                </button>
              )) || <div className="text-sm text-muted-foreground py-8 text-center">No jobs yet.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
