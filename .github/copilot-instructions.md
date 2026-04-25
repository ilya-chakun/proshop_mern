# Copilot Instructions — ProShop MERN

## Project Context

This is a **legacy MERN e-commerce app** (Brad Traversy's ProShop).
Backend uses Node.js/Express with ES Modules; frontend uses React 16 with Redux 4.
It is maintained as a public homework fork — keep changes minimal and reviewable.

## Development Commands

| Command                         | Purpose                        |
|---------------------------------|--------------------------------|
| `npm run dev`                   | Start backend + frontend       |
| `npm run data:import`           | Seed the database              |
| `npm run data:destroy`          | Destroy seed data              |
| `npm test --prefix frontend`    | Run frontend tests             |
| `npm run build --prefix frontend` | Production build             |

## Coding Guidelines

- Use ES Module syntax (`import`/`export`) in backend code.
- Use `express-async-handler` for route error handling.
- Follow existing patterns in nearby files before suggesting new code.
- Frontend proxy targets `http://127.0.0.1:5001`.

## Environment and Secrets

- **Never suggest committing `.env`** or any real credentials.
- `.env.example` must contain only safe placeholder values.
- Local MongoDB: `mongodb://localhost:27017/proshop` (via Docker).

## Documentation and Homework Rules

- Homework report lives in `docs/report.md` — update that file for submissions.
- Investigation/debugging logs go in `docs/lessons/`.
- Keep docs beginner-friendly (~30 min setup for a new developer).

## What Copilot Should Avoid

- Do not suggest large dependency upgrades or architecture changes.
- Do not generate code that assumes a different framework or state manager.
- Do not delete existing user work in docs or configuration files.
- Do not invent project facts — inspect files first.
- Do not suggest committing secrets, tokens, or passwords.
