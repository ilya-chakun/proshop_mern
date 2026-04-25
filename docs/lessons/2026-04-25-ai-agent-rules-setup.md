# AI Agent Rules Setup — 2026-04-25

## Task

Create OpenCode (`AGENTS.md`) and GitHub Copilot (`.github/copilot-instructions.md`)
rules files for the ProShop MERN project.

## Files Inspected

- `package.json` — backend scripts, dependencies, ES module config
- `frontend/package.json` — React 16, proxy setting, OpenSSL legacy flag
- `.gitignore` — confirms `.env` is ignored
- `.env.example` — placeholder values only
- `backend/` directory — server.js, controllers, models, routes, seeder
- `frontend/src/` — actions, reducers, screens, components, store.js
- `docs/lessons/` — existing troubleshooting log found

## Files Created

- `AGENTS.md` — OpenCode AI agent rules
- `.github/copilot-instructions.md` — GitHub Copilot instructions
- `docs/lessons/README.md` — folder purpose and rules
- `docs/lessons/2026-04-25-ai-agent-rules-setup.md` — this file
- `docs/report.md` — homework report with "Rules diff" section

## Key Decisions

- Kept AGENTS.md under 130 lines with project-specific content only.
- Copilot instructions are shorter and behavior-focused, not a copy of AGENTS.md.
- All environment values use safe placeholders (no real secrets).
- Did not modify any application source code.

## Safety Notes

- `.env` is in `.gitignore` and was not staged or committed.
- `.env.example` contains only placeholder values.
- No secrets, tokens, or passwords appear in any created file.

## Follow-up

- If new commands are added to `package.json`, update AGENTS.md accordingly.
- If the frontend proxy port changes, update both rules files.
- Review rules files when upgrading major dependencies.
