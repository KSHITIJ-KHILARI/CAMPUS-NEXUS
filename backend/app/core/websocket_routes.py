"""WebSocket routes for Campus NEXUS."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import json

from app.core.config import settings
from app.core.websocket_manager import connection_manager as manager

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()

    try:
        # First message should be authentication
        auth_message = await websocket.receive_text()
        auth_data = json.loads(auth_message)

        token = auth_data.get("token")
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return

        # Verify token
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            user_id = payload.get("sub")
        except Exception:
            await websocket.close(code=4002, reason="Invalid token")
            return

        # Connect user
        await manager.connect(websocket, str(user_id))

        # Send welcome message
        await manager.send_personal_message(
            {
                "type": "connected",
                "user_id": user_id,
                "message": "Connected to Campus NEXUS",
            },
            websocket,
        )

        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)

                message_type = message.get("type")

                if message_type == "subscribe":
                    channel = message.get("channel")
                    if channel:
                        await manager.subscribe_to_channel(websocket, channel)

                elif message_type == "unsubscribe":
                    channel = message.get("channel")
                    if channel:
                        await manager.unsubscribe_from_channel(websocket, channel)

                elif message_type == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)

            except WebSocketDisconnect:
                break
            except Exception as e:
                await manager.send_personal_message(
                    {"type": "error", "message": str(e)},
                    websocket,
                )

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)


@router.websocket("/ws/campus")
async def campus_websocket(websocket: WebSocket):
    """Public campus updates WebSocket (no auth required)."""
    await websocket.accept()
    await manager.connect(websocket, "public")

    try:
        await manager.subscribe_to_channel(websocket, "campus_state")

        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)

                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)

            except WebSocketDisconnect:
                break
            except Exception:
                pass

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)
