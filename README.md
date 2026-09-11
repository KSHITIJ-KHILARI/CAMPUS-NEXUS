<p align="center">
  <h1 align="center">Campus NEXUS</h1>
  <p align="center">
    <strong>Next-Gen AI-Powered Digital Twin & Intelligent Campus Operating Layer</strong>
    <br />
    <em>Engineered for Somaiya Vidyavihar University</em>
    <br />
    <em>Built By Kshitij, Harshit, Piyush</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-14.0.4-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.111+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Firebase-Firestore%20%2F%20Auth-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Three.js-R160-000000?logo=three.js" alt="Three.js" />
    <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Google%20Genkit-Gemini%201.5-4285F4?logo=google&logoColor=white" alt="Genkit" />
  </p>
</p>

---

## 📑 Table of Contents

1. [System Overview & Architecture](#-system-overview--architecture)
2. [End-to-End Technical Flows & Integration](#-end-to-end-technical-flows--integration)
   - [2.1 Overall System Architecture Flow](#21-overall-system-architecture-flow)
   - [2.2 Frontend-Backend API Integration & Resilient Fallback Flow](#22-frontend-backend-api-integration--resilient-fallback-flow)
   - [2.3 Authentication & Role-Based Access Control (RBAC) Flow](#23-authentication--role-based-access-control-rbac-flow)
   - [2.4 Real-Time Facility Telemetry & WebSocket Flow](#24-real-time-facility-telemetry--websocket-flow)
   - [2.5 Multi-Tier NEXUS AI Assistant & Tool Calling Flow](#25-multi-tier-nexus-ai-assistant--tool-calling-flow)
   - [2.6 3D Digital Twin & Spatial Navigation Engine](#26-3d-digital-twin--spatial-navigation-engine)
   - [2.7 Relational Database & Entity Relationship Flow](#27-relational-database--entity-relationship-flow)
3. [Comprehensive File & Directory Usage Guide](#-comprehensive-file--directory-usage-guide)
   - [Root Configuration & Metadata](#root-configuration--metadata)
   - [`frontend/` File Usage Map](#frontend-file-usage-map)
   - [`backend/` File Usage Map](#backend-file-usage-map)
   - [`scripts/`, `supabase/`, & `docs/`](#scripts-supabase--docs)
4. [User Role Journeys](#-user-role-journeys)
5. [Prerequisites & Environment Configuration](#-prerequisites--environment-configuration)
6. [Local Development Setup](#-local-development-setup)
7. [Testing & Quality Assurance](#-testing--quality-assurance)
8. [Demo Credentials](#-demo-credentials)
9. [Contributors & License](#-contributors--license)

---

## 🌐 System Overview & Architecture

**Campus NEXUS** is a unified digital twin, spatial intelligence platform, and multi-agent operations engine specifically engineered for Somaiya Vidyavihar University.

Traditional universities manage academic schedules, facility maintenance, room bookings, emergency dispatch, and student advising through siloed, disconnected platforms. Campus NEXUS solves this fragmentation by unifying real-time IoT facility telemetry, 3D geospatial campus geometry, academic scheduling, student/faculty state, and generative AI orchestration into a single high-performance operating layer.

### Key Capabilities
- **Proactive "Leave-Now" Routing**: Calculates live pedestrian walking ETA between campus blocks with automated elevator maintenance and congestion penalties.
- **3D Interactive Digital Twin**: Real-time Three.js spatial model of campus buildings (Aryabhat, Bhaskaracharya, Somaiya Library, K.J. Somaiya Engineering) with interactive floor picking, vacant room overlays, and emergency egress simulation.
- **Multi-Tier AI Copilot (NEXUS AI)**: Built with Google Genkit and Gemini 1.5 Flash, equipped with function calling tools (`getLiveTelemetry`, `getTimetable`, `findRoom`, `queryFaculty`) backed by a deterministic database verification engine.
- **Campus Pulse & Crowd Telemetry**: Live sensor streaming (occupancy, ambient noise, Wi-Fi density, temperature) via WebSockets with admin manual override capabilities.
- **Emergency SOS & Dispatch Command**: Instant student panic dispatch broadcasting GPS coordinates to security command centers.
- **Resilient Hybrid Architecture**: Designed to operate smoothly with live FastAPI + PostgreSQL/Firebase or seamlessly fall back to an internal relational memory dataset (`relationalCampusData.ts`) during offline network states.

---

## 🔄 End-to-End Technical Flows & Integration

### 2.1 Overall System Architecture Flow

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Presentation Layer (Next.js 14 App Router)"]
        UI["Web Browser (React 18 / Tailwind / Framer Motion / Lenis)"]
        ThreeCanvas["Three.js / React Three Fiber 3D Canvas"]
        MapLibre["MapLibre GL Interactive Campus Map"]
        GenkitClient["Client AI Chat Component"]
    end

    subgraph FrontendState ["Frontend State & API Abstraction"]
        AuthCtx["Auth Context (JWT / Firebase / Mock)"]
        SettingsCtx["Settings Context (Layout / Theme)"]
        LocCtx["Location Consent & Spatial Context"]
        ApiClient["Axios API Client (lib/api-client.ts)"]
        RelationalFallback["Relational Mock Fallback (lib/relationalCampusData.ts)"]
    end

    subgraph APIRoutes ["Next.js Server API Layer"]
        GenkitFlow["Genkit Flow (/api/ai/chat)"]
        GeminiFlash["Google Gemini 1.5 Flash"]
    end

    subgraph BackendLayer ["Backend Services Engine (FastAPI / Python 3.11+)"]
        MainApp["FastAPI App (app/main.py)"]
        APIRouter["REST Router (/api/v1)"]
        WSRouter["WebSocket Manager (/ws)"]
        subgraph Services ["Backend Domain Services"]
            TwinService["Digital Twin Service"]
            NavService["Navigation & Leave-Now Service"]
            CrowdService["Crowd & Telemetry Service"]
            TimetableService["Timetable & Schedule Service"]
            FacultyService["Faculty Roster & Availability"]
            LocationService["Geofencing & Positioning"]
            VerifyAgent["Deterministic Verification Agent"]
        end
    end

    subgraph DataLayer ["Data & Storage Layer"]
        PostgresDB[("PostgreSQL 16 / Supabase (Relational Ground Truth)")]
        FirestoreDB[("Firebase Firestore (Document & Audit Store)")]
        RedisCache[("Redis 7 Cache (Optional, In-Memory Fallback)")]
    end

    UI --> AuthCtx
    UI --> ApiClient
    UI --> ThreeCanvas
    UI --> MapLibre
    GenkitClient --> GenkitFlow
    GenkitFlow --> GeminiFlash
    GenkitFlow -.->|Tools Query| ApiClient

    ApiClient -->|HTTP REST Requests| APIRouter
    ApiClient -.->|Network Disconnect Fallback| RelationalFallback
    UI <==>|Realtime Telemetry & SOS| WSRouter

    APIRouter --> MainApp
    MainApp --> Services
    Services --> PostgresDB
    Services --> FirestoreDB
    Services --> RedisCache
```

---

### 2.2 Frontend-Backend API Integration & Resilient Fallback Flow

All client-side API requests flow through `frontend/lib/api-client.ts`. To ensure that student demos, field testing, and offline hackathon showcases never fail due to transient server interruptions, `api-client.ts` implements a dual-engine architecture:

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Faculty / Admin
    participant Component as React Feature Component
    participant Client as API Client (api-client.ts)
    participant Backend as FastAPI Backend (Port 9501)
    participant Database as PostgreSQL / Firestore
    participant Fallback as Relational Campus Dataset (relationalCampusData.ts)

    User->>Component: Clicks "Vacant Rooms" / "My Schedule"
    Component->>Client: api.getRooms() / api.getSchedule()
    
    alt Live Backend Available
        Client->>Backend: GET /api/v1/rooms/vacant (with Bearer JWT)
        Backend->>Database: Query current room state & schedule conflict
        Database-->>Backend: Return matching room records
        Backend-->>Client: 200 OK JSON payload
        Client-->>Component: Render real-time room data
    else Backend Offline / Network Error
        Client->>Backend: GET /api/v1/rooms/vacant (Connection Timeout / 500)
        Backend--xClient: Connection Refused / Timeout
        Note over Client,Fallback: Automatic Graceful Fallback Interceptor
        Client->>Fallback: Query relationalCampusData.rooms with active filters
        Fallback-->>Client: Return synchronized relational mock dataset
        Client-->>Component: Render consistent campus dataset with warning banner
    end
    Component->>User: Displays interactive room availability
```

---

### 2.3 Authentication & Role-Based Access Control (RBAC) Flow

Campus NEXUS strictly enforces Role-Based Access Control across three distinct user domains: **Student**, **Faculty**, and **Admin**.

```mermaid
flowchart TD
    Start([User navigates to Campus NEXUS]) --> CheckSession{Has active JWT / Firebase token?}
    
    CheckSession -- No --> LoginPage["/auth/login or /auth/select-role"]
    LoginPage --> SubmitCreds[User Enters Credentials / Selects Demo Role]
    SubmitCreds --> AuthAPI["POST /api/v1/auth/login"]
    
    AuthAPI --> ValidateRole{Valid Credentials & Role?}
    ValidateRole -- No --> ShowError[Display Auth Error Notification]
    ValidateRole -- Yes --> IssueToken[Generate Signed JWT with Scopes & Role]
    IssueToken --> StoreClient[Save Token in httpOnly Cookie / LocalStorage]
    
    CheckSession -- Yes --> ExtractRole[Extract User Role from Token Claims]
    StoreClient --> ExtractRole
    
    ExtractRole --> RouteGate{Target Route Role Check}
    
    RouteGate -- "Role == student" --> StudentScope["Allowed: /student/* (Dashboard, 3D Twin, Timetable, Rooms, Events, AI)"]
    RouteGate -- "Role == faculty" --> FacultyScope["Allowed: /faculty/* (Schedule, Classes, Notes, Availability, Mentorship)"]
    RouteGate -- "Role == admin" --> AdminScope["Allowed: /admin/* (Digital Twin Simulation, Control Center, Telemetry, CRUD)"]
    
    RouteGate -- Unauthorized Scope --> AccessDenied["403 Forbidden / Redirect to Role Root"]
```

---

### 2.4 Real-Time Facility Telemetry & WebSocket Flow

Facility sensors, crowd densities, library seat counts, and emergency panic alarms synchronize over WebSockets via `frontend/lib/websocket.ts` and `backend/app/core/websocket_manager.py`.

```mermaid
sequenceDiagram
    autonumber
    participant Sensor as Campus IoT Simulator / Pulse Service
    participant WSMgr as FastAPI WebSocketManager (backend)
    participant ClientA as Student Client (Dashboard)
    participant ClientB as Admin Command Center

    ClientA->>WSMgr: Connect ws://localhost:9501/ws/telemetry?token=JWT
    ClientB->>WSMgr: Connect ws://localhost:9501/ws/admin-pulse?token=JWT
    WSMgr-->>ClientA: Connection Established (Subscribed to campus:pulse)
    WSMgr-->>ClientB: Connection Established (Subscribed to admin:events)

    loop Every 5 Seconds (or on Sensor Interrupt)
        Sensor->>WSMgr: Broadcast { room: "L-301", occupancy: 42, noise: "65dB", status: "MODERATE" }
        WSMgr->>ClientA: JSON payload: { type: "PULSE_UPDATE", data: ... }
        WSMgr->>ClientB: JSON payload: { type: "TELEMETRY_STREAM", data: ... }
        ClientA->>ClientA: Re-render Campus Pulse Gauge & Room Status
        ClientB->>ClientB: Update Admin Heatmap & Density Alerts
    end

    alt Emergency SOS Triggered
        ClientA->>WSMgr: Send { type: "EMERGENCY_SOS", coords: [19.0728, 72.8998], building: "Engineering" }
        WSMgr->>ClientB: Broadcast urgent alert { priority: "CRITICAL", location: "Engineering Floor 2" }
        ClientB->>ClientB: Audio Siren + Open Security Dispatch Modal
    end
```

---

### 2.5 Multi-Tier NEXUS AI Assistant & Tool Calling Flow

The NEXUS AI Copilot supports natural-language queries across the campus. It is integrated using Google Genkit (`@genkit-ai/google-genai`) with Gemini 1.5 Flash and backend deterministic verification:

```mermaid
flowchart TD
    UserQuery["User Asks: 'Where is Dr. Sharma right now and is Room 302 vacant?'"] --> ClientChat["Client Chat UI (app/student/ai or modal)"]
    ClientChat --> NextAPIRoute["POST /api/ai/chat (Next.js App Router)"]
    NextAPIRoute --> GenkitFlow["Genkit Flow: nexusAiFlow"]
    
    GenkitFlow --> Gemini["Google Gemini 1.5 Flash Model"]
    Gemini --> Decision{Requires Campus Ground Truth?}
    
    Decision -- Yes --> ToolCall["Model Emits Function Calls:\n1. queryFaculty(name='Dr. Sharma')\n2. findRoom(roomNumber='302')"]
    
    ToolCall --> ExecTools["Execute Genkit Tools (genkit/tools/campus-tools.ts)"]
    ExecTools --> BackendVerification["Query Backend Ground Truth /api/v1/faculty & /api/v1/rooms"]
    BackendVerification --> GroundTruthData["Returns:\nDr. Sharma: In Consultation (Room 404)\nRoom 302: Vacant until 3:00 PM"]
    
    GroundTruthData --> FeedBack["Feed Tool Results back to Gemini Context"]
    FeedBack --> GenResponse["Gemini Synthesizes Verified Response"]
    Decision -- No --> GenResponse
    
    GenResponse --> NextAPIRoute
    NextAPIRoute --> ClientChat
    ClientChat --> RenderUI["Displays Answer with Clickable Room Badge & Map Shortcut"]
```

---

### 2.6 3D Digital Twin & Spatial Navigation Engine

The 3D Digital Twin synthesizes high-fidelity WebGL building geometry with real-time room states:

```mermaid
flowchart LR
    CampusGeo["Campus Spatial Geometry\n(Three.js Procedural Meshes / Models)"] --> TwinRenderer["Digital Twin Renderer\n(React Three Fiber)"]
    LiveRooms["Live Room Availability\n(Vacant / Occupied / Maintenance)"] --> TwinRenderer
    CrowdHeat["Crowd Heatmap & Pulse\n(Telemetry Sensors)"] --> TwinRenderer
    
    TwinRenderer --> InteractiveViewport["Interactive 3D Viewport\n(Orbit, Pan, Floor Explode)"]
    
    InteractiveViewport --> ClickRoom["User Clicks Room 204 in Aryabhat"]
    ClickRoom --> FloorPicker["Floor Level Focus (Floor 2 Highlighted)"]
    ClickRoom --> RoomModal["Classroom Detail Sheet:\n- Capacity: 60\n- Current Class: CS301 (Algorithms)\n- Walking ETA from User: 4 mins\n- 'Leave-Now' Navigation Button"]
```

---

### 2.7 Relational Database & Entity Relationship Flow

```mermaid
erDiagram
    USERS ||--o{ STUDENTS : "profile for"
    USERS ||--o{ FACULTY : "profile for"
    USERS ||--o{ INCIDENT_REPORTS : "submits"
    
    FACULTY ||--o{ COURSES : "instructs"
    COURSES ||--o{ ENROLLMENTS : "has"
    STUDENTS ||--o{ ENROLLMENTS : "enrolls in"
    
    BUILDINGS ||--o{ ROOMS : "contains"
    COURSES ||--o{ SCHEDULE_SESSIONS : "scheduled in"
    ROOMS ||--o{ SCHEDULE_SESSIONS : "hosts"
    
    ROOMS ||--o{ TELEMETRY_LOGS : "records"
    BUILDINGS ||--o{ TELEMETRY_LOGS : "monitors"
    
    USERS ||--o{ LIBRARY_RESERVATIONS : "reserves"
    LIBRARY_BOOKS ||--o{ LIBRARY_RESERVATIONS : "reserved in"
    
    USERS ||--o{ LOST_FOUND_ITEMS : "reports"
    EVENTS ||--o{ EVENT_REGISTRATIONS : "attended by"
    STUDENTS ||--o{ EVENT_REGISTRATIONS : "registers for"

    USERS {
        uuid id PK
        string email
        string hashed_password
        string role "student | faculty | admin"
        timestamp created_at
    }

    STUDENTS {
        uuid id PK
        uuid user_id FK
        string roll_number
        string department
        int semester
        float attendance_percentage
    }

    FACULTY {
        uuid id PK
        uuid user_id FK
        string department
        string designation
        string office_room
        string availability_status "AVAILABLE | BUSY | IN_CONSULTATION"
    }

    ROOMS {
        uuid id PK
        uuid building_id FK
        string room_number
        int floor
        int capacity
        string room_type "CLASSROOM | LAB | AUDITORIUM | SEMINAR"
        boolean is_accessible
    }

    SCHEDULE_SESSIONS {
        uuid id PK
        uuid course_id FK
        uuid room_id FK
        string day_of_week
        time start_time
        time end_time
    }
```

---

## 📁 Comprehensive File & Directory Usage Guide

### Root Configuration & Metadata

| File / Folder | Purpose & Usage |
|---|---|
| `README.md` | Master engineering specification, technical flows, directory map, and setup guide. |
| `Makefile` | Standardized automation scripts (`make dev`, `make test`, `make lint`, `make seed`). |
| `docker-compose.yml` | Multi-container orchestration for PostgreSQL 16, Redis 7, Backend, and Frontend. |
| `DECISIONS.md` | Architecture Decision Records (ADRs) explaining technology choices and trade-offs. |
| `CHANGELOG.md` | Chronological release and enhancement log for platform iterations. |
| `.env.example` | Template for root environment variables. |
| `firebase.json` / `.firebaserc` | Firebase hosting, rules, and project deployment configurations. |
| `firestore.rules` | Security and access control rules for Firestore document collections. |
| `storage.rules` | Security rules for Firebase Cloud Storage asset uploads. |
| `campus-3d/` | Standalone Three.js 3D campus twin assets, textures, and geometry builders. |

---

### `frontend/` File Usage Map

The frontend is built on **Next.js 14 (App Router)** with **TypeScript**, **Tailwind CSS**, **Framer Motion**, **GSAP**, and **Lenis**.

```
frontend/
├── app/                              # Next.js App Router Root
│   ├── layout.tsx                    # Root HTML layout: SmoothScrollProvider, ScrollProgress, Fonts
│   ├── template.tsx                  # Root route transition wrapper
│   ├── page.tsx                      # Landing page with hero, role selector, and platform feature highlights
│   ├── globals.css                   # Tailwind directives, Lenis CSS, and sleek custom crimson scrollbar
│   ├── loading.tsx                   # Top-level route suspense skeleton loader
│   ├── not-found.tsx                 # Custom 404 error page with campus navigation fallback
│   │
│   ├── api/                          # Next.js Server-Side API Handlers
│   │   └── ai/chat/route.ts          # Google Genkit AI endpoint orchestrating Gemini 1.5 Flash with campus tools
│   │
│   ├── auth/                         # Authentication Routing
│   │   ├── login/page.tsx            # Login form supporting email/password and demo role quick-select
│   │   ├── select-role/page.tsx      # Visual role switcher (Student, Faculty, Admin)
│   │   └── unauthorized/page.tsx     # 403 access denial screen
│   │
│   ├── student/                      # Student Intelligence Domain (15 Sub-Routes)
│   │   ├── layout.tsx                # Student frame: Persistent StudentNav, SOS Button, Consent Banner
│   │   ├── template.tsx              # Per-route PageTransition wrapper for seamless navigation opening
│   │   ├── dashboard/page.tsx        # Bento Grid dashboard: schedule, leave-now widget, quick actions
│   │   ├── campus-hub/page.tsx       # 3D Digital Twin viewport with floor picker and vacant room highlights
│   │   ├── my-day/page.tsx           # Daily timetable, itinerary schedule, and classroom walking directions
│   │   ├── classroom/page.tsx        # Academic notes, lecture materials, and enrolled course roster
│   │   ├── rooms/page.tsx            # Real-time vacant room finder with floor and building filters
│   │   ├── explore/page.tsx          # Library room and seat reservation portal
│   │   ├── events/page.tsx           # Campus workshops, hackathons, and cultural event registrations
│   │   ├── notifications/page.tsx    # Academic notices, emergency alerts, and timetable updates
│   │   ├── lost-found/page.tsx       # Community lost & found reporting with photo verification
│   │   ├── ai/page.tsx               # Dedicated full-screen NEXUS AI Copilot chat workspace
│   │   ├── map/page.tsx              # Interactive 2D campus navigation powered by MapLibre GL
│   │   ├── tour/page.tsx             # 360° panoramic virtual campus tour
│   │   ├── pulse/page.tsx            # Real-time crowd density, Wi-Fi occupancy, and facility noise levels
│   │   ├── faculty/page.tsx          # Faculty office hours, consultation booking, and directory
│   │   └── profile/page.tsx          # Student academic profile, attendance metrics, and ID badge
│   │
│   ├── faculty/                      # Faculty Workspace Domain (11 Sub-Routes)
│   │   ├── layout.tsx                # Faculty frame: Persistent FacultyNav, Notification Center
│   │   ├── template.tsx              # Per-route PageTransition wrapper for faculty navigation options
│   │   ├── dashboard/page.tsx        # Faculty overview: today's lectures, consultation hours, quick actions
│   │   ├── schedule/page.tsx         # Weekly teaching timetable with classroom assignments
│   │   ├── classes/page.tsx          # Enrolled student rosters, grading shortcuts, and course materials
│   │   ├── classroom/page.tsx        # Classroom management, presentation controls, and attendance logging
│   │   ├── rooms/page.tsx            # Departmental room booking and lab reservation request tool
│   │   ├── students/page.tsx         # Mentorship directory and student academic performance tracking
│   │   ├── availability/page.tsx     # One-click status broadcast (Available / In Consultation / Busy)
│   │   ├── events/page.tsx           # Academic conferences, faculty meetings, and guest lectures
│   │   ├── notifications/page.tsx    # Administrative circulars and student consultation alerts
│   │   ├── ai/page.tsx               # Faculty AI assistant for syllabus and schedule queries
│   │   ├── tour/page.tsx             # Campus 3D navigation and spatial locator
│   │   └── profile/page.tsx          # Faculty credentials, research publications, and office details
│   │
│   └── admin/                        # Admin Command & Control Domain (19 Sub-Routes)
│       ├── layout.tsx                # Admin frame: AdminNav, Emergency Control Bar
│       ├── template.tsx              # Per-route PageTransition wrapper for admin navigation options
│       ├── dashboard/page.tsx        # Command center: campus telemetry, energy usage, active alerts
│       ├── digital-twin/page.tsx     # Full 3D Digital Twin with real-time building telemetry overlays
│       ├── simulation/page.tsx       # What-if scenario simulator (fire drill, lab closure, crowd surge)
│       ├── control-center/page.tsx   # Facility overrides (air conditioning, lighting, elevator lockouts)
│       ├── analytics/page.tsx        # Historical attendance, room utilization, and footfall heatmaps
│       ├── users/page.tsx            # Global user account management and role provisioning
│       ├── students/page.tsx         # Student CRUD registry with batch CSV import
│       ├── faculty/page.tsx          # Faculty directory management and department allocations
│       ├── courses/page.tsx          # Course curriculum catalog and classroom allocation
│       ├── enrollments/page.tsx      # Course enrollment mappings and capacity validation
│       ├── rooms/page.tsx            # Campus room inventory, seating capacities, and equipment flags
│       ├── events/page.tsx           # Campus-wide event approvals and facility scheduling
│       ├── library/page.tsx          # Library seat inventory and book checkout monitoring
│       ├── lost-found/page.tsx       # Administrative review of lost and found claims
│       ├── emergency/page.tsx        # Emergency SOS dispatch console with real-time GPS markers
│       ├── issues/page.tsx           # Campus maintenance ticket tracker and resolution workflow
│       ├── system-health/page.tsx    # API latency, database connection pools, and WebSocket health
│       ├── tour/page.tsx             # 3D spatial inspector for campus infrastructure
│       └── settings/page.tsx         # Global platform configuration and feature flags
│
├── components/                       # Modular Reusable React Components
│   ├── campus/                       # Campus-specific dialogs, floor pickers, and room popups
│   │   ├── campus-map.tsx            # MapLibre GL wrapper for 2D building footprints
│   │   ├── classroom-modal.tsx       # Detailed classroom schedule and capacity popover
│   │   ├── digital-twin-canvas.tsx   # Three.js / React Three Fiber campus 3D scene
│   │   └── floor-selector.tsx        # Multi-story building vertical floor switcher
│   │
│   ├── emergency/                    # Safety & Incident Components
│   │   ├── emergency-sos-button.tsx  # Floating instant panic SOS trigger with countdown
│   │   └── incident-reporter.tsx     # Incident filing modal with photo and location attachment
│   │
│   ├── features/                     # Complex Full-Page Feature Modules
│   │   ├── bento-grid.tsx            # Responsive dashboard bento grid with KPI tiles and leave-now card
│   │   ├── leave-now-card.tsx        # Intelligent walking ETA and elevator delay countdown card
│   │   ├── campus-pulse.tsx          # Live crowd density and noise gauge visualizer
│   │   └── timetable-grid.tsx        # Interactive weekly calendar and schedule grid
│   │
│   ├── layout/                       # Navigation & Shell Components
│   │   ├── student-nav.tsx           # Student animated sidebar with spring active indicators
│   │   ├── faculty-nav.tsx           # Faculty animated sidebar with departmental badges
│   │   ├── admin-nav.tsx             # Admin command sidebar with emergency quick-actions
│   │   └── header.tsx                # Unified top bar with user profile dropdown and search
│   │
│   └── ui/                           # Base UI Primitives & Animation Utilities
│       ├── page-transition.tsx       # Route transition wrapper with pathname key and blur glide
│       ├── scroll-progress.tsx       # Top glowing radiant scrollbar & smooth floating scroll-to-top button
│       ├── smooth-scroll-provider.tsx# Global Lenis smooth inertia wheel scrolling provider
│       ├── notification-center.tsx   # Notification bell, badge count, and sliding alert panel
│       ├── location-consent-banner.tsx# GDPR-compliant opt-in location tracking consent dialog
│       └── footer.tsx                # Somaiya institutional footer with quick credits
│
├── genkit/                           # Google Genkit Generative AI Integration
│   ├── ai.ts                         # Genkit initialization with @genkit-ai/google-genai plugin
│   ├── flows/
│   │   └── nexus-ai-flow.ts          # Multi-turn campus intelligence chat flow with tool orchestration
│   ├── schemas/
│   │   └── chat-schemas.ts           # Zod schemas for chat inputs, tool arguments, and model output
│   └── tools/
│       └── campus-tools.ts           # AI executable tools: getLiveTelemetry, getTimetable, findRoom, queryFaculty
│
├── hooks/                            # Custom React Hooks
│   ├── use-reduced-motion.ts         # System accessibility hook detecting prefers-reduced-motion
│   ├── use-campus-telemetry.ts       # Reactive WebSocket telemetry subscriber hook
│   └── use-keyboard-shortcuts.ts     # Global hotkey listeners (Cmd+K search, SOS trigger)
│
└── lib/                              # Core Utility Libraries & State Stores
    ├── api-client.ts                 # Axios API abstraction with automatic fallback interceptors
    ├── auth.tsx                      # Client authentication context (JWT + Firebase + demo roles)
    ├── server-auth.ts                # Next.js server component role validation and route guards
    ├── relationalCampusData.ts       # Synchronized in-memory relational dataset for 100% offline resilience
    ├── settings-context.tsx          # Sidebar collapsed state, theme preferences, and audio alerts
    ├── location-context.tsx          # User spatial coordinates, geofencing, and privacy consent
    ├── websocket.ts                  # Resilient auto-reconnecting WebSocket client
    ├── map-config.ts                 # Somaiya campus coordinates, building bounds, and map style URLs
    ├── types.ts                      # Universal TypeScript interfaces for all campus entities
    └── utils.ts                      # Styling helpers (`cn`), time formatters, and math utilities
```

---

### `backend/` File Usage Map

The backend is built with **FastAPI (Python 3.11+)**, **Pydantic v2**, **SQLAlchemy async**, and **WebSockets**.

```
backend/
├── app/
│   ├── main.py                       # FastAPI application factory, CORS, trusted hosts, rate limiters
│   │
│   ├── api/v1/                       # REST Endpoints
│   │   ├── api.py                    # Root v1 router aggregating all modular domain endpoints
│   │   ├── auth.py                   # Authentication: login, token refresh, role verification
│   │   ├── ai.py                     # Backend AI gateway with deterministic database verification
│   │   └── digital_twin.py           # 3D building models, floor telemetry, and room status endpoints
│   │
│   ├── core/                         # Core Infrastructure & Cross-Cutting Concerns
│   │   ├── config.py                 # Pydantic Settings: environment variables, CORS, secrets
│   │   ├── firebase.py               # Firebase Admin SDK initialization and token validation
│   │   ├── websocket_manager.py      # Connection pooling, room channels, and broadcast dispatch
│   │   └── websocket_routes.py       # WebSocket endpoint definitions (/ws/telemetry, /ws/sos)
│   │
│   ├── schemas/                      # Pydantic v2 Data Validation Schemas
│   │   ├── auth.py                   # TokenResponse, LoginRequest, UserProfile schemas
│   │   ├── digital_twin.py           # BuildingModel, RoomStatus, TelemetryLog schemas
│   │   └── campus.py                 # Course, Schedule, Faculty, IncidentReport schemas
│   │
│   ├── services/                     # Business Logic Layer (12 Specialized Domain Modules)
│   │   ├── digital_twin_service.py   # Spatial asset indexing, floor geometry, and room coordinate math
│   │   ├── navigation_service.py     # Dijkstra / A* pedestrian pathfinding with elevator delay penalty
│   │   ├── crowd_service.py          # Real-time crowd density aggregation and Wi-Fi probe telemetry
│   │   ├── timetable_service.py      # Academic schedule conflict detection and room allocation
│   │   ├── faculty_service.py        # Faculty office hours, consultation queue, and availability toggle
│   │   ├── location_service.py       # Geofencing, campus perimeter verification, and distance calculations
│   │   ├── issue_service.py          # Campus maintenance ticket management and escalation
│   │   ├── notification_service.py   # Push and WebSocket notification dispatch
│   │   ├── optimization_service.py   # Energy optimization and HVAC schedule recommendations
│   │   ├── simulation_service.py     # What-If scenario modeling (evacuation times, crowd surges)
│   │   └── verification_agent.py     # Ground-truth validator ensuring AI responses match the database
│   │
│   ├── tools/                        # Helper utilities for data transformations
│   └── utils/                        # Hashing, JWT encoding, and date parsing utilities
│
├── tests/                            # Pytest Automated Test Suite
│   ├── test_auth.py                  # JWT authentication and role enforcement tests
│   ├── test_digital_twin.py          # 3D spatial coordinate and room query tests
│   └── test_services.py              # Domain service unit tests
│
├── Dockerfile                        # Production container specification using python:3.11-slim
└── requirements.txt                  # Python dependencies (FastAPI, Uvicorn, Pydantic, etc.)
```

---

### `scripts/`, `supabase/`, & `docs/`

| Path | Purpose & Role |
|---|---|
| `scripts/seed_demo_data.py` | Complete seed script populating users, faculty, students, rooms, and schedules. |
| `scripts/test_full_system.py` | Comprehensive 31-step automated end-to-end integration test. |
| `scripts/test_ai_queries.py` | 14-query automated benchmark testing AI accuracy and tool calls. |
| `scripts/inspect_db.py` | CLI diagnostic tool inspecting PostgreSQL / Firestore table counts. |
| `scripts/repair_and_sync_db.py` | Synchronizes and verifies database schema foreign key integrity. |
| `supabase/supabase_schema.sql` | Production PostgreSQL 16 DDL with tables, indexes, and constraints. |
| `supabase/supabase_rls.sql` | Row-Level Security (RLS) policies enforcing multi-tenant role access. |
| `docs/ARCHITECTURE.md` | In-depth engineering architectural specification. |
| `docs/API_REFERENCE.md` | Detailed REST and WebSocket API endpoint specifications. |
| `docs/DATABASE.md` | Complete database schema documentation and relationship diagrams. |
| `docs/AI_AGENTS.md` | NEXUS AI multi-agent orchestration and tool binding guide. |
| `docs/SECURITY.md` | Security model, privacy architecture, and cryptographic token validation. |

---

## 👥 User Role Journeys

### 🎓 Student Flow
1. **Login & Orientation**: Access `/student/dashboard` to view current lecture, walking ETA, and room vacancy summary.
2. **Dynamic Navigation**: Click **3D Digital Twin** (`/student/campus-hub`) or **Timetable** (`/student/my-day`) with smooth page transition animations.
3. **Smart Routing**: Use the **"Leave-Now"** card to navigate to your next lecture with real-time elevator delay alerts.
4. **Academics & Community**: Access course materials (`/student/classroom`), reserve library pods (`/student/explore`), browse campus events (`/student/events`), or report lost items (`/student/lost-found`).
5. **AI Assistance & Safety**: Query **NEXUS AI** (`/student/ai`) for instant schedule lookups or trigger the persistent **Emergency SOS** button if assistance is needed.

### 👩‍🏫 Faculty Flow
1. **Schedule & Status**: View daily teaching itinerary on `/faculty/dashboard` and broadcast live availability (`Available` / `In Consultation` / `Busy`) via `/faculty/availability`.
2. **Classroom Administration**: Review enrolled students and course syllabi in `/faculty/classes` and `/faculty/classroom`.
3. **Student Mentorship**: Access the mentorship directory (`/faculty/students`) to support student academic progress.
4. **Facility Access**: Check vacant departmental labs and seminar halls in `/faculty/rooms`.

### 🏛️ Admin Flow
1. **Campus Overview**: Monitor total campus footfall, HVAC energy metrics, and facility telemetry on `/admin/dashboard`.
2. **Digital Twin & Simulation**: Inspect live building models on `/admin/digital-twin` and execute what-if simulations (e.g. fire drills, wing closures) on `/admin/simulation`.
3. **Command Controls**: Perform emergency overrides (lighting, doors, elevators) in `/admin/control-center`.
4. **Institutional Management**: Perform full CRUD operations across users, faculty, students, courses, and maintenance issues.
5. **Emergency Console**: Monitor campus-wide SOS alerts with live GPS coordinate tracking on `/admin/emergency`.

---

## ⚙️ Prerequisites & Environment Configuration

### Prerequisites
- **Node.js**: v18.17.0+ (LTS recommended)
- **Python**: 3.11+
- **PostgreSQL**: 16+ (or Supabase project)
- **Firebase Project**: Firestore & Authentication enabled
- **Redis**: 7.0+ (Optional — system includes automatic in-memory fallback)

### Frontend Environment (`frontend/.env.local`)
```env
# Backend API & WebSocket Connections
NEXT_PUBLIC_API_URL=http://127.0.0.1:9501/api/v1
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:9501

# Mapping & Spatial Tiles
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key_here

# Google Genkit / Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_secure_random_32_character_string_here

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Backend Environment (`backend/.env`)
```env
# Core Application Settings
APP_NAME="Campus NEXUS"
ENVIRONMENT=development
SECRET_KEY=a_super_secure_random_64_character_hex_string_for_jwt_signing
ALLOWED_HOSTS=["127.0.0.1", "localhost"]
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Database Connection (PostgreSQL / Supabase)
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/campus_nexus

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379/0

# LLM Providers (OpenRouter / Gemini)
NEXUS_API_KEY=your_llm_api_key_here
LLM_PROVIDER=gemini
LLM_MODEL=gemini-1.5-flash
```

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/campus-nexus.git
cd campus-nexus
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit backend/.env with your database credentials and API keys
```

Seed initial database fixtures:
```bash
cd ..
python scripts/seed_demo_data.py
```

Start the FastAPI backend:
```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 9501 --reload
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit frontend/.env.local with your keys
```

Start the Next.js dev server:
```bash
npm run dev
```

### 4. Verified Service URLs
| Service | Endpoint | Description |
|---|---|---|
| **Frontend Web App** | `http://localhost:3000` | Next.js 14 App Router client interface |
| **Backend REST API** | `http://127.0.0.1:9501/api/v1` | FastAPI REST services gateway |
| **Interactive API Docs** | `http://127.0.0.1:9501/docs` | Swagger UI with interactive endpoint testing |
| **Backend Health Check** | `http://127.0.0.1:9501/health` | Service uptime and database probe |

---

## 🧪 Testing & Quality Assurance

Campus NEXUS includes a full automated testing suite across both layers:

```bash
# 1. Run Complete System End-to-End Integration Suite (31 Tests)
python scripts/test_full_system.py

# 2. Run AI Natural-Language Query Benchmark (14 Queries)
python scripts/test_ai_queries.py

# 3. Run Backend Pytest Suite
cd backend && pytest tests/ -v

# 4. Run Frontend TypeScript Static Validation
cd frontend && npm run typecheck

# 5. Build Production Frontend Bundle
cd frontend && npm run build
```

---

## 🔑 Demo Credentials

Pre-configured accounts for interactive evaluation and role demonstrations:

| Role | Email | Password | Granted Scopes & Capabilities |
|---|---|---|---|
| **Student** | `student@somaiya.edu` | `student123` | Dashboard, 3D Twin, Timetable, Vacant Rooms, Events, SOS, AI |
| **Faculty** | `faculty@somaiya.edu` | `faculty123` | Daily Schedule, Classes, Classroom Notes, Availability Toggle |
| **Admin** | `admin@somaiya.edu` | `admin123` | Command Center, Digital Twin Simulation, User CRUD, Analytics |

> *Note: On the login screen (`/auth/login` or `/auth/select-role`), you can also click any of the "One-Click Quick Login" badges to instantly sign in without typing credentials.*

---

## 👨‍💻 Contributors & License

Built with pride by:
- **Kshitij**
- **Harshit**
- **Piyush**

*Developed for Somaiya Vidyavihar University.*  
*© 2026 Campus NEXUS. All rights reserved.*
