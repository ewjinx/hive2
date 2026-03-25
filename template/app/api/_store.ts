export type Job = {
  id: string
  name: string
  repo?: string
  cpu: number
  mem: number
  parallel: boolean
  status: "pending" | "running" | "paused" | "completed"
  logs: string[]
  metrics: { t: string; cpu: number; mem: number }[]
}

export type Agent = {
  id: string
  name: string
  status: "pending" | "running" | "paused" | "completed"
  cpuLimit: number
  memLimit: number
  participating: boolean
  credits: number
}

const store = {
  jobs: [] as Job[],
  agents: [] as Agent[],
  credits: 1200,
}

function init() {
  if (store.agents.length === 0) {
    store.agents = Array.from({ length: 6 }).map((_, i) => ({
      id: `a${i + 1}`,
      name: `agent-${i + 1}.local`,
      status: i % 3 === 0 ? "running" : "pending",
      cpuLimit: 2 + (i % 3),
      memLimit: 4 + (i % 4),
      participating: i % 2 === 0,
      credits: 100 + i * 7,
    }))
  }
}

export function getStore() {
  init()
  return store
}
