"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Loader2, XCircle } from "lucide-react"

interface PipelineStep {
  step_index: number
  name: string
  command: string
  status: string
  started_at: string | null
  finished_at: string | null
  log: string | null
}

export function PipelinePanel({ steps }: { steps: PipelineStep[] }) {
  if (!steps || steps.length === 0) return null

  // Calculate duration
  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return ""
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const diff = Math.round((e - s) / 1000)
    return `${diff}s`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "skipped":
        return <Circle className="h-4 w-4 text-muted-foreground" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" /> // pending
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "running":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "skipped":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pipeline Steps</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual Progress Bar */}
        <div className="mb-6 flex w-full items-center justify-between">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step.status === "success"
                      ? "border-green-500 bg-green-500/20"
                      : step.status === "failed"
                        ? "border-destructive bg-destructive/20"
                        : step.status === "running"
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-muted bg-muted"
                  }`}
                >
                  {getStatusIcon(step.status)}
                </div>
                <span className="text-xs font-medium">{step.name}</span>
              </div>
              {/* Connector line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`mx-2 h-1 flex-1 rounded-full ${
                    step.status === "success" ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Accordion type="multiple" className="w-full">
          {steps.map((step) => (
            <AccordionItem key={step.step_index} value={`item-${step.step_index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <span className="font-semibold">{step.name}</span>
                    <Badge variant="outline" className={`ml-2 capitalize ${getStatusColor(step.status)}`}>
                      {step.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{step.command}</span>
                    <span>{getDuration(step.started_at, step.finished_at)}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-2 rounded-md bg-secondary p-4 font-mono text-xs">
                  {step.status === "pending" || step.status === "skipped" ? (
                    <span className="italic text-muted-foreground">
                      No logs available ({step.status})
                    </span>
                  ) : (
                    <pre className="whitespace-pre-wrap leading-relaxed text-secondary-foreground">
                      {step.log || "Executing..."}
                    </pre>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
