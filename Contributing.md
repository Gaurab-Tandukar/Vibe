# Contributing to Vibe

Thanks for your interest in contributing! This is a student/portfolio project, but contributions, bug reports, and suggestions are welcome.

## Getting started

1. Fork the repository and clone your fork
2. Follow the setup steps in the [README](./readme.md) to get the backend and frontend running locally
3. Create a branch for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development guidelines

- **Backend** (`Vibe-backend-api/`): Express + Mongoose. Keep controllers thin — business logic belongs in `services/`.
- **Frontend** (`Vibe-frontend/`): React + Vite. Shared logic goes in `hooks/` or `context/`; API calls go in `api/`.
- Match existing code style (the project doesn't currently enforce Prettier/ESLint rules strictly, but keep formatting consistent with surrounding code).
- **File naming on Windows:** this project has hit case-sensitivity bugs before (Windows' filesystem is case-insensitive, Linux CI/production isn't). Double-check that import paths match actual filenames exactly, including capitalization.

## Submitting changes

1. Commit your changes with a clear, descriptive message
2. Push to your fork and open a Pull Request against `main`
3. Describe what the change does and why

## Reporting issues

Open a GitHub Issue with:

- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if relevant (redact any secrets, tokens, or connection strings)

## Security issues

Please see [SECURITY.md](./SECURITY.md) rather than opening a public issue for anything sensitive.
