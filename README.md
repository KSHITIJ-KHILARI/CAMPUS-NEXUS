# Campus NEXUS

**The AI-Powered Digital Twin and Campus Intelligence Platform**  
*Somaiya Vidyavihar University, Mumbai*

---

## Overview

Campus NEXUS is an institutional intelligence platform and interactive digital twin designed for modern university campuses. Built specifically around the campus ecosystem of Somaiya Vidyavihar University, the platform synthesizes real-time spatial positioning, academic scheduling, facility telemetry, crowd density sensing, and multi-agent AI orchestration to assist students, faculty, and administrative leadership.

Rather than acting as a disconnected collection of departmental tools, Campus NEXUS functions as a unified campus operating layer—providing proactive "Leave-Now" routing, live facility availability, intelligent crowd telemetry (Campus Pulse), full-campus 360° tours, and natural-language institutional intelligence powered by NEXUS AI.

---

## Architecture

Campus NEXUS adopts a modular, decoupled architecture:

```
                                  ┌─────────────────────────────┐
                                  │      Next.js 14 Client      │
                                  │ (React 18 / Tailwind / 3D)  │
                                  └──────────────┬──────────────┘
                                                 │ HTTP / WebSocket
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │    FastAPI Backend Engine   │
                                  │  (Python 3.14 / Asyncio)    │
                                  └──────┬───────────────┬──────┘
                                         │               │
                 ┌───────────────────────┴──────┐        │
                 ▼                              ▼        ▼
  ┌───────────────────────────┐  ┌────────────────┐  ┌────────────────────────┐
  │   PostgreSQL 16 Database  │  │  Redis Engine  │  │   NEXUS AI Orchestrator│
  │ (Async SQLAlchemy/PostGIS)│  │ (Cache/State)  │  │ (OpenRouter/LLM/DB)    │
  └───────────────────────────┘  └────────────────┘  └────────────────────────┘
```

1. **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Three.js (React Three Fiber) for 3D campus twin visualization, and MapLibre GL for spatial campus mapping.
2. **Backend**: FastAPI with asynchronous SQLAlchemy ORM, Pydantic data validation, JWT authentication with Role-Based Access Control (RBAC), and slowapi rate limiting.
3. **Database**: PostgreSQL 16 storing structured institutional ground truth: buildings, floors, rooms, courses, student schedules, faculty availability, library catalog, events, and telemetry logs.
4. **Cache & State Engine**: Redis for real-time crowd metrics and caching, with automatic in-memory fallback for local development.
5. **AI Orchestrator**: Server-side NEXUS AI engine connecting to LLM providers (OpenRouter / OpenAI) with prompt-grounded PostgreSQL tool execution and deterministic rule fallbacks.

---

## Core Features

### 🎓 Student Intelligence
- **Personalized Dashboard & "My Day"**: Real-time itinerary tracking current and upcoming lectures, room assignments, and academic status.
- **Smart "Leave-Now" Routing**: ETA engine that calculates walking travel time between campus buildings and incorporates real-time lift maintenance delays into route recommendations.
- **Course-Aware Faculty Availability**: Direct visibility into professors' availability, consultation hours, and office locations filtered by enrolled courses.
- **Student Portfolio**: Academic and co-curricular showcase highlighting GPA, course completions, certifications, and project submissions.
- **Interactive Campus Map & 360° Tour**: Spatial navigation across campus buildings, pathways, landmarks, and high-resolution panoramic 360° interactive campus panoramas.
- **Library Catalog & Reservations**: Live book catalog search, real-time seat availability monitoring, and one-click reserve with instant reservation tokens.
- **Campus Events**: Discovery, filtering, and instant registration for campus workshops, hackathons, and cultural activities.
- **Lost & Found Portal**: Community-driven reporting, categorized item tracking, and match status updates.

### 👩‍🏫 Faculty Workspace
- **Academic Schedule**: Overview of daily lecture sessions, assigned classrooms, and enrolled student lists.
- **Live Availability Management**: One-click toggling of office status (Available / In Consultation / Busy) and office room broadcasting.
- **Student Mentorship Directory**: Course-specific student rosters with direct profile access.

### 🏛️ Admin Command & Control
- **Campus Telemetry Dashboard**: Institutional oversight displaying facility utilization, classroom capacity tracking, and unresolved infrastructure reports.
- **Digital Twin & What-If Simulation**: Spatial scenario modeling (e.g., lab closure simulations, classroom reassignment).
- **Campus Pulse Telemetry & Overrides**: Real-time crowd density monitoring with administrative manual overrides for special campus events.
- **Student & Faculty Management**: Comprehensive administrative CRUD workflows with data archiving and access auditing.
- **Emergency Dispatch & Response**: Incident management for campus security and medical alerts with status tracking.

### 🤖 NEXUS AI Assistant
- Natural-language campus assistant capable of answering questions regarding lecture schedules, vacant rooms, faculty consultation hours, library book availability, campus events, and spatial navigation using institutional database ground truth.

---

## Technology Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | Server-rendered and client-interactive React architecture |
| **Language (UI)** | TypeScript | Static typing across components, hooks, and API clients |
| **Styling** | Tailwind CSS | Institutional design system with responsive dark palette |
| **3D Digital Twin** | Three.js & React Three Fiber | Real-time 3D campus rendering and spatial inspection |
| **Mapping Engine** | MapLibre GL JS | Vector-tile campus interactive map |
| **Backend Framework** | FastAPI (Python 3.11+) | High-performance asynchronous REST API |
| **Database** | PostgreSQL 16 | Relational ground truth with PostGIS geospatial capabilities |
| **ORM & Driver** | SQLAlchemy 2.0 (Async) + asyncpg | Asynchronous database access and connection pooling |
| **Caching & Rate Limiting** | Redis 7 + slowapi | Token-bucket rate limiting and real-time state caching |
| **Authentication** | JWT (JSON Web Tokens) + Passlib/Bcrypt | Cryptographically signed tokens with strict RBAC |
| **AI Integration** | OpenRouter / OpenAI API | Configurable LLM orchestrator with PostgreSQL tool bindings |

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18.17.0 or later
- **Python**: 3.10 or later
- **PostgreSQL**: 15 or later
- **Redis**: (Optional for local development; system includes in-memory fallback)

---

### 1. Database Setup

Create a PostgreSQL database and user:

```sql
CREATE USER campus_nexus WITH PASSWORD 'campus_nexus_pass';
CREATE DATABASE campus_nexus OWNER campus_nexus;
GRANT ALL PRIVILEGES ON DATABASE campus_nexus TO campus_nexus;
```

---

### 2. Backend Setup

1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to supply your database credentials, `SECRET_KEY`, and AI API key if using OpenRouter.

4. Populate demo showcase data:
   ```bash
   python scripts/seed_demo_data.py
   ```

---

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to your backend (`http://localhost:8000/api/v1` or `http://127.0.0.1:9501/api/v1`).

---

## Running Locally

### Starting the Backend Server
From the project root:
```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 9501
```
- **API Base URL**: `http://127.0.0.1:9501/api/v1`
- **Interactive OpenAPI Docs**: `http://127.0.0.1:9501/docs` (in development mode)
- **Health Check**: `http://127.0.0.1:9501/health`

### Starting the Frontend Development Server
From the `frontend/` directory:
```bash
npm run dev
```
- **Application URL**: `http://localhost:3000`

---

## Demo Accounts

The database includes pre-seeded institutional showcase accounts for testing and demonstration:

| Role | Email | Password | Scope of Access |
|---|---|---|---|
| **Student** | `student@somaiya.edu` | `demo123` | Student Dashboard, My Day, Portfolio, Pulse, Map, AI |
| **Faculty** | `faculty@somaiya.edu` | `demo123` | Faculty Schedule, Availability Toggle, Mentorship |
| **Admin** | `admin@somaiya.edu` | `demo123` | Admin Command, Digital Twin, CRUD Controls, Overrides |

---

## Testing & Quality Assurance

Campus NEXUS includes automated testing suites covering unit logic, RBAC security, geospatial routing, and end-to-end API flows.

### Running End-to-End System Tests (31 Subsystem Tests)
```bash
python scripts/test_full_system.py
```

### Running Admin CRUD & User Lifecycle Tests
```bash
python backend/test_new_features.py
```

### Frontend TypeScript Verification
```bash
cd frontend && npx tsc --noEmit
```

### Frontend Production Build Test
```bash
cd frontend && npm run build
```

---

## Security & Privacy Architecture

- **Zero Hardcoded Secrets**: All API keys, database credentials, and signing secrets are strictly supplied through environment variables.
- **Production Secret Key Protection**: Backend validates the presence and entropy of `SECRET_KEY` on startup, preventing insecure defaults in production environments.
- **Role-Based Access Control (RBAC)**: Enforced directly on the backend via dependency injection (`get_current_active_user`, `require_role`). Student and Faculty tokens are cryptographically rejected from Admin endpoints.
- **Location Privacy & Opt-In Telemetry**: User location tracking is strictly opt-in with explicit database-backed consent records. Location tracking immediately halts when toggled off, and raw GPS coordinates are never exposed to other students (only anonymized, aggregated densities).
- **CORS & Host Whitelisting**: Strict origin controls (`BACKEND_CORS_ORIGINS`) and host verification (`ALLOWED_HOSTS`) prevent unauthorized cross-origin requests.
- **SQL Injection Prevention**: 100% of database queries use SQLAlchemy parameterized statements and async connection pooling.

---

## Deployment Guide

### Deploying the Backend (Docker / Render / Railway / VM)
1. Build the Docker image using `backend/Dockerfile`.
2. Provide the following environment variables on your hosting platform:
   - `DATABASE_URL`: Production PostgreSQL connection string
   - `REDIS_URL`: Production Redis URL (or omit for in-memory fallback)
   - `SECRET_KEY`: High-entropy 64-character secret
   - `ENVIRONMENT`: `production`
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend-domain.com"]`
   - `ALLOWED_HOSTS`: `["your-api-domain.com"]`
   - `NEXUS_API_KEY`: Your OpenRouter or OpenAI API key
   - `LLM_PROVIDER`: `openrouter`
   - `LLM_MODEL`: `minimax/minimax-m3:free`

### Deploying the Frontend (Vercel / Netlify / Node.js)
1. Link your GitHub repository to Vercel or your preferred frontend host with Root Directory set to `frontend`.
2. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-api-domain.com/api/v1`
   - `NEXT_PUBLIC_WS_URL`: `wss://your-api-domain.com`
   - `NEXTAUTH_URL`: `https://your-frontend-domain.com`
   - `NEXTAUTH_SECRET`: Random 32+ character string
   - `NEXT_PUBLIC_MAPTILER_API_KEY`: MapTiler API Key for vector maps

---

## Project Structure

```
campus-nexus/
│
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/                 # REST endpoints (auth, students, faculty, admin, pulse, ai, etc.)
│   │   ├── core/                   # Security, database connection, config, Redis client
│   │   ├── models/                 # SQLAlchemy async ORM models
│   │   ├── schemas/                # Pydantic request/response validation schemas
│   │   └── services/               # Digital Twin, AI Orchestrator, Leave-Now Engine
│   ├── tests/                      # Automated test cases
│   ├── Dockerfile                  # Production container definition
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # Next.js 14 App Router frontend
│   ├── app/                        # Pages & route groups (student, faculty, admin, auth)
│   ├── components/                 # UI components (Digital Twin 3D, Map, Pulse, Nav)
│   ├── lib/                        # API client, types, constants, utilities
│   ├── public/                     # Static assets, 360 panorama imagery, icons
│   ├── package.json                # NPM package definitions
│   └── tsconfig.json               # TypeScript compiler configuration
│
├── scripts/                        # Database seeding, inspection & verification suites
│   ├── inspect_db.py               # Database inspector utility
│   ├── seed_demo_data.py           # Institutional demo data seeder
│   └── test_full_system.py         # 31-point end-to-end regression test suite
│
├── docs/                           # Technical architectural specifications
├── .env.example                    # Global environment variable template
├── .gitignore                      # Comprehensive repository ignore rules
└── README.md                       # Master project documentation
```

---

## Contributors

Built with pride by:

- **Kshitij**
- **Harshit**
- **Piyush**

---

## Rights & Attribution

Campus NEXUS — Built by Kshitij, Harshit & Piyush.  
© 2026 Campus NEXUS. All rights reserved.
