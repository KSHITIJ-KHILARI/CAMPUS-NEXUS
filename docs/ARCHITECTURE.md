# System Architecture

## Overview

Campus NEXUS is a unified web platform with a layered architecture centered around a Digital Twin of Somaiya Vidyavihar University.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CAMPUS NEXUS                            │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND LAYER                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │  Student    │ │  Faculty    │ │        Admin            │   │
│  │  Dashboard  │ │  Dashboard  │ │    Command Center       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
│         │               │                    │                  │
│         └───────────────┼────────────────────┘                  │
│                         ▼                                       │
│              ┌─────────────────────┐                            │
│              │   3D DIGITAL TWIN   │                            │
│              │   (Three.js)        │                            │
│              └─────────────────────┘                            │
│                         │                                       │
│                         ▼                                       │
│              ┌─────────────────────┐                            │
│              │   CAMPUS MAP        │                            │
│              │   (MapLibre)        │                            │
│              └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                            │
│                    (FastAPI Backend)                            │
├─────────────────────────────────────────────────────────────────┤
│  /api/auth       Authentication & RBAC                          │
│  /api/students   Student operations                             │
│  /api/faculty    Faculty operations                             │
│  /api/admin      Admin operations                               │
│  /api/buildings  Building/room/lab data                         │
│  /api/timetable  Schedule & conflicts                           │
│  /api/navigation Routes & ETA                                  │
│  /api/pulse      Campus crowd intelligence                      │
│  /api/issues     Issue reporting & clustering                   │
│  /api/events     Campus events                                  │
│  /api/simulation Simulation engine                              │
│  /api/optimization Optimization engine                          │
│  /api/ai         NEXUS AI orchestrator                          │
│  /api/notifications Notification engine                         │
│  /api/lost-found Lost & found                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Digital Twin Service    - Campus state management               │
│  Timetable Engine        - Schedule parsing & conflicts          │
│  Navigation Service      - Route calculation                     │
│  Crowd Intelligence      - Reports, confidence, decay            │
│  Issue Service           - Reporting, deduplication, clustering  │
│  Event Service           - Event management                      │
│  Notification Service    - Targeting, delivery                   │
│  Simulation Engine       - Scenario modeling                     │
│  Optimization Engine     - Resource allocation                   │
│  Verification Agent      - Constraint checking                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI / AGENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Orchestrator Agent      - Intent understanding & routing        │
│  Navigation Agent        - Route & ETA tools                     │
│  Schedule Agent          - Timetable tools                       │
│  Pulse Agent             - Crowd & campus state tools            │
│  Resource Agent          - Room/lab/facility tools               │
│  Faculty Agent           - Faculty lookup tools                  │
│  Issue Agent             - Issue tools                           │
│  LostFound Agent         - Lost & found tools                    │
│  Event Agent             - Event tools                           │
│  Optimization Agent      - Optimization tools                    │
│  Verification Agent      - Constraint verification               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL + PostGIS    - Primary data store                    │
│  Redis                   - Cache, sessions, real-time pub/sub   │
│  WebSockets              - Real-time updates                      │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

1. **Digital Twin as Source of Truth**: All campus state flows through the Digital Twin.
2. **Deterministic First**: Calculations, schedules, constraints, routes, and optimization use deterministic systems.
3. **LLM for Reasoning Only**: LLMs handle NLU, orchestration, explanation, and summarization over structured data.
4. **Event-Driven**: Campus changes propagate through an event bus to affected systems.
5. **Privacy by Design**: Location data is contextual, not tracking; analytics use aggregation.

## Communication Patterns

- Frontend → Backend: REST API + WebSocket
- Backend → AI Layer: Structured tool calls (not raw LLM calls)
- AI Layer → Backend: Tool results with structured data
- Backend → Database: SQLAlchemy ORM
- Real-time: Redis pub/sub → WebSocket broadcast
