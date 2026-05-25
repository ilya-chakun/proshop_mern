# 0001: Use a single Express server for the API and production static hosting

- Status: accepted
- Date: 2026-04-25
- Confidence: HIGH

## Context and Problem Statement

The repository contains one Node.js backend and one React frontend, but the current codebase still needs a clear deployment shape. The architecture visible in the code shows that development runs the backend and frontend separately, while production serves the built frontend from the Express server.

## Decision Drivers

- Keep the legacy homework fork simple and reviewable.
- Reuse one Node.js runtime for API endpoints and production static hosting.
- Preserve the existing developer workflow where `npm run dev` starts backend and frontend together.

## Considered Options

- A single Express application serving the API and the built React frontend in production.
- Fully separate frontend and backend deployments.

## Decision Outcome

Chosen option: a single Express-based backend remains the system entry point, and it serves the React build in production while exposing REST endpoints under `/api/*`.

## Consequences

### Positive

- Keeps the deployment model simple for a legacy project.
- Matches the existing scripts and backend entrypoint.
- Avoids introducing extra infrastructure or routing layers.

### Negative

- Frontend and backend remain coupled at deployment time.
- Scaling frontend and backend independently is less straightforward.
- The backend takes responsibility for both API traffic and static asset delivery in production.

## Evidence in Code

- `package.json` uses `npm run dev` with `concurrently` to run backend and frontend together.
- `backend/server.js` registers API routes under `/api/products`, `/api/users`, `/api/orders`, and `/api/upload`.
- `backend/server.js` serves `/frontend/build` and falls back to `index.html` when `NODE_ENV === 'production'`.
