# AGENTS.md — AI Agent Rules for ProShop MERN

## 1. Overview

This is a **legacy MERN e-commerce application** (ProShop) originally by Brad Traversy.
It is being maintained as a public homework fork — commits must be clean and reviewable.

## 2. Tech Stack

| Layer    | Technology                                                  |
|----------|-------------------------------------------------------------|
| Backend  | Node.js, Express 4, Mongoose 5, ES Modules (`"type":"module"`) |
| Frontend | React 16, Redux 4, React-Bootstrap, React Router 5         |
| Database | MongoDB (local via Docker or Atlas)                         |
| Auth     | JWT (jsonwebtoken + bcryptjs)                               |
| Payments | PayPal (react-paypal-button-v2)                             |
| Uploads  | Multer (stored in `uploads/`)                               |
| Dev      | Nodemon, Concurrently                                       |

## 3. Architecture

```
backend/
  server.js          # Express entry point
  config/            # DB connection
  controllers/       # Route handlers
  data/              # Seed data (users, products)
  middleware/        # Auth & error middleware
  models/            # Mongoose models
  routes/            # Express routers
  seeder.js          # Import/destroy seed data
  utils/             # JWT helper
frontend/
  src/
    actions/         # Redux action creators
    components/      # React components
    constants/       # Redux action types
    reducers/        # Redux reducers
    screens/         # Page-level components
    store.js         # Redux store
uploads/             # User-uploaded images
```

## 4. Commands

Run from the repository root:

| Command                | What it does                              |
|------------------------|-------------------------------------------|
| `npm install`          | Install backend dependencies              |
| `npm install --prefix frontend` | Install frontend dependencies  |
| `npm run dev`          | Start backend + frontend concurrently     |
| `npm run server`       | Start backend only (nodemon)              |
| `npm run client`       | Start frontend only                       |
| `npm start`            | Start backend (production, no nodemon)    |
| `npm run data:import`  | Seed the database                         |
| `npm run data:destroy` | Destroy all database data                 |

Frontend-only (from `frontend/`):

| Command          | What it does            |
|------------------|-------------------------|
| `npm test`       | Run React tests (Jest)  |
| `npm run build`  | Production build        |

## 5. Environment & Local Setup

### MongoDB via Docker (recommended for local dev)

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

### `.env` file (root, never committed)

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/proshop
JWT_SECRET=change_me
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

- **`.env` must never be committed.** It is listed in `.gitignore`.
- **`.env.example` must contain only safe placeholder values** — no real secrets.

### Legacy Node.js / OpenSSL note

The frontend uses `react-scripts 3.4.3`. On newer Node.js versions (17+),
you may encounter OpenSSL errors. The frontend `start` script already includes
`NODE_OPTIONS=--openssl-legacy-provider`. If other scripts fail similarly,
that flag may need to be added, but do not apply it blindly.

## 6. Conventions

- ES Module imports (`import`/`export`) in backend.
- CommonJS-style `require` is **not** used in backend.
- Frontend proxy is set to `http://127.0.0.1:5001` in `frontend/package.json`.
- Error handling uses `express-async-handler` wrappers.
- API routes live under `/api/` (users, products, orders, upload).

## 7. AI Agent Workflow

1. **Inspect before editing.** Read relevant files, `package.json`, and existing patterns first.
2. **Do not invent facts.** If unsure about a command or structure, verify from source.
3. **Run the project** (`npm run dev`) to confirm changes work when possible.
4. **Keep investigation logs** in `docs/lessons/` when debugging or researching.

## 8. Git / Branch / Commit Rules

- Use **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Branch naming: `type/short-description` (e.g., `docs/ai-agent-rules`).
- Keep commits atomic and reviewable — this is a public homework fork.
- Never commit `.env`, secrets, tokens, passwords, or private keys.

## 9. What NOT to Do

- **Do not commit `.env`** or any file containing real credentials.
- **Do not introduce large rewrites or dependency upgrades** unless directly required.
- **Do not change the project architecture** (e.g., switching to TypeScript, new state manager) without explicit justification.
- **Do not delete existing user work** in docs, lessons, or configuration.
- **Preserve compatibility** with the legacy project unless a change is explicitly justified.

## 10. Human-Written Rules (Not Inferable from Code)

1. This project is a **public homework fork** — commits must be clean, well-described, and reviewable by other people.
2. Keep documentation **beginner-friendly** so another developer can set up and run the project within ~30 minutes.
3. Keep `docs/report.md` as the **main homework submission report**. Do not create competing report files.
4. Keep AI work logs in `docs/lessons/` when a task involves investigation or debugging.
5. Do not introduce dependency upgrades or large refactors unless they are directly required by a finding or fix.
