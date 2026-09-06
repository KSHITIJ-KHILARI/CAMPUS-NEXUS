# Campus NEXUS Architecture

## 1. System Architecture Overview

Campus NEXUS is an AI-driven digital twin and campus orchestration platform for Somaiya Vidyavihar University.

```
┌────────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                     │
│  (App Router, React 18, Three.js, Lucide, Tailwind CSS)    │
└────────────────────────────┬───────────────────────────────┘
                             │ REST / WebSockets (Bearer JWT)
                             ▼
┌────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                       │
│  - Routers (auth, students, faculty, admin, navigation...) │
│  - AI Orchestrator (Deterministic Twin Tools + LLM/Ollama) │
│  - Simulation & Optimization Engine (OR-Tools)             │
│  - Background Tasks & Real-Time Telemetry                  │
└──────────────┬──────────────────────────────┬──────────────┘
               │ AsyncPG                      │ Redis Async
               ▼                              ▼
┌────────────────────────────┐  ┌────────────────────────────┐
│       PostgreSQL 18        │  │     Redis / In-Memory      │
│  - Core Campus Models      │  │  - Pub/Sub                 │
│  - Digital Twin State      │  │  - Transient Cache         │
│  - Timetables & Schedules  │  │  - Rate Limiting           │
└────────────────────────────┘  └────────────────────────────┘
```

## 2. Authentication & RBAC

1. **Authentication Flow**:
   - `POST /api/v1/auth/login` accepts email & password, returns JWT access token (`Bearer <token>`) with user details & role.
   - Frontend stores token in `localStorage.auth_token`.
   - `AuthProvider` validates token with `GET /api/v1/auth/verify` on initialization.
   - `api-client.ts` automatically attaches `Authorization: Bearer <token>` to all protected calls.
2. **Roles**:
   - `student`: Access to personal schedule, navigation, pulse, library, issues, lost & found, AI.
   - `faculty`: Access to teaching timetable, student information, classroom issues, availability.
   - `admin`: Full command center, digital twin controls, user management, scenario simulations, analytics.

## 3. Digital Twin & Smart Navigation Architecture

- **State Model**: Aggregates physical campus entities (buildings, floors, rooms, facilities, lifts) with dynamic telemetry (crowd states, incident reports, elevator operational status).
- **Navigation Calculation**: Combines base walking distance between campus coordinates with floor transition costs and lift delay penalties. If an elevator in a building is out of order, navigation calculates alternative stair routes or secondary lifts and alerts the student.
- **Walking Simulation**: Demonstrates student avatar traversing from starting position to destination through campus corridors and floor changes.
- **Leave Now Engine**: Compares current time with `next_class.start_time - total_eta_minutes`, issuing proactive departure recommendations.

## 4. NEXUS AI Orchestration

- Uses a tool-selection layer bound to real PostgreSQL queries:
  - `get_next_class`, `calculate_leave_time`, `get_campus_pulse`, `find_available_rooms`, `search_library_books`, `reserve_book`, `report_issue`, `run_simulation`.
- External synthesis: Uses `NEXUS_API_KEY` (OpenAI / provider) or local Ollama if configured; gracefully defaults to verified PostgreSQL facts if external LLM is offline.
