"""FastAPI WebSocket connection manager.

Manages WebSocket connections, supports per-group broadcasting, and
integrates with the Redis pub/sub system for cross-process messaging.
"""

import json
import logging
from typing import Any

from fastapi import WebSocket

from app.core.config import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Track active WebSocket connections grouped by channel.

    Groups are arbitrary string identifiers (e.g. ``"building:12"``,
    ``"user:45"``) that allow targeted message broadcasting.
    """

    def __init__(self) -> None:
        self._active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group: str) -> None:
        """Accept a WebSocket connection and register it under *group*.

        Args:
            websocket: The incoming :class:`WebSocket`.
            group: The channel/group identifier.
        """
        await websocket.accept()
        self._active_connections.setdefault(group, []).append(websocket)
        logger.debug("WebSocket connected to group '%s' (total: %d)",
                     group, len(self._active_connections[group]))

    def disconnect(self, websocket: WebSocket, group: str) -> None:
        """Remove a WebSocket from its group.

        Args:
            websocket: The :class:`WebSocket` to remove.
            group: The group it was registered under.
        """
        if group in self._active_connections:
            connections = self._active_connections[group]
            if websocket in connections:
                connections.remove(websocket)
            if not connections:
                del self._active_connections[group]
        logger.debug("WebSocket disconnected from group '%s'", group)

    async def send_personal(self, websocket: WebSocket, message: dict[str, Any]) -> None:
        """Send a JSON message to a single WebSocket.

        Args:
            websocket: The target connection.
            message: The payload dictionary.
        """
        await websocket.send_json(message)

    async def broadcast(
        self,
        group: str,
        message: dict[str, Any] | str,
    ) -> None:
        """Broadcast a JSON message to all connections in *group*.

        Args:
            group: The group identifier.
            message: A dict (sent as JSON) or pre-serialised string.
        """
        if group not in self._active_connections:
            return

        if isinstance(message, str):
            payload = message
        else:
            payload = json.dumps(message)

        dead: list[WebSocket] = []
        for connection in self._active_connections[group]:
            try:
                await connection.send_text(payload)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Failed to send to WebSocket: %s", exc)
                dead.append(connection)

        for connection in dead:
            self._active_connections[group].remove(connection)

    async def send_to_all(self, message: dict[str, Any]) -> None:
        """Broadcast a message to every active connection across all groups.

        Args:
            message: The payload dictionary.
        """
        for group in list(self._active_connections.keys()):
            await self.broadcast(group, message)

    async def send_personal_message(self, websocket: WebSocket, message: dict[str, Any]) -> None:
        """Send a JSON message to a single WebSocket.

        Args:
            websocket: The target connection.
            message: The payload dictionary.
        """
        await self.send_personal(websocket, message)

    async def subscribe_to_channel(self, websocket: WebSocket, channel: str) -> None:
        """Subscribe a WebSocket to a channel/group."""
        await self.connect(websocket, channel)

    async def unsubscribe_from_channel(self, websocket: WebSocket, channel: str) -> None:
        """Unsubscribe a WebSocket from a channel/group."""
        self.disconnect(websocket, channel)

    def connection_count(self, group: str | None = None) -> int:
        """Return the number of active connections.

        Args:
            group: If provided, count only connections in that group.

        Returns:
            The number of active connections.
        """
        if group is None:
            return sum(len(c) for c in self._active_connections.values())
        return len(self._active_connections.get(group, []))


connection_manager = ConnectionManager()


class WebSocketManager(ConnectionManager):
    """Backward-compatible alias for the connection manager.

    Retains API compatibility while the singleton :data:`connection_manager`
    is migrated.
    """

    def __init__(self) -> None:
        super().__init__()
        self.enabled: bool = settings.ENABLE_WEBSOCKETS

    async def connect_or_reject(self, websocket: WebSocket, group: str) -> bool:
        """Connect a WebSocket if WebSockets are enabled.

        Args:
            websocket: The incoming :class:`WebSocket`.
            group: The channel/group identifier.

        Returns:
            ``True`` if connected, ``False`` if WebSockets are disabled.
        """
        if not self.enabled:
            await websocket.close(code=1013)
            return False
        await self.connect(websocket, group)
        return True


websocket_manager = WebSocketManager()
