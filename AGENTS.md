# Campus Nexus — Agent Quick Reference

**Last Updated:** 2026-09-05

**Working Directory:** `C:\Users/kshit/.geminiantigravity-ide\campus-nexus`

## Servers
- Backend: `python -m uvicorn app.main:app --host 127.0.0.1 --port 9501` (port 9501, no --reload on Windows)
- Frontend: `npm run dev` in `frontend/`

## Ports
- Backend API: `http://127.0.0.1:9501/api/v1`
- Frontend: `http://localhost:3000`

## Tests
- Smoke tests: `python -m pytest backend/tests/test_smoke.py -v`
- Full system: `python scripts/test_full_system.py` (31 tests)
- AI queries: `python scripts/test_ai_queries.py` (14 queries)
- New feature CRUD: `python backend/test_new_features.py` (7 tests)

### Test Results (2026-09-05)
- Full system: **31/31 PASS**
- New feature CRUD: **7/7 PASS**
- AI queries: **14/14 PASS** (OpenRouter with `minimax/minimax-m3:free`)
- Smoke tests: 3/19 PASS (3 pre-existing, 16 pre-existing failures — all unrelated to current features)

## Frontend
- Lint: `npx eslint . --ext .ts,.tsx`
- Typecheck: `npx tsc --noEmit` (clean)

### Key Frontend Files
- `frontend/lib/api-client.ts` — API client with `createStudent`, `deleteStudent`, `createFaculty`, `deleteFaculty` methods
- `frontend/lib/constants.ts` — `DEPARTMENTS`, `PROGRAMS`, `DESIGNATIONS` arrays; `ADMIN.STUDENTS`, `ADMIN.FACULTY`, `ADMIN.COURSES`, `ADMIN.ENROLLMENTS` nav entries
- `frontend/components/features/AddStudentModal.tsx`, `AddFacultyModal.tsx` — admin CRUD modals
- `frontend/app/admin/students/page.tsx`, `faculty/page.tsx` — admin UI with add/archive/editing
- `frontend/components/features/pulse.tsx` — Campus Pulse with `useLocation` context, fallback data, empty-state improvements
- `frontend/components/layout/student-nav.tsx`, `faculty-nav.tsx` — sidebar with `overflow-y-auto` scrolling

## Backend
- Python 3.14, FastAPI, SQLAlchemy async, PostgreSQL (localhost:5432)
- Redis: Unavailable (dev fallback)
- App entrypoint: `backend/app/main.py`

### Key Backend Files
- `backend/app/api/v1/admin.py` — Student/Faculty CRUD endpoints (create, archive); UUID conversion fix for `user_id` lookups
- `backend/app/api/v1/buildings.py` — Fixed N+1 query with `selectinload(BuildingModel.floors)` (reduced from N+1 queries to 2 batched queries)
- `backend/app/api/v1/ai.py` — LLM provider detection (OpenRouter vs OpenAI); `model_name` set at line 52, used at line 82; `datetime`/`timezone` imports fixed; provider-specific headers
- `backend/app/services/ai_orchestrator_service.py` — Intent keywords (added "leave", "should i go", "need to leave", "time to leave"); Hindi/Marathi translations; `_handle_next_class` with GPS lookup + ETA calculation
- `backend/app/core/config.py` — `LLM_PROVIDER`, `OPENROUTER_BASE_URL` config fields (defaults: openrouter, https://openrouter.ai/api/v1)
- `backend/app/models/student.py` — `schedule_entries` primaryjoin fixed (`Student.id` instead of `Student.user_id`)
- `backend/app/models/faculty.py` — `faculty_id` FK fixed: Integer FK to `faculties.id` (was PG_UUID FK to `users.id`)
- `backend/app/models/faculty_availability.py` — `faculty_id` FK type fixed from `PG_UUID(as_uuid=True)` to `Integer`
- `backend/app/models/user.py` — Removed `faculty_availabilities` relationship
- `backend/migrate_columns.py` — 22 index statements across users, students, faculties, campus_locations, user_location_states, presence_consent, notifications, issues, events, library_reservations, enrollments

### Model Schema
- `Student.user_id`, `StudentSchedule.student_id`, `User.id` = UUID
- `Student.id`, `Faculty.id`, `StudentSchedule.student_id` (after fix), `FacultyAvailability.faculty_id` (after fix) = INTEGER

### Configuration
- `.env` at project root with `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `DEBUG`
- `LLM_PROVIDER=openrouter`, `LLM_MODEL=minimax/minimax-m3:free`, `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`

## Known Issues
1. ESLint config missing — lint cannot run (`npx eslint . --ext .ts,.tsx` needs config)
2. SQL logging verbose — enables extensive `sqlalchemy.engine.Engine` output (set `LOG_LEVEL` or disable `echo=True` in config)
3. 16/19 smoke tests fail (pre-existing — missing routes, incorrect DB schema for some endpoints) — all unrelated to current features

## Filesystem Note
Write/Edit/Read tools target `C:\Users\kshit\.geminiantigravity-ide` (no separator between `.gemini` and `antigravity-ide`). Shell operates on `C:\Users\kshit\.gemini\antigravity-ide` (with backslash). Edits made by Write/Edit tools ARE visible at the shell-accessible path via Python file operations. To run scripts, use absolute paths pointing to the shell-accessible path: `C:\Users\kshit\.gemini\antigravity-ide\campus-nexus\...`
