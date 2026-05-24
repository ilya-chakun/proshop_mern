# Lesson Log — 2026-04-25 — Docker Compose local setup

## Task name

Add an optional Docker Compose workflow for local development so MongoDB, backend, and frontend can start with one command: `docker compose up --build`.

## Files inspected

- `package.json`
- `frontend/package.json`
- `backend/server.js`
- `backend/config/db.js`
- `.env.example`
- `.gitignore`
- `README.md`
- `docs/report.md`
- `Procfile`

## Files created or updated

- `docker-compose.yml`
- `Dockerfile`
- `.dockerignore`
- `frontend/Dockerfile`
- `frontend/.dockerignore`
- `README.md`
- `docs/report.md`
- `docs/lessons/2026-04-25-docker-compose.md`

## Commands run

- `git status`
- `git branch --show-current`
- `git log --oneline --decorate -10`
- `git remote -v`
- `git fetch --all --prune`
- `git symbolic-ref refs/remotes/origin/HEAD --short | sed 's#origin/##'`
- `git checkout master`
- `git pull origin master`
- `git checkout -b chore/docker-compose-local-dev`
- `docker compose config`
- `docker compose up --build`
- `curl -i http://localhost:5001/api/products`
- `curl -I http://localhost:3000`
- `docker compose down`
- `docker stop mongo`
- `docker start mongo`
- `pkill -f "nodemon backend/server"`
- `pkill -f "react-scripts/scripts/start.js"`
- Git diff and security checks listed in the task instructions

## Verification result

- Compose configuration validated successfully with `docker compose config`.
- MongoDB, backend, and frontend started through Docker Compose.
- Sample data import was run automatically by a one-off Compose `seeder` service before backend startup.
- Backend API responded at `http://localhost:5001/api/products`.
- Frontend responded at `http://localhost:3000`.

## Known limitations

- The Compose workflow is optional and separate from the existing manual `.env` plus `npm run dev` setup.
- The backend still listens on container port `5000`, but Compose publishes it on host port `5001` because macOS AirPlay reserves host port `5000` on this machine.
- The frontend Docker image rewrites its internal dev proxy to `http://backend:5000` so the host-side proxy setting remains unchanged.
- The Compose stack now includes a one-off `seeder` service so the product list is not empty on a fresh MongoDB volume.
- The backend Compose service now reads `JWT_SECRET` and `PAYPAL_CLIENT_ID` from the local root `.env` via Compose variable substitution; otherwise it falls back to safe placeholders.
- During verification, the legacy `NODE_OPTIONS=--openssl-legacy-provider` wrapper failed inside the frontend container, so the image now rewrites its internal start/build scripts for Docker without changing the checked-in host workflow.
- The standalone `mongo` container used by the manual setup must be stopped before Compose can bind host port `27017`.
- Existing local `npm run dev` processes on ports `3000` and `5001` also had to be stopped before the Compose verification run.

## Secrets check

- No real secrets were added.
- `.env` remained local-only and was not committed.
- Placeholder values were used for JWT and PayPal-related configuration.
