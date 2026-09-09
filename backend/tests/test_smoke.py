import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import httpx
from app.main import app

@pytest.mark.asyncio
async def test_api_smoke_suite():
    """Smoke test checking all core API endpoints using ASGI in-memory client."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        r = await client.get("/health")
        assert r.status_code == 200
        assert "status" in r.json()

        # 2. Auth Health check alias
        r = await client.get("/api/v1/health/auth")
        assert r.status_code == 200
        assert "auth_type" in r.json()

        # 3. AI Tools check (Requires auth, so expect 401 without token)
        r = await client.get("/api/v1/ai/tools")
        assert r.status_code == 401

        # 4. Auth verify (Requires auth, expect 401)
        r = await client.get("/api/v1/auth/verify")
        assert r.status_code == 401

        # 5. AI Chat (Requires auth, expect 401)
        r = await client.post("/api/v1/ai/chat", json={"message": "Show me my schedule"})
        assert r.status_code == 401
