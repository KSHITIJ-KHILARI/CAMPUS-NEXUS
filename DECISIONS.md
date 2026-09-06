# Architecture Decisions

## ADR-001: Monorepo Structure
**Decision**: Use a monorepo with `backend/` and `frontend/` directories.  
**Rationale**: Single repository simplifies development, CI/CD, and deployment. Shared types can be managed via a `shared/` directory.

## ADR-002: FastAPI Backend
**Decision**: Use FastAPI for the backend API.  
**Rationale**: High performance, async support, automatic OpenAPI docs, native Python type hints, excellent for AI/ML integration.

## ADR-003: Next.js Frontend
**Decision**: Use Next.js 14 with App Router.  
**Rationale**: React Server Components, excellent performance, built-in routing, API routes for serverless functions, large ecosystem.

## ADR-004: PostgreSQL with PostGIS
**Decision**: Use PostgreSQL 16 with PostGIS extension.  
**Rationale**: Required for spatial queries on campus locations, routes, and geographic data. PostGIS is the standard for geospatial in PostgreSQL.

## ADR-005: Three.js for 3D Digital Twin
**Decision**: Use Three.js with React Three Fiber.  
**Rationale**: Industry standard for WebGL, excellent React integration, strong community, supports complex 3D campus visualizations.

## ADR-006: MapLibre GL JS
**Decision**: Use MapLibre GL JS for 2D campus map.  
**Rationale**: Open-source, performant vector maps, excellent customization, works well with OpenStreetMap data.

## ADR-007: Redis for Cache & Real-time
**Decision**: Use Redis for caching, session storage, and WebSocket pub/sub.  
**Rationale**: High performance, native pub/sub for real-time updates, simple deployment.

## ADR-008: WebSockets for Real-time
**Decision**: Use WebSockets for real-time campus updates.  
**Rationale**: Bi-directional, low latency, ideal for live crowd updates, notifications, and Digital Twin state changes.

## ADR-009: LLM Provider Abstraction
**Decision**: Abstract LLM provider behind an interface.  
**Rationale**: Avoid vendor lock-in, support multiple providers (OpenAI, Anthropic, local models), easy to swap based on cost/performance.

## ADR-010: Deterministic Systems for Core Logic
**Decision**: Use deterministic algorithms for schedules, routes, optimization, and calculations. LLMs only for NLU, orchestration, and explanation.  
**Rationale**: Campus operations require reliability. Deterministic systems are auditable, testable, and predictable.

## ADR-011: RBAC with JWT
**Decision**: Use JWT tokens with Role-Based Access Control.  
**Rationale**: Stateless, scalable, standard for modern web apps. Three roles: Student, Faculty, Admin.

## ADR-012: Docker Compose for Development
**Decision**: Use Docker Compose for local development environment.  
**Rationale**: Consistent environment across team, easy database/cache setup, simplified onboarding.

## ADR-013: Demo Mode with Seed Data
**Decision**: Build a comprehensive demo mode with realistic seed data and simulation triggers.  
**Rationale**: Essential for hackathon/expo demonstration, allows judges to see the full system without real university APIs.
