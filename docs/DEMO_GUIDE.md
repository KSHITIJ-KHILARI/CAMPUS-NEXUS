# Demo Guide

## Demo Accounts

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Student | student@somaiya.edu | demo123 | Student dashboard, AI chat, map, pulse |
| Faculty | faculty@somaiya.edu | demo123 | Faculty dashboard, schedule, classes |
| Admin | admin@somaiya.edu | demo123 | Admin command center, simulation, digital twin |

## Demo Story Flow

### Scene 1: Student Experience (~2 min)

1. **Login** as student@somaiya.edu / demo123
2. **Dashboard** shows:
   - Greeting: "Good afternoon, Arjun"
   - Next class: Java Practical, Aurobindo Lab 304, 2:00 PM
   - "Starts in 32 minutes"
   - "Estimated travel: 14 minutes"
   - Status: "⚠ Aurobindo Lift 2 unavailable"
3. **Campus Pulse** shows:
   - Canteen: 🔴 Heavy Rush
   - Library: 🟢 Low Occupancy
   - Maggi Point: 🟡 Moderate
4. **Ask NEXUS AI**: "Can I make it to my class?"
   - AI checks: schedule, location, route, crowd, lift, ETA
   - Response: "Leave now. You have 11 minutes, travel takes 14."
5. **Map View**: Shows campus with crowd indicators, class location
6. **My Day**: Full timetable with travel estimates

### Scene 2: Faculty Experience (~1.5 min)

1. **Login** as faculty@somaiya.edu / demo123
2. **Dashboard** shows:
   - Today's schedule
   - Current status: "Available until 12 PM"
   - Next class: SY BCA Java Practical, 32 expected students
   - Room status: Projector ✓, AC ✓, Internet ✓
3. **Actions**: Change availability, view students, report issue

### Scene 3: Admin Command Center (~3 min)

1. **Login** as admin@somaiya.edu / demo123
2. **Dashboard** shows:
   - Buildings: 12 operational
   - Labs: 34/42 occupied
   - Active issues: 8
   - Crowded areas: 3
   - Lift issues: 2
3. **Digital Twin**: 3D campus visualization with live state
   - Click building for details
   - Visual indicators for issues, crowd, lift status
4. **Demo Mode**: Trigger scenarios
   - "SIMULATE LAB 3 UNAVAILABLE"
   - System immediately:
     - Updates Digital Twin
     - Identifies affected classes
     - Identifies affected students
     - Creates alerts
5. **Run Simulation**:
   - "SIMULATE ALTERNATIVES"
   - Optimization evaluates alternatives
   - Recommends: Lab 2
   - Verification checks: capacity ✓, available ✓, equipment ✓
   - Recommendation: VERIFIED
6. **Notifications**: Students and faculty receive alerts

### Scene 4: AI Orchestration (~1 min)

1. Admin asks NEXUS Command Center:
   - "Show me the most critical campus problems"
2. NEXUS analyzes:
   - Aurobindo Lift 2 (affects 3 classes, 87 students)
   - Lab 3 equipment failure
   - Canteen congestion
3. Provides prioritized recommendations

## Demo Triggers

### Pre-configured Scenarios
- **SIMULATE CANTEEN RUSH**: Canteen crowd spikes to HIGH
- **SIMULATE LIFT FAILURE**: Aurobindo Lift 2 becomes UNAVAILABLE
- **SIMULATE LAB FAILURE**: Lab 304 becomes UNAVAILABLE
- **SIMULATE CLASSROOM CHANGE**: DBMS moves to Bhaskar 506
- **SIMULATE TIMETABLE CONFLICT**: Creates student/faculty conflicts
- **SIMULATE CAMPUS EVENT**: Creates Gargi Plaza event with crowd prediction
- **SIMULATE ISSUE REPORTS**: Generates multiple issue reports for clustering

### Triggering
- Admin Dashboard "Demo Controls" panel
- NEXUS Command Center natural language: "Simulate lift failure"
- API endpoint: `POST /api/v1/admin/demo/trigger`

## Key Talking Points

1. **Digital Twin**: "This is a live digital representation of the entire campus"
2. **Connectivity**: "Student, faculty, and admin views are all connected through the Digital Twin"
3. **AI with Grounding**: "The AI doesn't hallucinate - it reasons over structured campus data through tools"
4. **Deterministic Core**: "Calculations, schedules, and optimization use algorithms, not LLMs"
5. **Event-Driven**: "Campus changes propagate automatically to all affected users"
6. **Simulation**: "Admins can model disruptions without affecting real operations"

## Technical Highlights

- Real-time WebSocket updates
- PostGIS spatial queries
- OR-Tools optimization
- Multi-agent AI architecture
- 3D Digital Twin with Three.js
- Semantic issue deduplication
- Crowd confidence scoring
- Privacy-safe location handling

## Presentation Tips

- Start with the student experience (relatable)
- Show the connected nature (one event → multiple updates)
- Highlight the AI grounding (show tool results)
- Emphasize the 3D Digital Twin (visual impact)
- End with admin simulation (powerful closing)
