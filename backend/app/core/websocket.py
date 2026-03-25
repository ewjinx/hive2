"""
WebSocket Connection Manager for Hive.
Handles real-time broadcasting to connected frontend clients.
"""
from typing import Dict, List, Set
from fastapi import WebSocket
import json
import asyncio


class ConnectionManager:
    """Manages WebSocket connections grouped by channels (e.g. 'dashboard', 'job:123')."""
    
    def __init__(self):
        self._channels: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self._channels:
            self._channels[channel] = set()
        self._channels[channel].add(websocket)
    
    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self._channels:
            self._channels[channel].discard(websocket)
            if not self._channels[channel]:
                del self._channels[channel]
    
    async def broadcast(self, channel: str, data: dict):
        """Send a JSON message to all clients on a channel."""
        if channel not in self._channels:
            return
        
        message = json.dumps(data)
        dead = []
        for ws in self._channels[channel]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        
        for ws in dead:
            self._channels[channel].discard(ws)
    
    async def send_personal(self, websocket: WebSocket, data: dict):
        """Send a message to a specific client."""
        try:
            await websocket.send_text(json.dumps(data))
        except Exception:
            pass
    
    def get_channel_count(self, channel: str) -> int:
        return len(self._channels.get(channel, set()))


# Singleton instance
manager = ConnectionManager()
