# AI Agents Architecture

## Overview

Campus NEXUS uses a multi-agent architecture where a central Orchestrator routes user requests to specialized agents. Each agent has access to specific tools that operate on structured campus data.

## Architecture

```
User Query
    │
    ▼
┌─────────────────────┐
│  ORCHESTRATOR       │
│  AGENT              │
│  (Intent Router)    │
└──────────┬──────────┘
           │
    ┌──────┴──────┬──────────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼          ▼
┌───────┐   ┌─────────┐ ┌──────┐ ┌────────┐ ┌─────────┐
│ NAV   │   │ SCHED   │ │ PULSE│ │ RESOURCE│ │ ISSUE   │
│ AGENT │   │ AGENT   │ │ AGENT│ │ AGENT  │ │ AGENT   │
└───┬───┘   └────┬────┘ └──┬───┘ └───┬────┘ └────┬────┘
    │            │          │         │           │
    ▼            ▼          ▼         ▼           ▼
 ┌───────────────────────────────────────────────────────┐
 │                    TOOL LAYER                         │
 │  (Deterministic functions operating on structured data)│
 └───────────────────────────────────────────────────────┘
```

## Agent Specifications

### Orchestrator Agent
**Purpose**: Understand user intent, route to appropriate agents, combine results.
**Model**: LLM with structured output
**Tools**: Intent classification, agent routing, response formatting
**Input**: User query (natural language)
**Output**: Structured response or agent dispatch

### Navigation Agent
**Purpose**: Handle all route and navigation queries.
**Tools**:
- `get_current_location()` - Get user's current location
- `calculate_route(from, to, mode)` - Calculate walking route
- `calculate_accessible_route(from, to)` - Calculate accessible route
- `calculate_realistic_eta(from, to, departure_time)` - Calculate ETA with crowd/lift/floor adjustments
- `get_building_status(building_id)` - Get building operational status
- `get_lift_status(building_id)` - Get lift status
- `get_crowd_status(location_id)` - Get crowd level

### Schedule Agent
**Purpose**: Handle timetable and schedule queries.
**Tools**:
- `get_student_schedule(student_id, date)` - Get student schedule
- `get_faculty_schedule(faculty_id, date)` - Get faculty schedule
- `get_next_class(user_id)` - Get next upcoming class
- `get_class_details(class_id)` - Get class details
- `check_timetable_conflicts(schedule)` - Detect conflicts
- `get_room_availability(room_id, start, end)` - Check room availability
- `find_available_rooms(criteria)` - Find available rooms

### Pulse Agent
**Purpose**: Handle campus crowd and activity queries.
**Tools**:
- `get_campus_pulse()` - Get overall campus activity
- `get_crowd_status(location_id)` - Get crowd level
- `get_crowd_heatmap()` - Get heatmap data
- `get_buzz_summary(location_id)` - Get AI-summarized buzz
- `get_active_issues()` - Get active issues affecting crowd

### Resource Agent
**Purpose**: Handle room, lab, and resource queries.
**Tools**:
- `find_available_rooms(capacity, duration, equipment, distance)` - Find available rooms
- `find_available_labs(computers_needed, duration, software)` - Find available labs
- `get_room_status(room_id)` - Get current room status
- `get_lab_status(lab_id)` - Get current lab status
- `get_equipment_status(room_id)` - Get equipment status

### Faculty Agent
**Purpose**: Handle faculty lookup and availability.
**Tools**:
- `find_faculty(name, department)` - Find faculty member
- `get_faculty_availability(faculty_id)` - Get faculty availability
- `get_faculty_current_location(faculty_id)` - Where is faculty now
- `get_faculty_next_available(faculty_id)` - When is faculty next free

### Issue Agent
**Purpose**: Handle issue reporting and tracking.
**Tools**:
- `report_issue(location, category, description)` - Report new issue
- `get_active_issues(location_id)` - Get active issues
- `get_issue_details(issue_id)` - Get issue details
- `cluster_similar_issues()` - Cluster duplicate reports

### Lost & Found Agent
**Purpose**: Handle lost and found matching.
**Tools**:
- `report_lost_item(category, description, location, time)` - Report lost item
- `report_found_item(category, description, location, time)` - Report found item
- `find_lost_found_match(lost_item_id)` - Find matches using semantic similarity

### Event Agent
**Purpose**: Handle campus events.
**Tools**:
- `get_upcoming_events()` - Get upcoming events
- `get_event_details(event_id)` - Get event details
- `register_for_event(event_id)` - Register for event
- `predict_event_crowd(event_id)` - Predict crowd for event

### Optimization Agent
**Purpose**: Handle optimization queries.
**Tools**:
- `run_optimization(scenario)` - Run optimization
- `get_optimization_results(run_id)` - Get results
- `verify_recommendation(recommendation)` - Verify recommendation

## Tool Design Principles

1. **Deterministic**: Tools return structured data, not free text
2. **Idempotent**: Same inputs produce same outputs
3. **Fast**: Sub-second response times
4. **Validated**: Input validation, output validation
5. **Traceable**: Every tool call is logged

## LLM Integration

- LLMs receive structured tool results, not raw database access
- LLMs format responses in natural language based on tool results
- LLMs can chain tools (call multiple tools to answer one query)
- All LLM outputs are grounded in tool results
- If data is unavailable, LLM says "I don't have reliable campus data for that"

## Safety

- No tool modifies data without proper authorization checks
- All writes are validated and audited
- Sensitive data (exact student locations) is not exposed to other users
- Rate limiting on all endpoints
