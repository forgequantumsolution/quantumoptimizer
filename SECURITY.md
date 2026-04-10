# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (current) | ✅ Receiving security patches |
| < 1.0  | ❌ End of life |

## Reporting a Vulnerability

**Do NOT open a public GitHub Issue for security vulnerabilities.**

### How to Report

Email: **security@forgequantumsolutions.com**

Please include:
- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept if possible)
- Affected component and version
- Potential impact assessment
- Your contact information (for follow-up)

### What to Expect

| Milestone | SLA |
|-----------|-----|
| Acknowledgement | < 48 hours |
| Initial triage | < 7 days |
| Status update | Every 7 days until resolved |
| Fix for Critical/High | < 24h / 7 days |
| Public disclosure | Coordinated with reporter |

We follow **responsible disclosure**: we ask you to keep the issue private until we have released a fix and coordinated disclosure timing.

### Scope

**In scope:**
- Quantum Optimizer API (`/api/*`)
- Authentication and authorization systems
- Data exposure vulnerabilities
- Injection vulnerabilities (SQL, command, XSS)
- Authentication bypass
- SSRF vulnerabilities

**Out of scope:**
- Denial of service attacks
- Social engineering
- Physical security
- Vulnerabilities in third-party dependencies (report upstream first)
- Issues in demo/development environments with non-production data

### Bug Bounty

This project currently runs a **courtesy recognition program** (no monetary rewards). Security researchers who report valid, in-scope vulnerabilities will be acknowledged in our Hall of Fame below.

## Hall of Fame

*No reports yet — be the first responsible discloser!*

## Security Practices

- All dependencies audited weekly via Dependabot
- SAST scanning on every PR (Semgrep)
- Container scanning (Trivy) on every build
- Penetration test annually
- See [docs/SECURITY_RUNBOOK.md](docs/SECURITY_RUNBOOK.md) for internal procedures
