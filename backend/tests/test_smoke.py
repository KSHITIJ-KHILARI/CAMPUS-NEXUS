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

        # 2. Student Auth
        r = await client.post("/api/v1/auth/login", json={"email": "student@somaiya.edu", "password": "demo123"})
        assert r.status_code == 200
        student_token = r.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 3. Faculty Auth
        r = await client.post("/api/v1/auth/login", json={"email": "faculty@somaiya.edu", "password": "demo123"})
        assert r.status_code == 200
        faculty_token = r.json()["access_token"]
        faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

        # 4. Admin Auth
        r = await client.post("/api/v1/auth/login", json={"email": "admin@somaiya.edu", "password": "demo123"})
        assert r.status_code == 200
        admin_token = r.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 5. Student Endpoints
        r = await client.get("/api/v1/students/me", headers=student_headers)
        assert r.status_code == 200

        r = await client.get("/api/v1/students/my-day", headers=student_headers)
        assert r.status_code == 200

        # 6. Faculty Endpoints
        r = await client.get("/api/v1/faculty/me", headers=faculty_headers)
        assert r.status_code == 200

        r = await client.get("/api/v1/faculty/schedule", headers=faculty_headers)
        assert r.status_code == 200

        # 7. Spatial / Campus Locations / Navigation
        r = await client.get("/api/v1/navigation/route?from_location=BHAK&to_location=SSBAS", headers=student_headers)
        assert r.status_code == 200

        r = await client.get("/api/v1/rooms/vacant", headers=student_headers)
        assert r.status_code == 200

        r = await client.get("/api/v1/pulse/locations", headers=student_headers)
        assert r.status_code == 200

        # 8. Library Catalog
        r = await client.get("/api/v1/library/books", headers=student_headers)
        assert r.status_code == 200

        # 9. Events, Issues, Emergency
        r = await client.get("/api/v1/events", headers=student_headers)
        assert r.status_code == 200

        r = await client.get("/api/v1/issues", headers=student_headers)
        assert r.status_code == 200

        r = await client.get("/api/v1/presence/consent", headers=student_headers)
        assert r.status_code == 200

        # 10. Admin Endpoints
        r = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
        assert r.status_code == 200

        r = await client.get("/api/v1/admin/system-health", headers=admin_headers)
        assert r.status_code == 200

        # 11. AI Campus Query
        r = await client.post("/api/v1/ai/chat", json={"message": "Show me my schedule"}, headers=student_headers)
        assert r.status_code == 200
        assert "response" in r.json()
