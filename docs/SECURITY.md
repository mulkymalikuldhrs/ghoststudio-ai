# Security Principles

**AI Media Intelligence OS — Security Documentation**

---

## Overview

Security in the AI Media Intelligence OS is not an afterthought — it is a foundational design principle. The system handles sensitive data including API credentials, user content, and analytics insights. A security breach could expose publishing credentials, compromise content integrity, or leak proprietary content strategies stored in the memory system.

This document outlines the security principles, threat model, and specific measures implemented across the system.

---

## Core Security Principles

### Principle 1: Data Belongs to the User

The user owns their content, their memory data, their analytics, and their credentials. The system processes this data on their behalf but never uses it for purposes beyond the stated functionality.

**Implications**:
- User content is never used to train AI models
- Memory data is never shared across workspaces without explicit consent
- Analytics data is never aggregated into benchmarks without anonymization
- User data is never sold to third parties

### Principle 2: Least Privilege

Every component, user, and API key should have the minimum permissions necessary to perform its function. No more, no less.

**Implications**:
- User roles (operator, admin, viewer) have distinct permission levels
- API credentials are scoped to specific platforms and operations
- AI agents cannot access data outside their workspace
- Scheduler jobs are isolated per workspace

### Principle 3: Defense in Depth

No single security measure is sufficient. The system uses multiple layers of protection so that a failure in one layer does not compromise the entire system.

**Implications**:
- Authentication + authorization at the API layer
- Workspace isolation at the data layer
- Encrypted credentials at rest
- Input validation at every entry point
- Audit logging for all sensitive operations

### Principle 4: Fail Securely

When the system encounters an error, it should fail in a way that preserves security. This means denying access by default, logging errors without exposing sensitive data, and never falling back to insecure behavior.

**Implications**:
- Auth failures return generic error messages (no "user not found" vs "wrong password" distinction)
- Database errors are logged with sanitized metadata
- AI call failures are logged but never expose API keys
- Publishing failures are recorded without exposing platform credentials

### Principle 5: Audit Everything

Every significant action is logged to the SystemLog model. This creates a complete audit trail that enables:
- Security incident investigation
- Compliance verification
- Debugging and error resolution
- Usage analytics and billing

**Implications**:
- All API calls are logged with sanitized parameters
- All publishing actions are logged with outcomes
- All authentication events are logged
- All credential changes are logged

---

## Threat Model

### Threat 1: Credential Exposure

**Risk**: API credentials (WordPress passwords, AI API keys) are exposed through database compromise, logging, or API responses.

**Mitigations**:
- API credentials are stored encrypted in the `ApiCredential` table (`encryptedToken` field)
- Credentials are never included in API responses (filtered before sending)
- Credentials are never included in SystemLog entries (sanitized in metadata)
- The `encryptedToken` field uses application-level encryption (V1) with a path to platform-level encryption (V4)

### Threat 2: Cross-Workspace Data Access

**Risk**: A user accesses data belonging to another workspace.

**Mitigations**:
- All database queries are scoped by `workspaceId`
- API routes validate workspace ownership before returning data
- Workspace slugs are unique, preventing accidental collision
- Cascade deletes ensure clean data separation

### Threat 3: Content Injection

**Risk**: Malicious content is injected into the system through the content pipeline, potentially exploiting WordPress vulnerabilities or social engineering readers.

**Mitigations**:
- All content is processed through the AI pipeline before publishing (never raw user input)
- Content scoring serves as a quality and safety gate
- HTML content is sanitized before being sent to WordPress
- Markdown is the canonical format, reducing injection surface area

### Threat 4: Unauthorized Publishing

**Risk**: Content is published without authorization, either through API abuse or system malfunction.

**Mitigations**:
- Publishing requires authentication
- Automation modes control autonomous publishing (manual, semi-auto, full-auto)
- Energy system provides an additional gate against over-publishing
- All publishing actions are logged with user/timestamp
- Dry-run mode allows testing without actual publishing

### Threat 5: AI Prompt Injection

**Risk**: Malicious content in source notes or ideas influences the AI to generate harmful or misleading content.

**Mitigations**:
- System prompts are hardcoded and not user-modifiable in V1
- Content scoring detects hallucination risk
- Trust scoring evaluates source quality
- Human review is required for content scoring below 80

### Threat 6: Denial of Service

**Risk**: Excessive API calls or job queue flooding degrades system performance.

**Mitigations**:
- Scheduler processes a maximum of 50 jobs per daily cycle
- Job queue has priority ordering (prevents low-priority flooding)
- API routes should implement rate limiting (V2)
- SQLite has built-in concurrency limits that prevent connection exhaustion

---

## Authentication and Authorization

### Authentication (NextAuth)

The system uses NextAuth.js for authentication with the following configuration:
- Email/password authentication
- Secure HTTP-only session cookies
- CSRF protection on all mutation endpoints
- Session expiration and renewal

### Authorization (Role-Based Access Control)

| Role | Capabilities |
|------|-------------|
| `viewer` | Read-only access to dashboard and content |
| `operator` | Create, edit, and manage content; configure workspace settings |
| `admin` | Full access including user management, credential management, and workspace deletion |

### Workspace Authorization

Every API route must validate:
1. The user is authenticated
2. The user has access to the specified workspace
3. The user's role permits the requested action

```typescript
// Example authorization check pattern
const session = await getServerSession(authOptions);
if (!session?.user) return unauthorized();
const workspace = await db.workspace.findFirst({
  where: { id: workspaceId, ownerId: session.user.id },
});
if (!workspace) return forbidden();
```

---

## Data Protection

### At Rest

- **Database**: SQLite file with filesystem-level permissions
- **API Credentials**: Encrypted using application-level encryption before storage
- **User Passwords**: Hashed using bcrypt (via NextAuth)
- **Session Tokens**: Secure HTTP-only cookies

### In Transit

- **HTTPS**: All API communication should use HTTPS in production
- **WordPress API**: Communicates over HTTPS with Application Passwords (Base64 encoded)
- **AI API**: Communicates over HTTPS via z-ai-web-dev-sdk

### In Memory

- **Credentials**: Loaded only when needed for publishing operations, never cached long-term
- **Session Data**: Stored in secure HTTP-only cookies, not in JavaScript-accessible storage
- **AI Responses**: Processed and stored in the database, not retained in memory

---

## API Security

### Input Validation

All API routes validate input before processing:
- Required fields must be present
- String lengths are bounded
- Numeric values are clamped to valid ranges
- JSON payloads are validated for structure

### Output Sanitization

All API responses sanitize sensitive data:
- API credentials are never included in responses
- Internal error messages are replaced with generic messages
- Stack traces are never exposed in production
- Metadata is filtered to remove sensitive fields

### Rate Limiting

V1 does not implement API rate limiting. V2 will add:
- Per-user rate limits on mutation endpoints
- Per-workspace rate limits on AI generation endpoints
- Global rate limits on authentication endpoints
- Rate limit headers in API responses

---

## Logging and Monitoring

### What Is Logged

| Category | Examples | Retention |
|----------|----------|-----------|
| Authentication | Login, logout, failed attempts | 90 days |
| Content operations | Create, edit, score, publish | 30 days |
| AI operations | Model calls, token usage, errors | 30 days |
| Publishing | Platform calls, success/failure | 90 days |
| System errors | Service failures, unhandled exceptions | 90 days |

### What Is NOT Logged

- API credentials (encrypted tokens, passwords)
- Full content of AI prompts (only metadata)
- Session tokens or cookies
- Personal data beyond user ID and workspace ID

### Log Sanitization

Before writing to SystemLog, all metadata is sanitized:
```typescript
const sanitizedMetadata = {
  ...metadata,
  apiKey: metadata.apiKey ? '***REDACTED***' : undefined,
  password: undefined,
  token: undefined,
};
```

---

## Dependency Security

### Regular Updates

All dependencies should be regularly updated to address known vulnerabilities:
- Run `bun audit` before each deployment
- Monitor security advisories for critical dependencies (Next.js, Prisma, NextAuth)
- Update z-ai-web-dev-sdk to latest version for security patches

### Minimal Dependencies

The system intentionally uses a minimal dependency set:
- No unnecessary packages that expand the attack surface
- No packages with known vulnerabilities
- No packages from untrusted sources

### Supply Chain Security

- Lock file (`bun.lock`) is committed to version control
- Dependency versions are pinned (no floating ranges in production)
- Integrity hashes are verified during installation

---

## Deployment Security

### Environment Variables

Sensitive configuration is stored in environment variables, never in code:
- `DATABASE_URL`: Database connection string
- `NEXTAUTH_SECRET`: Session encryption key
- `NEXTAUTH_URL`: Callback URL for authentication
- `STRIPE_SECRET_KEY`: Payment processing key
- `STRIPE_WEBHOOK_SECRET`: Webhook verification key

### Docker Security

The Dockerfile follows security best practices:
- Non-root user for the application process
- Minimal base image
- No unnecessary tools or packages
- Read-only filesystem where possible

### Database Security

- SQLite file permissions restricted to the application user
- No direct database access from external networks
- Regular backups (operator responsibility in V1)
- Migration scripts are idempotent and reversible

---

## Incident Response

### Detection

Security incidents are detected through:
- Unusual patterns in SystemLog (repeated auth failures, unexpected API calls)
- Content scoring anomalies (sudden score drops, hallucination spikes)
- Publishing anomalies (unexpected publications, credential failures)

### Response

1. **Isolate**: Disable the affected workspace or user account
2. **Investigate**: Review SystemLog entries for the affected period
3. **Remediate**: Fix the vulnerability, rotate credentials, restore data
4. **Document**: Record the incident, root cause, and remediation steps
5. **Prevent**: Update security measures to prevent recurrence

### Communication

- Affected users are notified of security incidents that impact their data
- Incident reports are generated with sanitized details
- Security fixes are deployed as hotfixes, not scheduled releases
