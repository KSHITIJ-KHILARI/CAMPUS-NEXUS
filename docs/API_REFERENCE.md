# API Documentation

## Overview

Campus NEXUS provides a comprehensive REST API for all platform operations. The API follows RESTful conventions with JSON request/response formats.

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_access_token>
```

### Getting a Token
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "student@somaiya.edu",
    "password": "demo123"
}
```

### Response
```json
{
    "access_token": "eyJ...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "email": "student@somaiya.edu",
        "name": "Arjun Mehta",
        "role": "student"
    }
}
```

## Response Format

All successful responses follow this structure:
```json
{
    "data": { ... },
    "meta": {
        "page": 1,
        "limit": 20,
        "total": 100
    }
}
```

Error responses:
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": [...]
    }
}
```

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error

## Rate Limiting

- Authenticated: 100 requests per 15 minutes
- Anonymous: 20 requests per 15 minutes
- AI endpoints: 10 requests per minute

Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Pagination

List endpoints support pagination:
```
GET /api/v1/buildings?page=1&limit=20
```

Response includes pagination metadata.

## Filtering & Sorting

```
GET /api/v1/issues?status=open&priority=high&sort=-created_at
```

## WebSocket

Connect to receive real-time updates:
```
ws://localhost:8000/ws
```

Subscribe to channels after authentication:
```json
{
    "type": "subscribe",
    "channel": "campus_state"
}
```

Available channels:
- `campus_state` - Digital Twin state updates
- `notifications` - User notifications
- `crowd` - Crowd level changes
- `issues` - Issue updates
- `events` - Event updates

## OpenAPI

Interactive API documentation available at:
```
http://localhost:8000/docs
http://localhost:8000/redoc
```
