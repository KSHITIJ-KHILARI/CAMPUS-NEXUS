# Security Documentation

## Authentication

- JWT-based authentication with short-lived access tokens (15 min)
- Refresh tokens for session management
- Password hashing with bcrypt (cost factor 12)
- Secure password reset flow

## Authorization

Role-Based Access Control (RBAC):

| Role | Access |
|------|--------|
| Student | Own schedule, campus map, pulse, issues (own), lost & found, AI chat |
| Faculty | Own schedule, class management, room status, issues, AI chat |
| Admin | Full access, simulation, optimization, digital twin control, user management |

### Middleware
- `get_current_user` - Extract user from JWT
- `require_role(*roles)` - Check user role
- `require_self_or_admin` - Allow user to access own data or admin

## Input Validation

- All inputs validated with Pydantic schemas
- SQL injection prevented by SQLAlchemy ORM
- XSS prevented by React auto-escaping
- CSRF protection on state-changing endpoints
- File upload validation (type, size, content)

## Rate Limiting

- Slowapi middleware on all endpoints
- Limits: 100 requests/15min for authenticated, 20/15min for anonymous
- Stricter limits on AI endpoints (10/min)
- IP-based tracking with Redis

## Data Protection

- Passwords never stored in plain text
- JWT secrets rotated periodically
- API keys stored in environment variables
- Database credentials in secrets manager
- No sensitive data in logs

## API Security

- CORS configured with allowed origins
- Security headers (CSP, X-Frame-Options, etc.)
- Request size limits
- Timeout configurations
- Error messages don't leak system info

## Real-time Security

- WebSocket connections authenticated
- Subscription authorization checked
- Message size limits
- Rate limiting on message send

## Audit Logging

All admin actions logged:
- Timestamp
- User ID
- Action
- Target entity
- Changes made
- IP address

## Privacy

- Location data: contextual only, not continuous tracking
- Student locations: not shared with other students
- Crowd data: aggregated where possible
- Personal data: minimized, purpose-limited
- Right to erasure supported

## Vulnerabilities Addressed

- OWASP Top 10 mitigated
- Regular dependency scanning
- Security headers configured
- Secure defaults enforced
- Principle of least privilege
