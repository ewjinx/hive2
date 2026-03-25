export function StatusDot({ status }: { status: "pending" | "running" | "paused" | "completed" }) {
  const map: Record<string, string> = {
    pending: "bg-muted-foreground/40",
    running: "bg-(--color-online)",
    paused: "bg-accent/70",
    completed: "bg-primary",
  }
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${map[status]}`} aria-hidden />
}
