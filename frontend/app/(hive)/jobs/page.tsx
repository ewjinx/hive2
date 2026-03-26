"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  
  // Resource Estimation State
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

  // Cost Estimation
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
      mutate() // refresh balance
    } catch (e) {
      console.error(e)
    }
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
              <Label htmlFor="file">Upload Project (Zip)</Label>
              <Input id="file" name="file" type="file" required />
            </div>

            <Tabs value={jobMode} onValueChange={(v) => setJobMode(v as "simple" | "pipeline")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simple">Simple Command</TabsTrigger>
                <TabsTrigger value="pipeline">Multi-Step Pipeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="simple" className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="build_command">Build Command (Optional)</Label>
                  <Input id="build_command" name="build_command" placeholder="e.g., pip install -r requirements.txt" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="run_command">Run Command</Label>
                  <Input id="run_command" name="run_command" placeholder="e.g., python main.py" required={jobMode === "simple"} />
                </div>
              </TabsContent>

              <TabsContent value="pipeline" className="grid gap-4 mt-4">
                <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                  <Label>Pipeline Steps</Label>
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t mt-2">
              <div className="grid gap-2">
                <Label htmlFor="cpu_req">CPU Cores</Label>
                <Input 
                  id="cpu_req" 
                  name="cpu_req" 
                  type="number" 
                  min="1" 
                  max="64" 
                  value={cpuReq} 
                  onChange={(e) => setCpuReq(parseInt(e.target.value) || 1)} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ram_req">RAM (GB)</Label>
                <Input 
                  id="ram_req" 
                  name="ram_req" 
                  type="number" 
                  min="0.5" 
                  max="256" 
                  step="0.5"
                  value={ramReq} 
                  onChange={(e) => setRamReq(parseFloat(e.target.value) || 1.0)} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="array_size">Array Task Nodes</Label>
                <Input 
                  id="array_size" 
                  name="array_size" 
                  type="number" 
                  min="1" 
                  max="1000" 
                  value={arraySize} 
                  onChange={(e) => setArraySize(parseInt(e.target.value) || 1)} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="est_dur">Est. Dur. (s)</Label>
                <Input 
                  id="est_dur" 
                  type="number" 
                  min="5" 
                  value={estDuration} 
                  onChange={(e) => setEstDuration(parseInt(e.target.value) || 60)} 
                />
              </div>
            </div>

            {/* Estimated Cost Preview */}
            <div className={`mt-4 p-4 rounded-md border ${hasEnoughBalance ? "bg-muted/50" : "bg-destructive/10 border-destructive"}`}>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Estimated Cost Preview</Label>
                <span className="font-mono font-bold">{estimatedCost.toFixed(2)} credits</span>
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
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2 items-center text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Insufficient balance (You have {user.balance.toFixed(2)} credits)</span>
                  </div>
                  <div className="text-xs text-destructive/80">
                    Please reduce CPU/RAM requirements, shorten your estimated duration, or add credits to proceed.
                  </div>
                  <Button type="button" variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleAddCredits}>
                    Mock Purchase: +100 Credits
                  </Button>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={!hasEnoughBalance}>
              Submit {jobMode === "pipeline" ? "Pipeline" : "Job"}
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
            {Array.isArray(jobsData) && jobsData.map((j: any) => (
              <button
                key={j.id}
                onClick={() => location.assign(`/jobs/${j.id}`)}
                className="w-full rounded-md border p-3 text-left hover:bg-accent focus:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot status={j.status} />
                    <span className="font-medium">{j.name || `Job #${j.id}`}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{j.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                  <span>{j.pipeline_steps?.length > 0 ? `${j.pipeline_steps.length} Steps` : "Simple Command"}</span>
                  <span>{j.cpu_req} vCPU • {j.ram_req} GB</span>
                </div>
              </button>
            )) || <div className="text-sm text-muted-foreground">No jobs yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
