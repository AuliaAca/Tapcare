# Security policy

## Reporting a vulnerability

Please **do not** open a public issue. Use GitHub's _Report a vulnerability_ (private security advisory) on this repository, or email the maintainers. Include steps to reproduce and the impact. We aim to acknowledge reports within 3 working days.

## Scope highlights

- Leaks of the API key or other secrets
- Bypasses of input validation, the rate limit, CORS or CSP
- Prompt injection that makes TapCare give unsafe guidance, for example reading out or asking for a PIN, or encouraging a payment on a suspicious screen
- Exposure of camera frames or personal data

## Practices in this codebase

See section 7 of [`docs/CODE_QUALITY_CHECKLIST.md`](docs/CODE_QUALITY_CHECKLIST.md).
