import { useEffect, useState, useRef } from "react"

type WSMessage = any

export function useWebSocket(url: string) {
  const [data, setData] = useState<WSMessage | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Standardize WS URL based on current window location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    // In dev, our API is mapped via rewrites to port 8000, but WS needs the direct port or a matching proxy route.
    // If running Next.js dev server, we connect to ws://localhost:8000 directly.
    const wsUrl = process.env.NODE_ENV === "development" 
      ? `ws://localhost:8000${url}`
      : `${protocol}//${window.location.host}${url}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)
    ws.onclose = () => setIsConnected(false)
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        setData(parsed)
      } catch (e) {
        console.error("Failed to parse WS message", e)
      }
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [url])

  return { data, isConnected }
}
