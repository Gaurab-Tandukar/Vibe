# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Vibe, please report it privately rather than opening a public GitHub issue.

- Open a private security advisory via GitHub (Security tab → "Report a vulnerability"), or
- Contact the maintainer directly

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce
- Any relevant logs or screenshots (with secrets/tokens redacted)

## Scope

This is a student/portfolio project, not a production service handling real user data at scale. That said, reports on the following are appreciated:

- Authentication / JWT handling
- CORS or CSRF issues
- Injection vulnerabilities (NoSQL injection, XSS, etc.)
- Exposed secrets or credentials
- Insecure direct object references (e.g. accessing another user's data)

## Known limitations

- File uploads are currently stored on local disk via a Docker volume rather than a cloud storage provider (S3 migration planned)
- This project uses temporary/lab-issued cloud credentials during development, which is not a production-appropriate credential model

## Supported Versions

This project does not currently maintain multiple versions — only the `main` branch is supported.
