# Database Schema

## Overview

Campus NEXUS uses PostgreSQL 16 with PostGIS for spatial operations. The schema follows a normalized relational model.

## Core Tables

### Users & Authentication
- `users` - Base user table
- `students` - Student profiles
- `faculty` - Faculty profiles
- `admins` - Admin profiles
- `departments` - Academic departments
- `programs` - Academic programs
- `notification_preferences` - User notification settings

### Academic
- `courses` - Course catalog
- `course_sections` - Specific course offerings
- `enrollments` - Student enrollments
- `timetables` - Timetable definitions
- `class_sessions` - Individual class sessions
- `room_bookings` - Room reservations
- `faculty_availability` - Faculty availability slots
- `student_schedules` - Computed student schedules

### Campus Infrastructure
- `buildings` - Building master data
- `floors` - Floor data per building
- `rooms` - Generic room data
- `classrooms` - Classroom-specific data
- `laboratories` - Lab-specific data
- `campus_locations` - Points of interest
- `facilities` - Campus facilities
- `lifts` - Lift data
- `lift_statuses` - Lift operational status
- `equipment` - Equipment inventory
- `resources` - General resources

### Campus Intelligence
- `crowd_reports` - User-submitted crowd reports
- `crowd_states` - Computed crowd states
- `buzz_posts` - Micro-community posts
- `issues` - Campus issues
- `issue_reports` - Individual issue reports
- `issue_clusters` - Clustered/deduplicated issues
- `lost_items` - Lost item reports
- `found_items` - Found item reports
- `lost_found_matches` - AI-matched lost/found pairs

### Events & Notifications
- `events` - Campus events
- `event_registrations` - Event sign-ups
- `notifications` - System notifications
- `campus_events` - Digital twin event log

### Simulation & Optimization
- `simulations` - Simulation runs
- `simulation_scenarios` - Scenario definitions
- `simulation_results` - Simulation outputs
- `optimization_runs` - Optimization runs
- `optimization_results` - Optimization outputs

### System
- `campus_state` - Current digital twin state
- `routes` - Computed routes
- `audit_logs` - Admin action audit trail
- `agent_executions` - Agent run logs
- `tool_executions` - Tool call logs

## Key Relationships

```
users
├── students ──┬── enrollments ── course_sections ── courses
│             ├── student_schedules ── class_sessions ── timetables
│             └── crowd_reports
├── faculty ───┬── course_sections
│             ├── faculty_availability
│             └── class_sessions
└── admins

buildings ──┬── floors ── rooms ──┬── classrooms
            │                    └── laboratories
            ├── lifts ── lift_statuses
            └── campus_locations

issues ──┬── issue_reports
         └── issue_clusters

lost_items ── lost_found_matches ── found_items

events ── event_registrations

notifications ── users

campus_state ── (current snapshot of all entities)
```

## PostGIS Usage

- `campus_locations.geometry` - Point geometry for POIs
- `buildings.geometry` - Polygon geometry for buildings
- `routes.geometry` - LineString for calculated routes
- Spatial queries for: proximity search, route calculation, area queries

## Indexes

- All foreign keys indexed
- `class_sessions(start_time, end_time)` for timetable queries
- `crowd_reports(location_id, timestamp)` for crowd queries
- `issues(status, priority, created_at)` for issue queries
- PostGIS spatial indexes on geometry columns

## Migrations

Managed by Alembic. Seed data loaded via scripts/seeder.py.
