#!/usr/bin/env python3
"""Tests for admin student/faculty CRUD endpoints.

Uses a single asyncio.run() to maintain connection pool health,
matching the pattern used by test_full_system.py.
"""

import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import httpx
from app.main import app

test_results = []


def _unique(prefix: str) -> str:
    return f"{prefix}{int(time.time() * 1000)}@somaiya.edu"


async def run_tests():
    print("==================================================")
    print(" ADMIN STUDENT/FACULTY CRUD TEST SUITE")
    print("==================================================\n")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # Login as admin
        r = await client.post("/api/v1/auth/login", json={"email": "admin@somaiya.edu", "password": "demo123"})
        if r.status_code != 200:
            print(f"[FAIL] Admin login: {r.status_code}")
            sys.exit(1)
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("[SETUP] Admin login successful\n")

        # --- Test 1: Create student ---
        print(">>> Test 1: Create student")
        payload = {
            "email": _unique("newstudent"),
            "password": "password123",
            "full_name": "Test Student CRUD",
            "student_id_number": f"STU{int(time.time() * 1000)}",
            "enrollment_date": "2024-01-15",
            "academic_year": "2024-2025",
            "program_code": "Computer Science",
            "department_code": "CS",
        }
        r = await client.post("/api/v1/admin/students", json=payload, headers=headers)
        passed = r.status_code == 200 and r.json()["email"] == payload["email"]
        detail = f"Status: {r.status_code}, Email match: {r.json().get('email') == payload['email']}" if r.status_code == 200 else r.text
        test_results.append(("Create student", passed, detail))
        print(f"[{'PASS' if passed else 'FAIL'}] Create student: {detail}\n")

        # --- Test 2: Create duplicate student ---
        print(">>> Test 2: Create duplicate student")
        sid = payload["student_id_number"]
        payload2 = {
            "email": _unique("dupstudent"),
            "password": "password123",
            "full_name": "Dup Student 2",
            "student_id_number": sid,
            "enrollment_date": "2024-01-15",
            "academic_year": "2024-2025",
            "program_code": "Computer Science",
            "department_code": "CS",
        }
        r = await client.post("/api/v1/admin/students", json=payload2, headers=headers)
        passed = r.status_code == 400
        detail = f"Status: {r.status_code} (expected 400)"
        test_results.append(("Create duplicate student", passed, detail))
        print(f"[{'PASS' if passed else 'FAIL'}] Create duplicate: {detail}\n")

        # --- Test 3: Invalid student data ---
        print(">>> Test 3: Invalid student data")
        payload_bad = {
            "email": "not-an-email",
            "password": "",
            "full_name": "",
            "student_id_number": "",
            "enrollment_date": "",
            "academic_year": "",
            "program_code": "CS",
            "department_code": "CS",
        }
        r = await client.post("/api/v1/admin/students", json=payload_bad, headers=headers)
        passed = r.status_code == 422
        detail = f"Status: {r.status_code} (expected 422)"
        test_results.append(("Create student (invalid data)", passed, detail))
        print(f"[{'PASS' if passed else 'FAIL'}] Invalid data: {detail}\n")

        # --- Test 4: Archive student ---
        print(">>> Test 4: Archive student")
        arch_payload = {
            "email": _unique("archstudent"),
            "password": "password123",
            "full_name": "Archive Student",
            "student_id_number": f"STU{int(time.time() * 1000)}",
            "enrollment_date": "2024-01-15",
            "academic_year": "2024-2025",
            "program_code": "Computer Science",
            "department_code": "CS",
        }
        r1 = await client.post("/api/v1/admin/students", json=arch_payload, headers=headers)
        if r1.status_code != 200:
            passed = False
            detail = f"Create failed: {r1.status_code} {r1.text}"
            test_results.append(("Archive student", passed, detail))
            print(f"[FAIL] Archive student: {detail}\n")
        else:
            student_id = r1.json()["user_id"]
            r2 = await client.delete(f"/api/v1/admin/students/{student_id}", headers=headers)
            passed = r2.status_code == 200 and "archived" in r2.json()["message"].lower()
            detail = f"Status: {r2.status_code}, Message: {r2.json().get('message', '')}" if r2.status_code == 200 else r2.text
            test_results.append(("Archive student", passed, detail))
            print(f"[{'PASS' if passed else 'FAIL'}] Archive student: {detail}\n")

        # --- Test 5: Create faculty ---
        print(">>> Test 5: Create faculty")
        fac_payload = {
            "email": _unique("newfaculty"),
            "password": "password123",
            "full_name": "Test Faculty CRUD",
            "employee_id_number": f"FAC{int(time.time() * 1000)}",
            "designation": "Professor",
            "department_code": "CS",
        }
        r = await client.post("/api/v1/admin/faculty", json=fac_payload, headers=headers)
        passed = r.status_code == 200 and r.json()["email"] == fac_payload["email"]
        detail = f"Status: {r.status_code}, Email match: {r.json().get('email') == fac_payload['email']}" if r.status_code == 200 else r.text
        test_results.append(("Create faculty", passed, detail))
        print(f"[{'PASS' if passed else 'FAIL'}] Create faculty: {detail}\n")

        # --- Test 6: Archive faculty ---
        print(">>> Test 6: Archive faculty")
        arch_fac = {
            "email": _unique("archfaculty"),
            "password": "password123",
            "full_name": "Archive Faculty",
            "employee_id_number": f"FAC{int(time.time() * 1000)}",
            "designation": "Professor",
            "department_code": "CS",
        }
        r1 = await client.post("/api/v1/admin/faculty", json=arch_fac, headers=headers)
        if r1.status_code != 200:
            passed = False
            detail = f"Create failed: {r1.status_code} {r1.text}"
            test_results.append(("Archive faculty", passed, detail))
            print(f"[FAIL] Archive faculty: {detail}\n")
        else:
            faculty_id = r1.json()["user_id"]
            r2 = await client.delete(f"/api/v1/admin/faculty/{faculty_id}", headers=headers)
            passed = r2.status_code == 200 and "archived" in r2.json()["message"].lower()
            detail = f"Status: {r2.status_code}, Message: {r2.json().get('message', '')}" if r2.status_code == 200 else r2.text
            test_results.append(("Archive faculty", passed, detail))
            print(f"[{'PASS' if passed else 'FAIL'}] Archive faculty: {detail}\n")

        # --- Test 7: Unauthorized access ---
        print(">>> Test 7: Unauthorized access")
        r = await client.post("/api/v1/admin/students", json={
            "email": "test@test.com",
            "password": "password123",
            "full_name": "Test",
            "student_id_number": "STU123",
            "enrollment_date": "2024-01-15",
            "academic_year": "2024-2025",
            "program_code": "CS",
            "department_code": "CS",
        })
        passed = r.status_code in (401, 403)
        detail = f"Status: {r.status_code} (expected 401/403)"
        test_results.append(("Unauthorized access", passed, detail))
        print(f"[{'PASS' if passed else 'FAIL'}] Unauthorized access: {detail}\n")

    # Cleanup test users created during test execution
    try:
        from app.core.database import async_session_factory
        from sqlalchemy import text
        async with async_session_factory() as session:
            test_patterns = ["newstudent%@somaiya.edu", "archstudent%@somaiya.edu", "newfaculty%@somaiya.edu", "archfaculty%@somaiya.edu"]
            for pattern in test_patterns:
                # Find test user ids
                result = await session.execute(text("SELECT id FROM users WHERE email LIKE :pat"), {"pat": pattern})
                uids = [str(r[0]) for r in result.fetchall()]
                if uids:
                    # Clean student/faculty links
                    await session.execute(text("DELETE FROM student_schedules WHERE student_id IN (SELECT id FROM students WHERE user_id::text = ANY(:uids))"), {"uids": uids})
                    await session.execute(text("DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE user_id::text = ANY(:uids))"), {"uids": uids})
                    await session.execute(text("DELETE FROM students WHERE user_id::text = ANY(:uids)"), {"uids": uids})
                    await session.execute(text("DELETE FROM faculty_availability WHERE faculty_id IN (SELECT id FROM faculties WHERE user_id::text = ANY(:uids))"), {"uids": uids})
                    await session.execute(text("DELETE FROM faculties WHERE user_id::text = ANY(:uids)"), {"uids": uids})
                    await session.execute(text("DELETE FROM user_location_states WHERE user_id::text = ANY(:uids)"), {"uids": uids})
                    await session.execute(text("DELETE FROM presence_consent WHERE user_id::text = ANY(:uids)"), {"uids": uids})
                    await session.execute(text("DELETE FROM notifications WHERE recipient_id::text = ANY(:uids)"), {"uids": uids})
                    await session.execute(text("DELETE FROM users WHERE id::text = ANY(:uids)"), {"uids": uids})
            await session.commit()
    except Exception as cleanup_err:
        print(f"[NOTE] Test cleanup skipped: {cleanup_err}")

    # Summary
    print("==================================================")
    total = len(test_results)
    passed_count = sum(1 for _, p, _ in test_results if p)
    failed_count = total - passed_count
    print(f" TOTAL: {total} | PASSED: {passed_count} | FAILED: {failed_count}")
    print("==================================================")
    if failed_count == 0:
        print("[SUCCESS] ALL ADMIN CRUD TESTS PASSED & TEST DATA CLEANED!")
    else:
        for name, passed, detail in test_results:
            if not passed:
                print(f"  FAILED: {name} - {detail}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_tests())
