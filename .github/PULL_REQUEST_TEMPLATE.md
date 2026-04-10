## Summary
<!-- What does this PR do? Why? Link to the issue/ticket. -->

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Infrastructure / DevOps
- [ ] Documentation

---

## Security Checklist ✓
> **All boxes must be checked before merge.** If a box doesn't apply, mark it and explain why.

### Secrets & Credentials
- [ ] No hardcoded secrets, API keys, tokens, or passwords in any file
- [ ] No credentials committed to `.env` (use `.env.example` only)
- [ ] New env vars are documented in `.env.example`

### Input Validation & Injection
- [ ] All new user inputs have server-side schema validation (Zod/Joi)
- [ ] No raw SQL string concatenation — parameterized queries or ORM only
- [ ] No `eval()`, `exec()`, `Function()`, or dynamic code execution with user input
- [ ] File uploads: validated MIME type, size limit enforced, renamed server-side

### Authentication & Authorization
- [ ] New endpoints have `authenticate` middleware applied
- [ ] Authorization checks verify object ownership (not just authentication)
- [ ] New routes added to the route file with correct middleware chain

### Output & Error Handling
- [ ] Error messages do not expose stack traces, file paths, or DB errors to client
- [ ] HTTP status codes are semantically correct (401 vs 403, 404 vs 422, etc.)
- [ ] New API responses follow `{ success, data, error }` structure

### Dependencies
- [ ] New npm packages are from trusted, actively-maintained sources
- [ ] No packages with known CRITICAL/HIGH CVEs (run `npm audit`)
- [ ] Versions pinned exactly (no `^` or `~` in production deps)

### Logging & PII
- [ ] Sensitive data (passwords, tokens, PII) is not logged
- [ ] New log statements use the structured `logger` (not `console.log`)
- [ ] Security events use `securityLog.*` helpers

### Testing
- [ ] Unit/integration tests written for security-sensitive logic
- [ ] Tests pass locally (`npm test`)

### Architecture
- [ ] Threat model updated if new external services or auth flows added
- [ ] CHANGELOG.md updated (for user-visible changes)

---

## Test Plan
<!-- How did you verify this works? What edge cases did you test? -->

## Screenshots / Logs (if applicable)
