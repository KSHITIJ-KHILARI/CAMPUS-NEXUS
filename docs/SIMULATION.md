# Simulation Engine

## Overview

The Simulation Engine allows administrators to model "what-if" scenarios without affecting real campus state.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  SIMULATION PIPELINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CURRENT CAMPUS STATE                                    │
│     ↓                                                        │
│  2. SCENARIO DEFINITION                                     │
│     (e.g., "Lab 3 unavailable tomorrow")                    │
│     ↓                                                        │
│  3. STATE TRANSFORMATION                                    │
│     Apply scenario changes to cloned state                  │
│     ↓                                                        │
│  4. IMPACT ANALYSIS                                         │
│     Identify affected:                                      │
│     - Classes                                               │
│     - Students                                              │
│     - Faculty                                               │
│     - Resources                                             │
│     ↓                                                        │
│  5. CONSTRAINT CHECK                                        │
│     Verify:                                                 │
│     - Room capacity                                         │
│     - Equipment requirements                                │
│     - Faculty availability                                  │
│     - Time constraints                                      │
│     ↓                                                        │
│  6. OPTIMIZATION                                            │
│     Find best alternative allocations                       │
│     ↓                                                        │
│  7. VERIFICATION                                            │
│     Validate all recommendations                            │
│     ↓                                                        │
│  8. IMPACT REPORT                                           │
│     Generate structured report                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Scenarios

### Built-in Scenarios
- `LAB_UNAVAILABLE` - Specific lab becomes unavailable
- `LIFT_FAILURE` - One or more lifts fail
- `CLASSROOM_CLOSURE` - Room closed for maintenance
- `CANTEEN_RUSH` - Simulated crowd spike at canteen
- `CAMPUS_EVENT` - Large event causing crowd
- `TIMETABLE_CHANGE` - Faculty/room change
- `FACULTY_UNAVAILABLE` - Faculty becomes unavailable
- `RESOURCE_SHORTAGE` - Equipment/resource shortage

### Scenario Structure
```python
{
    "scenario_type": "LAB_UNAVAILABLE",
    "parameters": {
        "lab_id": "lab_301",
        "duration": "24 hours",
        "start_time": "2024-01-15T08:00:00"
    },
    "affected_entities": ["classes", "students", "faculty"],
    "intensity": "full"  # partial or full impact
}
```

## Impact Analysis

For each scenario, the engine calculates:

1. **Affected Classes**: Number of classes impacted
2. **Affected Students**: Number of students with schedule conflicts
3. **Affected Faculty**: Faculty whose classes need rescheduling
4. **Resource Gaps**: Missing capacity/equipment
5. **Estimated Disruption**: quantified impact score

## Output

```json
{
    "scenario_id": "uuid",
    "scenario_type": "LAB_UNAVAILABLE",
    "timestamp": "2024-01-15T10:00:00",
    "impact": {
        "affected_classes": 5,
        "affected_students": 127,
        "affected_faculty": 3,
        "resource_gaps": ["lab_computers", "projector"],
        "disruption_score": 0.72
    },
    "recommendations": [
        {
            "type": "room_change",
            "target": "lab_302",
            "capacity": 45,
            "equipment": ["computers", "projector"],
            "estimated_disruption": "low"
        }
    ],
    "verified": true
}
```

## Demo Mode Integration

Admin can trigger simulations via:
- Admin dashboard buttons
- NEXUS Command Center natural language queries
- Demo mode pre-configured scenarios

All simulations run on cloned state - no real data is modified.
