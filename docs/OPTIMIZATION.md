# Optimization Engine

## Overview

The Optimization Engine finds optimal solutions for campus resource allocation problems using deterministic algorithms.

## Objectives

1. **Minimize Student Movement**: Reduce unnecessary campus traversal
2. **Minimize Schedule Disruption**: Limit class changes and conflicts
3. **Minimize Faculty Disruption**: Respect faculty preferences and availability
4. **Maximize Resource Utilization**: Efficient use of rooms, labs, equipment
5. **Respect Constraints**: Capacity, equipment, accessibility, time

## Algorithms

### Room Allocation
- **Problem**: Assign N classes to M rooms given constraints
- **Algorithm**: Constraint Satisfaction + Greedy optimization
- **Constraints**:
  - Room capacity >= Class size
  - Room type matches class type (lecture/lab)
  - Equipment requirements met
  - No time conflicts
  - Accessibility requirements

### Timetable Optimization
- **Problem**: Reschedule classes after disruption
- **Algorithm**: Backtracking with constraint propagation
- **Constraints**:
  - Faculty availability
  - Room availability
  - Student basket constraints
  - No student overlaps
  - Minimum gap between classes

### Route Optimization
- **Problem**: Find optimal routes between campus locations
- **Algorithm**: A* with campus graph
- **Factors**:
  - Distance
  - Crowd levels
  - Lift status
  - Building layout
  - Accessibility requirements

## Implementation

Uses Google OR-Tools for constraint programming and optimization.

### Example: Room Reallocation
```python
from ortools.sat.python import cp_model

model = cp_model.CpModel()

# Variables: class_i assigned to room_j at time_t
assign = {}
for class_id in affected_classes:
    for room_id in available_rooms:
        for slot in time_slots:
            assign[(class_id, room_id, slot)] = model.NewBoolVar(...)

# Constraints
for class_id in affected_classes:
    model.Add(sum(assign[(class_id, r, t)] for r in rooms for t in slots) == 1)

# Objective: minimize disruption
model.Minimize(disruption_penalty(...))
```

## Verification

Every optimization result is verified before presentation:

1. **Capacity Check**: Room can hold all students
2. **Availability Check**: Room is free at assigned time
3. **Faculty Check**: Faculty is available
4. **Equipment Check**: Required equipment present
5. **No Conflicts**: No timetable collisions
6. **Accessibility**: Meets accessibility requirements

Only verified recommendations are shown to users.

## Integration

- Called by Simulation Engine
- Results presented in Admin Dashboard
- Used by Verification Agent
- Triggers notifications for affected users
