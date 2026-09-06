# API Reference

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Auth
- `POST /auth/login` - Login with username/password
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout

### Students
- `GET /students/me/schedule` - Get student timetable
- `GET /students/me/next-class` - Get next upcoming class
- `GET /students/rooms/find` - Find available rooms
- `GET /students/labs/find` - Find available labs
- `GET /students/faculty/find` - Find faculty
- `POST /students/crowd/report` - Submit crowd report
- `GET /students/notifications` - Get student notifications
- `POST /students/issues/report` - Report campus issue
- `POST /students/lost-found` - Report lost item
- `GET /students/lost-found/matches` - Get lost/found matches
- `GET /students/events` - Get campus events
- `POST /students/events/{id}/register` - Register for event

### Faculty
- `GET /faculty/me/schedule` - Get faculty timetable
- `GET /faculty/me/availability` - Get faculty availability
- `PUT /faculty/me/availability` - Update availability
- `GET /faculty/classes/{id}/students` - Get class students
- `GET /faculty/rooms/status` - Get room status for classes
- `POST /faculty/classroom/change` - Request classroom change
- `GET /faculty/notifications` - Get faculty notifications
- `POST /faculty/issues/report` - Report issue

### Admin
- `GET /admin/dashboard` - Admin dashboard data
- `GET /admin/campus-state` - Get current digital twin state
- `POST /admin/campus-state/update` - Update campus state
- `GET /admin/buildings` - List buildings
- `POST /admin/buildings` - Create building
- `PUT /admin/buildings/{id}` - Update building
- `GET /admin/rooms` - List rooms
- `POST /admin/rooms` - Create room
- `PUT /admin/rooms/{id}` - Update room
- `GET /admin/timetables` - List timetables
- `POST /admin/timetables` - Create timetable
- `GET /admin/issues` - List all issues
- `POST /admin/issues/{id}/resolve` - Resolve issue
- `GET /admin/events` - List events
- `POST /admin/events` - Create event
- `POST /admin/simulation/run` - Run simulation
- `POST /admin/optimization/run` - Run optimization
- `GET /admin/analytics/utilization` - Classroom utilization
- `GET /admin/analytics/crowd` - Crowd trends
- `GET /admin/analytics/issues` - Issue trends
- `POST /admin/demo/trigger` - Trigger demo scenario

### Buildings & Facilities
- `GET /buildings` - List all buildings
- `GET /buildings/{id}` - Get building details
- `GET /buildings/{id}/floors` - Get building floors
- `GET /rooms` - List all rooms
- `GET /rooms/{id}` - Get room details
- `GET /rooms/{id}/availability` - Get room availability
- `GET /labs` - List all labs
- `GET /labs/{id}` - Get lab details
- `GET /labs/{id}/computers` - Get available computers
- `GET /lifts` - List all lifts
- `GET /lifts/{id}` - Get lift status
- `GET /facilities` - List all facilities

### Timetable
- `GET /timetable` - Get current timetable
- `GET /timetable/conflicts` - Get timetable conflicts
- `POST /timetable/classroom-change` - Request classroom change

### Navigation
- `GET /navigation/route` - Calculate walking route
- `GET /navigation/accessible-route` - Calculate accessible route
- `GET /navigation/eta` - Calculate realistic ETA

### Pulse
- `GET /pulse` - Get campus pulse data
- `GET /pulse/crowd` - Get crowd status by location
- `GET /pulse/heatmap` - Get heatmap data

### Issues
- `GET /issues` - List issues
- `POST /issues` - Report issue
- `GET /issues/{id}` - Get issue details
- `POST /issues/{id}/upvote` - Upvote/confirm issue

### Events
- `GET /events` - List events
- `GET /events/{id}` - Get event details
- `POST /events/{id}/register` - Register for event

### Notifications
- `GET /notifications` - Get notifications
- `POST /notifications/{id}/read` - Mark as read
- `POST /notifications/preferences` - Update preferences

### AI
- `POST /ai/chat` - Send message to NEXUS AI
- `POST /ai/tools/{tool_name}` - Call specific AI tool

### Simulation
- `POST /simulation/run` - Run simulation scenario
- `GET /simulation/results/{id}` - Get simulation results
- `GET /simulation/scenarios` - List available scenarios

### Optimization
- `POST /optimization/run` - Run optimization
- `GET /optimization/results/{id}` - Get optimization results

### Lost & Found
- `POST /lost-found` - Create lost/found report
- `GET /lost-found` - List reports
- `GET /lost-found/matches` - Get AI-matched pairs

### WebSocket
- `WS /ws` - WebSocket connection for real-time updates
  - Subscribe to channels: `campus_state`, `notifications`, `crowd`, `issues`
