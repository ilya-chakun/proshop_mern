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
