# ProShop MERN — Homework Report

## Rules diff

**Primary AI agent:** OpenCode CLI
**Main editor:** WebStorm
**Additional AI assistant:** GitHub Copilot

### Rules files created

| File | Purpose |
|------|---------|
| `AGENTS.md` | OpenCode AI agent rules for the legacy MERN codebase |
| `.github/copilot-instructions.md` | GitHub Copilot behavior guidance |

### What was manually added beyond generic auto-generated rules

- **Safe local environment guidance** — Docker MongoDB setup and placeholder-only
  `.env.example` rules to prevent accidental secret commits.
- **AI-agent workflow rules** — requiring project inspection before edits,
  avoiding large rewrites or dependency upgrades in this legacy codebase.
- **Human-written conventions** — that this is a public homework fork with
  clean commit expectations, beginner-friendly docs, and `docs/lessons/`
  as a knowledge-transfer log for future AI-agent sessions.
- **Copilot-specific behavioral constraints** — telling Copilot to inspect
  nearby files first, never suggest committing secrets, and avoid
  architecture changes.
- **Documentation structure** — establishing `docs/report.md` as the single
  homework report and `docs/lessons/` for investigation logs.
- Added `docs/coding-standards.md` and linked it from both agent rules files
  to guide AI assistants toward strongly typed JavaScript practices without
  converting the legacy project to TypeScript.

---

## Local startup and README

I ran the project locally using Docker MongoDB and `npm run dev`.

### Setup details

- **MongoDB:** Docker container `mongo` (image `mongo:7`) on `localhost:27017`
- **Backend:** Express server on port 5001 (port 5000 conflicts with macOS AirPlay)
- **Frontend:** React dev server on port 3000 (proxying API requests to backend)
- **Database seed:** `npm run data:import` — imported 3 users and 6 products

### Verification

| Check | URL / Command | Result |
|-------|---------------|--------|
| Backend API | `curl http://localhost:5001/api/products` | ✅ 200 — returns JSON product data |
| Frontend | `curl -I http://localhost:3000` | ✅ 200 — React app loads |
| Database seeded | `npm run data:import` | ✅ "Data Imported!" |

### Documentation updated

| Item | Status |
|------|--------|
| README.md updated with full setup guide | ✅ yes |
| `.env.example` updated with safe placeholders | ✅ yes |
| `docs/start_app_troubleshooting.md` created | ✅ yes |
| `docs/lessons/2026-04-25-local-startup-readme.md` created | ✅ yes |

### Startup caveats

- **Port 5000 conflict:** macOS 12+ uses port 5000 for AirPlay Receiver. The project is configured to use port 5001 instead.
- **jsonwebtoken upgrade:** Previously upgraded from 8.5.1 → 9.0.3 to fix Node.js 25 compatibility (SlowBuffer removal). Done in prior commit.
- **OpenSSL legacy provider:** Required for `react-scripts@3.4.3` on Node 17+. Already configured in `frontend/package.json`.
