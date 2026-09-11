<p align="center">
  <h1 align="center">Campus NEXUS</h1>
  <p align="center">
    <strong>AI-Powered Digital Twin & Campus Intelligence Platform</strong>
    <br />
    <em>Built By Kshitij,Harshit,Piyush</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.111+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Three.js-R160-000000?logo=three.js" alt="Three.js" />
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/License-All%20Rights%20Reserved-red" alt="License" />
  </p>
</p>

---

## Overview

Campus NEXUS is a unified campus operating layer that synthesizes real-time spatial positioning, academic scheduling, facility telemetry, crowd density sensing, and multi-agent AI orchestration to serve students, faculty, and administrators at Somaiya Vidyavihar University.

Unlike traditional disconnected departmental tools, NEXUS provides:
- **Proactive "Leave-Now" routing** with real-time ETA and elevator delay compensation
- **Live facility availability** and crowd density monitoring (Campus Pulse)
- **Interactive 3D Digital Twin** with what-if scenario simulation
- **Full-campus 360° virtual tours**
- **Natural-language AI assistant** (NEXUS AI) powered by LLM + PostgreSQL ground truth

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Next.js 14 Frontend             │
│  (React 18 / Tailwind / Three.js / TS)  │
└───────────────────┬─────────────────────┘
                    │ HTTP / WebSocket
                    ▼
┌─────────────────────────────────────────┐
│         FastAPI Backend Engine          │
│   (Python 3.11+ / Async / Pydantic)    │
└──────┬────────────────────┬─────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐   ┌───────────────────┐
│ PostgreSQL 16│   │ NEXUS AI Engine   │
│ (SQLAlchemy) │   │ (OpenRouter/LLM)  │
└──────────────┘   └───────────────────┘
```

The frontend communicates with the backend via REST endpoints and WebSocket connections. All database queries use SQLAlchemy async with parameterized statements. Redis is optionally used for caching with an automatic in-memory fallback for local development.

---

## Key Features

### 🎓 Student Intelligence
- **Personalized Dashboard & "My Day"** — Real-time itinerary with current/upcoming lectures, room assignments, and academic status
- **Smart "Leave-Now" Routing** — Walking ETA engine that factors in real-time elevator maintenance delays
- **Faculty Availability** — Live professor availability, consultation hours, and office locations filtered by enrolled courses
- **Interactive Campus Map & 360° Tour** — Spatial navigation with high-res panoramic campus views
- **Library Catalog & Reservations** — Live book search, seat availability, and instant reservation tokens
- **Campus Events** — Discovery, filtering, and one-click registration for workshops, hackathons, and cultural events
- **Lost & Found Portal** — Community-driven item reporting with match status tracking

### 👩‍🏫 Faculty Workspace
- **Academic Schedule** — Daily lecture sessions, assigned classrooms, and enrolled student lists
- **Live Availability Toggle** — One-click office status broadcasting (Available / In Consultation / Busy)
- **Student Mentorship Directory** — Course-specific student rosters with profile access

### 🏛️ Admin Command & Control
- **Campus Telemetry Dashboard** — Facility utilization, classroom capacity, and infrastructure reports
- **Digital Twin & What-If Simulation** — Spatial scenario modeling (lab closure, classroom reassignment, crowd surge)
- **Campus Pulse & Overrides** — Real-time crowd density with manual overrides for special events
- **Student & Faculty CRUD** — Administrative workflows with data archiving and access auditing
- **Emergency Dispatch** — Incident management with status tracking for campus security and medical alerts

### 🤖 NEXUS AI Assistant
- Natural-language campus queries powered by LLM providers (OpenRouter / OpenAI) with deterministic PostgreSQL tool execution and rule-based fallbacks

---

## Technology Stack

| Domain | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS with custom institutional design system |
| **3D Digital Twin** | Three.js, React Three Fiber |
| **Mapping** | MapLibre GL JS |
| **Charts** | Recharts |
| **State Management** | Zustand, TanStack React Query |
| **Animations** | Framer Motion, GSAP |
| **Backend** | FastAPI (Python 3.11+), Pydantic v2, Uvicorn |
| **Database** | Firebase , Firestore |
| **Caching** | Redis 7 (optional, with in-memory fallback) |
| **Authentication** | Firebase Auth, JWT with Role-Based Access Control |
| **AI Integration** | OpenRouter / OpenAI API, Genkit |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker, Docker Compose |

---

## Prerequisites

- **Node.js** v18.17.0+
- **Python** 3.11+
- **Firebase** 
- **Redis** (optional — system includes in-memory fallback)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/campus-nexus.git
cd campus-nexus
```

### 2. Database Setup

Create a Firebase database:

```

### 3. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials, SECRET_KEY, and API keys
```

Seed demo data:

```bash
cd ..
python scripts/seed_demo_data.py
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL points to your backend (e.g., http://127.0.0.1:9501/api/v1)
```

### 5. Run Locally

**Backend** (from project root):
```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 9501
```

**Frontend** (from `frontend/`):
```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://127.0.0.1:9501/api/v1 |
| API Docs (Swagger) | http://127.0.0.1:9501/docs |
| Health Check | http://127.0.0.1:9501/health |

### Docker (Alternative)

```bash
docker-compose up
```

This starts PostgreSQL, Redis, the backend, and frontend together.

---

## Demo Accounts

Pre-seeded accounts for testing and demonstration:

| Role | Email | Scope |
|---|---|---|
| **Student** | `student@somaiya.edu` | Dashboard, My Day, Pulse, Map, Library, Events, AI |
| **Faculty** | `faculty@somaiya.edu` | Schedule, Availability, Students, Classroom |
| **Admin** | `admin@somaiya.edu` | Command Center, Digital Twin, CRUD, Analytics, Simulation |

---

## Project Structure

```
campus-nexus/
│
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/                 # REST endpoints (auth, AI, digital twin)
│   │   ├── core/                   # Config, security, Firebase, WebSocket
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── services/               # Business logic (12 service modules)
│   │   └── main.py                 # Application entrypoint
│   ├── tests/                      # Backend test suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                       # Next.js 14 App Router frontend
│   ├── app/                        # Pages & route groups
│   │   ├── admin/                  # 19 admin sub-routes
│   │   ├── student/                # 15 student sub-routes
│   │   ├── faculty/                # 11 faculty sub-routes
│   │   └── auth/                   # Authentication
│   ├── components/
│   │   ├── campus/                 # Campus-specific modals
│   │   ├── features/               # Full-page feature components
│   │   ├── layout/                 # Navigation sidebars
│   │   └── ui/                     # Reusable UI primitives
│   ├── genkit/                     # Genkit AI integration
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # API client, types, utilities
│   ├── Dockerfile
│   └── package.json
│
├── campus-3d/                      # Standalone 3D campus visualization
├── scripts/                        # DB seeding, testing & inspection
├── supabase/                       # Database schema & seed SQL
├── docs/                           # Technical documentation
│
├── docker-compose.yml
├── Makefile
├── .env.example
└── README.md
```

---

## Testing

### End-to-End System Tests (31 tests)
```bash
python scripts/test_full_system.py
```

### AI Query Tests (14 queries)
```bash
python scripts/test_ai_queries.py
```

### Backend Smoke Tests
```bash
cd backend && pytest tests/ -v
```

### Frontend Type Check
```bash
cd frontend && npx tsc --noEmit
```

### Frontend Production Build
```bash
cd frontend && npm run build
```

---

## Deployment

### Backend (Docker / Render / Railway)

Build using `backend/Dockerfile` and configure:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Firebase URL |
| `REDIS_URL` | Redis URL (omit for in-memory fallback) |
| `SECRET_KEY` | 64+ character random secret |
| `ENVIRONMENT` | `production` |
| `BACKEND_CORS_ORIGINS` | `["https://your-frontend.com"]` |
| `ALLOWED_HOSTS` | `["your-api-domain.com"]` |
| `NEXUS_API_KEY` | OpenRouter or OpenAI API key or Gemini Flash |
| `LLM_PROVIDER` | `openrouter` , 'Gemini ' |
| `LLM_MODEL` | `minimax/minimax-m3:free` , 'gemini 3.6,gemini 3.5,gemini 3.7 flash ' |

### Frontend (Vercel / Netlify)

Set Root Directory to `frontend` and configure:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `wss://your-api-domain.com` |
| `NEXTAUTH_URL` | `https://your-frontend.com` |
| `NEXTAUTH_SECRET` | Random 32+ character string |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | MapTiler API key |

---

## Security

- **Zero hardcoded secrets** — all credentials via environment variables
- **Role-Based Access Control (RBAC)** — enforced at the API layer via JWT dependency injection
- **Location privacy** — strictly opt-in with database-backed consent; raw GPS never exposed to other users
- **SQL injection prevention** — 100% parameterized queries via SQLAlchemy
- **CORS & host whitelisting** — strict origin controls in production
- **Production secret validation** — backend validates `SECRET_KEY` entropy on startup

---

## Documentation

Detailed technical documentation is available in the [`docs/`](docs/) directory:

- [Architecture](docs/ARCHITECTURE.md) — System design, authentication flow, and Digital Twin architecture
- [API Reference](docs/API_REFERENCE.md) — Endpoint specifications
- [Database](docs/DATABASE.md) — Schema design and relationships
- [AI Agents](docs/AI_AGENTS.md) — NEXUS AI orchestration and tool bindings
- [Security](docs/SECURITY.md) — Security model and privacy architecture
- [Demo Guide](docs/DEMO_GUIDE.md) — Walkthrough for demonstrations
- [Simulation](docs/SIMULATION.md) — What-If scenario engine

---

## Makefile Commands

```bash
make install          # Install all dependencies
make setup            # Full project setup (DB + seed)
make dev              # Start full development environment
make test             # Run all tests
make lint             # Run linters (ruff + eslint)
make format           # Format code (ruff + prettier)
make clean            # Clean build artifacts
make demo             # Run demo mode
```

---

## Architecture Decisions

See [`DECISIONS.md`](DECISIONS.md) for recorded Architecture Decision Records (ADRs) covering technology choices, security model, and design patterns.

---

## Contributors

Built with pride by:

- **Kshitij**
- **Harshit**
- **Piyush**

---

<p align="center">
  <strong>Campus NEXUS</strong> — Built by Kshitij, Harshit & Piyush<br />
  © 2026 Campus NEXUS. All rights reserved.
</p>
