# Changelog — Campus NEXUS

## [1.0.0] - 2026-09-03
### Added
- Comprehensive system architecture and persistent project control files (`PROJECT_STATUS.md`, `TODO.md`, `ARCHITECTURE.md`).
- Database schema repair script aligning all 52 models with PostgreSQL tables.
- Somaiya Vidyavihar University realistic campus dataset (buildings, classrooms, schedules, library, pulse, events, issues).
- Real database-backed endpoints for Student My-Day, Faculty Schedule, Smart Navigation & Leave Now.
- 3D Walking Digital Twin simulation and What-If scenario engine.

### Fixed
- Fixed route collision in `rooms.py` where `/rooms/vacant` matched `/{room_id}` with 422 error.
- Fixed `greenlet_spawn` async lazy loading error in `events.py`.
- Fixed missing columns in `issues` and `found_items` tables.
- Created missing library and learning resource tables in PostgreSQL.
