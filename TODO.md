# Campus NEXUS Engineering TODO

## P0 Blockers (Immediate Fixes)
- [x] Align PostgreSQL schema: create `library_books`, `library_copies`, `library_reservations`, `library_seats`, `learning_resources`, `resource_bookmarks`.
- [x] Fix `issues` and `found_items` column mismatches (`category`, `confidence`, `cluster_id`, `assigned_to`, `resolved_at`, `claimed_by_user_id`).
- [x] Fix route declaration order in `rooms.py` so `/rooms/vacant` does not match `/{room_id}` with 422 error.
- [x] Fix `events.py` `greenlet_spawn` async lazy-loading error on location relationship.
- [x] Seed comprehensive realistic Somaiya Vidyavihar campus data (buildings, rooms, schedules, books, crowd pulse, lifts, events, issues).

## P1 Critical (Backend & API Core)
- [x] Implement `/api/v1/students/me` and `/api/v1/students/my-day`.
- [x] Implement `/api/v1/faculty/me` and `/api/v1/faculty/schedule`.
- [x] Implement `/api/v1/navigation/leave-now` and smart ETA with lift status consideration.
- [x] Implement `/api/v1/pulse/locations` and crowd reporting submission endpoint (`POST /pulse/report`).
- [x] Implement `/api/v1/admin/analytics` and `/api/v1/admin/dashboard/summary`.
- [x] Implement real atomic book reservation in `/api/v1/library/reserve`.

## P2 Functional (Frontend & Digital Twin)
- [x] Update `frontend/lib/api-client.ts` to unify API client mappings.
- [x] Connect `student-dashboard.tsx` to live backend data (next class, leave-now, alerts).
- [x] Connect `explore/page.tsx` vacant rooms and library reservation to backend.
- [x] Connect `map/page.tsx` to dynamic locations and navigation API.
- [x] Connect `admin-dashboard.tsx` to real KPIs from backend.
- [x] Implement Walking Digital Twin 3D/2D animation showing student avatar progressing through campus to target room.
- [x] Wire Digital Twin What-If scenarios (Lab 3 closure & relocation, elevator outage, crowd surge).

## P3 UI/UX & Dead Button Elimination
- [x] Audit all buttons across Student, Faculty, and Admin interfaces (View Details, Reserve, Report, Navigate, Back).
- [x] Ensure modals submit to real backend APIs and display success feedback.
- [x] Verify Somaiya visual identity (crimson, neutral dark, glassmorphism, responsive).

## P4 Verification & Quality Assurance
- [x] Run automated API test suite across all roles (31/31 passed).
- [x] Run `npm run build` (30/30 routes compiled cleanly).
- [x] Verify Student, Faculty, and Admin end-to-end user journeys.
