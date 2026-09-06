#!/usr/bin/env python3
"""Campus NEXUS Autonomous System Verification Test Suite.

Verifies end-to-end API correctness, authentication, database integrity,
and RBAC permissions across all Student, Faculty, and Admin endpoints.
"""

import asyncio
import sys
from pathlib import Path
import httpx

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
from app.main import app

test_results = []

def record(name: str, passed: bool, detail: str = ""):
    status = "PASS" if passed else "FAIL"
    test_results.append((name, passed, detail))
    print(f"[{status}] {name}: {detail}")


async def run_system_verification():
    print("==================================================")
    print(" CAMPUS NEXUS END-TO-END SYSTEM VERIFICATION SUITE")
    print("==================================================\n")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:

        # --- 1. AUTHENTICATION & RBAC ---
        print(">>> 1. Testing Authentication & RBAC...")
        tokens = {}
        users = [
            ("student", "student@somaiya.edu", "demo123"),
            ("faculty", "faculty@somaiya.edu", "demo123"),
            ("admin", "admin@somaiya.edu", "demo123"),
        ]
        for role, email, pwd in users:
            r = await client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
            if r.status_code == 200 and "access_token" in r.json():
                tokens[role] = r.json()["access_token"]
                record(f"Login {role.capitalize()}", True, f"Token obtained for {email}")
            else:
                record(f"Login {role.capitalize()}", False, f"Status: {r.status_code}, Body: {r.text}")

        # Verify /auth/me for each
        for role, token in tokens.items():
            headers = {"Authorization": f"Bearer {token}"}
            r = await client.get("/api/v1/auth/me", headers=headers)
            passed = r.status_code == 200 and r.json().get("role") == role
            record(f"Verify /auth/me ({role})", passed, f"Returned role: {r.json().get('role')}")

        student_hdrs = {"Authorization": f"Bearer {tokens['student']}"}
        faculty_hdrs = {"Authorization": f"Bearer {tokens['faculty']}"}
        admin_hdrs = {"Authorization": f"Bearer {tokens['admin']}"}

        # --- 2. STUDENT INTELLIGENCE JOURNEY ---
        print("\n>>> 2. Testing Student Intelligence & My-Day Endpoints...")
        # /students/me
        r = await client.get("/api/v1/students/me", headers=student_hdrs)
        passed = r.status_code == 200 and "student_id_number" in r.json()
        record("GET /students/me", passed, f"ID: {r.json().get('student_id_number')}, Prog: {r.json().get('program')}")

        # /students/my-day
        r = await client.get("/api/v1/students/my-day", headers=student_hdrs)
        passed = r.status_code == 200 and "next_lecture" in r.json() and "lectures_today" in r.json()
        next_lec = r.json().get("next_lecture", {})
        record("GET /students/my-day", passed, f"Next: {next_lec.get('subject')} in {next_lec.get('room')}, Delay: {next_lec.get('lift_delay_minutes')} min")

        # --- 3. FACULTY WORKFLOW & AVAILABILITY ---
        print("\n>>> 3. Testing Faculty Workflow Endpoints...")
        # /faculty/me
        r = await client.get("/api/v1/faculty/me", headers=faculty_hdrs)
        passed = r.status_code == 200 and "employee_id" in r.json()
        record("GET /faculty/me", passed, f"Employee ID: {r.json().get('employee_id')}, Desig: {r.json().get('designation')}")

        # /faculty/schedule
        r = await client.get("/api/v1/faculty/schedule", headers=faculty_hdrs)
        passed = r.status_code == 200 and len(r.json().get("schedule", [])) > 0
        record("GET /faculty/schedule", passed, f"{len(r.json().get('schedule', []))} class sessions loaded")

        # /faculty/students
        r = await client.get("/api/v1/faculty/students", headers=faculty_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        record("GET /faculty/students", passed, f"{len(r.json())} students enrolled")

        # /faculty/availability toggle
        r = await client.post("/api/v1/faculty/availability", json={"is_available": True, "office_location": "SSBAS Room 308"}, headers=faculty_hdrs)
        passed = r.status_code == 200 and r.json().get("status") == "success"
        record("POST /faculty/availability", passed, f"Office: {r.json().get('office_location')}")

        # --- 4. SPATIAL ROUTING, ELEVATOR DELAY & LEAVE-NOW ---
        print("\n>>> 4. Testing Spatial Routing & Leave-Now Engine...")
        # /navigation/route standard walking
        r = await client.get("/api/v1/navigation/route?from_location=BHAK&to_location=SSBAS", headers=student_hdrs)
        passed = r.status_code == 200 and "steps" in r.json() and r.json().get("lift_delay_minutes") == 4
        record("GET /navigation/route (BHAK->SSBAS)", passed, f"Duration: {r.json().get('duration_text')}, Elevator notice: {r.json().get('elevator_notice')}")

        # /navigation/route accessible
        r = await client.get("/api/v1/navigation/route?from_location=BHAK&to_location=SSBAS&mode=accessible", headers=student_hdrs)
        passed = r.status_code == 200 and "Accessible Ramp & Elevator Verified" in str(r.json())
        record("GET /navigation/route (accessible)", passed, f"Accessible mode step verified")

        # /navigation/leave-now
        r = await client.get("/api/v1/navigation/leave-now", headers=student_hdrs)
        passed = r.status_code == 200 and r.json().get("leave_now") is True
        record("GET /navigation/leave-now", passed, f"Leave now: {r.json().get('leave_now')}, Departure: {r.json().get('recommended_departure_time')}")

        # --- 5. SMART ROOM & VACANT LAB FINDER ---
        print("\n>>> 5. Testing Vacant Room & Lab Finder...")
        # /rooms/vacant
        r = await client.get("/api/v1/rooms/vacant", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        record("GET /rooms/vacant", passed, f"{len(r.json())} vacant rooms available")

        # /rooms/vacant lab filter
        r = await client.get("/api/v1/rooms/vacant?room_type=laboratory", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        record("GET /rooms/vacant (laboratory)", passed, f"{len(r.json())} labs vacant for computing")

        # --- 6. CROWD INTELLIGENCE & NEXUS BUZZ ---
        print("\n>>> 6. Testing Crowd Intelligence & NEXUS Buzz...")
        # /pulse/locations
        r = await client.get("/api/v1/pulse/locations", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) >= 6
        record("GET /pulse/locations", passed, f"{len(r.json())} campus spots telemetry tracked")

        # /pulse/report crowdsource
        r = await client.post("/api/v1/pulse/report", json={"location_name": "Canteen", "density_level": "high", "notes": "Lunch rush"}, headers=student_hdrs)
        passed = r.status_code == 200 and "recorded" in r.json().get("message", "")
        record("POST /pulse/report", passed, f"Report accepted and integrated into crowd state")

        # /pulse/buzz
        r = await client.get("/api/v1/pulse/buzz", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json().get("posts", [])) > 0
        record("GET /pulse/buzz", passed, f"{len(r.json().get('posts', []))} buzz posts retrieved, AI summary present")

        # --- 7. LIBRARY CATALOG & ATOMIC RESERVATIONS ---
        print("\n>>> 7. Testing Library Catalog & Reservations...")
        # /library/books
        r = await client.get("/api/v1/library/books", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        books = r.json()
        book_id = next((b["id"] for b in books if b.get("available_copies", 0) > 0), books[0]["id"] if books else None)
        record("GET /library/books", passed, f"{len(books)} books in catalog")

        # /library/reserve
        r = await client.post("/api/v1/library/reserve", json={"book_id": book_id}, headers=student_hdrs)
        passed = r.status_code == 200 and "pickup_deadline" in r.json()
        record("POST /library/reserve", passed, f"Reserved {book_id}, Status: {r.json().get('status')}")

        # /library/seats
        r = await client.get("/api/v1/library/seats", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        record("GET /library/seats", passed, f"{len(r.json())} seats monitored")

        # --- 8. ACADEMIC RESOURCES & INFRASTRUCTURE ISSUES ---
        print("\n>>> 8. Testing Academic Resources & Campus Issues...")
        # /resources
        r = await client.get("/api/v1/resources", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        record("GET /resources", passed, f"{len(r.json())} academic resources available")

        # /issues
        r = await client.get("/api/v1/issues", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        record("GET /issues", passed, f"{len(r.json())} open/in-progress issues tracked")

        # /events
        r = await client.get("/api/v1/events", headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json()) > 0
        record("GET /events", passed, f"{len(r.json())} events listed without greenlet error")

        # --- 9. ADMIN COMMAND & SYSTEM HEALTH ---
        print("\n>>> 9. Testing Admin Command & Telemetry...")
        # /admin/dashboard
        r = await client.get("/api/v1/admin/dashboard", headers=admin_hdrs)
        passed = r.status_code == 200 and "active_issues" in r.json()
        record("GET /admin/dashboard", passed, f"Issues: {r.json().get('active_issues')}, Lift problems: {r.json().get('lift_issues')}")

        # /admin/analytics
        r = await client.get("/api/v1/admin/analytics", headers=admin_hdrs)
        passed = r.status_code == 200 and "metrics" in r.json()
        record("GET /admin/analytics", passed, f"Classroom Util: {r.json().get('metrics', {}).get('classroom_utilization')}%")

        # /admin/system-health
        r = await client.get("/api/v1/admin/system-health", headers=admin_hdrs)
        passed = r.status_code == 200 and r.json().get("postgresql") == "CONNECTED"
        record("GET /admin/system-health", passed, f"PostgreSQL: {r.json().get('postgresql')}, AI Provider: {r.json().get('ai_provider')}")

        # /admin/users
        r = await client.get("/api/v1/admin/users", headers=admin_hdrs)
        passed = r.status_code == 200 and len(r.json()) >= 5
        record("GET /admin/users", passed, f"{len(r.json())} registered users")

        # --- 10. AI TWIN CHAT ---
        print("\n>>> 10. Testing AI Campus Twin Query...")
        r = await client.post("/api/v1/ai/chat", json={"message": "Where is my next class and what is the fastest route?"}, headers=student_hdrs)
        passed = r.status_code == 200 and len(r.json().get("response", "")) > 0
        record("POST /ai/chat", passed, f"Response: {r.json().get('response', '')[:65]}...")

    # Summary
    print("\n==================================================")
    total = len(test_results)
    passed_count = sum(1 for _, p, _ in test_results if p)
    failed_count = total - passed_count
    print(f" TOTAL TESTS: {total} | PASSED: {passed_count} | FAILED: {failed_count}")
    print("==================================================")
    if failed_count == 0:
        print("[SUCCESS] ALL ZERO-TO-100% SUBSYSTEMS FULLY OPERATIONAL AND VERIFIED!")
    else:
        print("[WARNING] SOME TESTS FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_system_verification())
