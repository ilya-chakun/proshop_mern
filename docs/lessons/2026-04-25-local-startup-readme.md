# Lesson: Local Startup & README Documentation

**Date:** 2026-04-25
**Task:** BLOCK 2 — Run the project locally, verify it works, update README

## Files Inspected

- `package.json` — root scripts and dependencies
- `frontend/package.json` — frontend scripts, proxy setting, React version
- `backend/server.js` — entry point, env vars used, routes, port binding
- `backend/seeder.js` — seed/destroy script
- `backend/config/db.js` — MongoDB connection
- `.gitignore` — confirms `.env` is ignored
- `.env.example` — placeholder env file
- `.env` — local env (not committed)
- `docs/lessons/start_app_troubleshooting.md` — prior troubleshooting log
- `README.md` — existing README content

## Environment Variables Discovered

Found by scanning `backend/` for `process.env.*`:

| Variable           | File               | Purpose                          |
|--------------------|--------------------|----------------------------------|
| `NODE_ENV`         | `server.js`        | Development/production mode      |
| `PORT`             | `server.js`        | Backend port (default 5000)      |
| `MONGO_URI`        | `config/db.js`     | MongoDB connection string        |
| `JWT_SECRET`       | `utils/`, middleware | JWT signing secret              |
| `PAYPAL_CLIENT_ID` | `server.js`        | PayPal client ID for `/api/config/paypal` |

## Commands Executed

```bash
# 1. Checked git state
git status
git branch --show-current
git log --oneline --decorate -5

# 2. Verified MongoDB Docker container
docker ps -a --filter name=^mongo$
# Result: mongo container Up and running

# 3. Verified dependencies installed
ls node_modules/.package-lock.json       # root: installed
ls frontend/node_modules/.package-lock.json  # frontend: installed

# 4. Seeded database
npm run data:import
# Result: "Data Imported!" — success

# 5. Started dev server
npm run dev
# Result: Backend on port 5001, frontend on port 3000

# 6. Verified backend
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/products
# Result: 200

# 7. Verified frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Result: 200
```

## Files Created/Updated

| File | Action |
|------|--------|
| `README.md` | Rewritten with complete setup guide |
| `.env.example` | Verified — contains safe placeholders only |
| `docs/report.md` | Updated with BLOCK 2 section |
| `docs/lessons/2026-04-25-local-startup-readme.md` | Created (this file) |
| `docs/start_app_troubleshooting.md` | Created with verification log |

## Verification Result

| Check | Status |
|-------|--------|
| MongoDB running (Docker) | ✅ |
| Database seeded | ✅ |
| Backend API responds (port 5001) | ✅ |
| Frontend loads (port 3000) | ✅ |
| `.env` not committed | ✅ |
| `.env.example` has safe placeholders only | ✅ |
| README contains only verified facts | ✅ |

## Follow-up Notes

- The project uses PORT=5001 locally due to macOS AirPlay conflict on port 5000. The `.env.example` keeps PORT=5000 as the default since not all users have this conflict.
- `jsonwebtoken` was previously upgraded from 8.5.1 to 9.0.3 to fix Node.js 25 `SlowBuffer` removal. This was done in a prior commit (`fix/local-dev-setup`).
- Frontend `react-scripts@3.4.3` requires `--openssl-legacy-provider` on Node 17+. Already configured in `frontend/package.json` start script.
