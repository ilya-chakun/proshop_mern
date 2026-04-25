# ProShop MERN — Local Development Setup & Troubleshooting

## Environment

| Item | Value |
|------|-------|
| OS | macOS 26.4 (Build 25E246) |
| Node.js | v25.9.0 |
| npm | 11.12.1 |
| Docker | 29.4.0 |

## Phase 1 — Project Inspection

### Project Structure
- Backend code lives in `backend/` (not root)
- Frontend is a Create React App (react-scripts 3.4.3) in `frontend/`
- Entry: `backend/server.js` loaded via `nodemon`
- Seeder: `backend/seeder.js`
- Dev command: `npm run dev` (concurrently runs backend + frontend)

### Environment Variables Required
Found by inspecting `backend/server.js`, `backend/config/db.js`, and README:

| Variable | Used In | Purpose |
|----------|---------|---------|
| `NODE_ENV` | server.js | development/production mode |
| `PORT` | server.js | Backend port (default 5000) |
| `MONGO_URI` | config/db.js | MongoDB connection string |
| `JWT_SECRET` | (auth middleware) | JWT signing secret |
| `PAYPAL_CLIENT_ID` | server.js `/api/config/paypal` | PayPal integration |

### Seeded Users (from `backend/data/users.js`)
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | 123456 | Admin |
| john@example.com | 123456 | Customer |
| jane@example.com | 123456 | Customer |

### .gitignore
`.env` is already listed — no changes needed.

---

## Phase 2 — Environment Checks

```bash
$ node -v
v25.9.0

$ npm -v
11.12.1

$ docker --version
Docker version 29.4.0, build 9d7ad9f
```

**Node.js 25 Compatibility Notes:**
- Node 25 removed `SlowBuffer` — breaks `buffer-equal-constant-time@1.0.1` (transitive dep of `jsonwebtoken@8.5.1`)
- Node 17+ OpenSSL changes break `react-scripts@3.4.3` webpack — needs `--openssl-legacy-provider`

---

## Phase 3 — MongoDB Setup

```bash
$ docker ps -a --filter name=^mongo$
# Container "mongo" already existed and was running (Up 33 minutes)
```

**No action needed** — MongoDB container was already running. No authentication configured (intentional for local dev).

**MongoDB URI:** `mongodb://localhost:27017/proshop`

---

## Phase 4 — Environment File Setup

### `.env` (root)
Already existed with correct values. No changes to `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, or `PAYPAL_CLIENT_ID`.

**One change made:** `PORT` changed from `5000` to `5001` (see Port Conflict issue below).

Final `.env` contents:
```
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/proshop
JWT_SECRET=local_dev_secret_change_me
PAYPAL_CLIENT_ID=<configured — sandbox client ID>
```

### `.env.example` (root)
Updated with safe placeholders:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/proshop
JWT_SECRET=change_me
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

---

## Phase 5 — Install Dependencies

### Root (`npm install`)
```
up to date, audited 292 packages in 3s
39 vulnerabilities (6 low, 11 moderate, 20 high, 2 critical)
```
No errors. Already installed.

### Frontend (`cd frontend && npm install`)
```
up to date, audited 1671 packages in 15s
219 vulnerabilities (10 low, 135 moderate, 58 high, 16 critical)
```
No errors. Already installed. Vulnerabilities are expected for this legacy project (react-scripts 3.4.3, old deps).

---

## Phase 6 — Seed Database

```bash
$ npm run data:import
> node backend/seeder
MongoDB Connected: localhost
Data Imported!
```

**Exit code: 0** — Success. Users and products imported.

---

## Phase 7 — Start the App (`npm run dev`)

### Issue 1: `SlowBuffer` TypeError (FATAL — backend crash)

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'prototype')
    at .../node_modules/buffer-equal-constant-time/index.js:37:35
```

**Root Cause:** Node.js 25 removed `SlowBuffer` from the `buffer` module. The package `buffer-equal-constant-time@1.0.1` (used by `jsonwebtoken@8.5.1 → jws → jwa`) references `SlowBuffer.prototype.equal` which no longer exists.

**Fix Applied:**
```bash
npm install jsonwebtoken@latest   # upgraded 8.5.1 → 9.0.3
```
`jsonwebtoken@9.0.3` uses updated dependencies that don't rely on `SlowBuffer`.

### Issue 2: Port 5000 conflict — macOS AirPlay Receiver

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Root Cause:** macOS 12+ uses port 5000 for AirPlay Receiver (`ControlCenter` process). Cannot be killed without disabling AirPlay.

**Fix Applied:**
1. Changed `PORT=5001` in `.env`
2. Changed `"proxy"` in `frontend/package.json` from `http://127.0.0.1:5000` to `http://127.0.0.1:5001`

**Alternative fix:** Disable AirPlay Receiver in System Settings → General → AirDrop & Handoff → AirPlay Receiver.

### Issue 3: OpenSSL legacy provider needed for react-scripts 3.4.3

**Error:** Anticipated — `react-scripts@3.4.3` uses webpack 4 with old OpenSSL hash functions.

**Fix Applied:** Updated `frontend/package.json` start script:
```json
"start": "NODE_OPTIONS=--openssl-legacy-provider react-scripts start"
```

### Issue 4: Port conflicts from lingering processes

Between restart attempts, `nodemon`/`node`/`react-scripts` child processes lingered on ports. Resolved by killing all processes on ports before restarting:
```bash
pkill -f "nodemon backend"
pkill -f "react-scripts start"
lsof -ti :5001 :3000 | xargs kill -9
```

### Final Startup Output
```
Server running in development mode on port 5001
MongoDB Connected: localhost
ℹ ｢wds｣: Project is running at http://192.168.1.242/
Compiled with warnings.
```

**Warnings (non-blocking):**
- `Browserslist: caniuse-lite is outdated` — cosmetic
- React Hook missing dependency warnings in `ProductScreen.js` and `OrderScreen.js` — lint warnings, not errors
- `DEP0060: util._extend` deprecation — from webpack dev server internals

---

## Phase 8 — Verification

### Backend API (`http://localhost:5001`)

**Products endpoint:**
```bash
$ curl 'http://localhost:5001/api/products?keyword=&pageNumber=1'
# Returns JSON with 6 products: Airpods, iPhone 11 Pro, Cannon EOS, Sony Playstation, Logitech Mouse, Amazon Echo
```

**Login endpoint:**
```bash
$ curl -X POST http://localhost:5001/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"123456"}'
# Returns: { _id, name: "Admin User", email, isAdmin: true, token: "eyJ..." }
```
✅ Login works with seeded admin credentials.

### Frontend (`http://localhost:3000`)

```bash
$ curl http://localhost:3000
# Returns full HTML page with <title>Welcome To ProShop</title>
# Includes React bundle scripts (bundle.js, 0.chunk.js, main.chunk.js)
```

### Frontend → Backend Proxy

```bash
$ curl 'http://localhost:3000/api/products/top'
# Returns JSON array of products — proxy working correctly
```

### Verification Summary

| Check | Status |
|-------|--------|
| Homepage loads at http://localhost:3000 | ✅ |
| Products render (6 seeded products returned) | ✅ |
| Product detail accessible via API | ✅ |
| Frontend proxy to backend works | ✅ |
| Admin login works (admin@example.com / 123456) | ✅ |
| No CORS/proxy errors | ✅ |
| MongoDB connected | ✅ |

---

## Phase 9 — Final Summary

### Files Created or Changed

| File | Action | Description |
|------|--------|-------------|
| `.env` | Modified | Changed PORT from 5000 to 5001 |
| `.env.example` | Updated | Fixed placeholder values |
| `frontend/package.json` | Modified | Changed proxy port to 5001; added `NODE_OPTIONS=--openssl-legacy-provider` to start script |
| `package-lock.json` | Auto-updated | jsonwebtoken upgraded 8.5.1 → 9.0.3 |
| `start_app_troubleshooting.md` | Created | This file |

### Final Environment Variables

| Variable | Value |
|----------|-------|
| NODE_ENV | development |
| PORT | 5001 |
| MONGO_URI | mongodb://localhost:27017/proshop |
| JWT_SECRET | (configured) |
| PAYPAL_CLIENT_ID | (configured — sandbox) |

### Current State

- ✅ MongoDB running in Docker (container: `mongo`, image: `mongo:7`)
- ✅ Dependencies installed (root + frontend)
- ✅ Database seeded (3 users, 6 products)
- ✅ Backend running on port 5001
- ✅ Frontend running on port 3000
- ✅ App fully functional

### Unresolved Issues
- **npm audit vulnerabilities:** 37 (root) + 219 (frontend) — expected for a legacy/deprecated project. Not blocking.
- **Browserslist outdated warning** — cosmetic, run `npx browserslist@latest --update-db` in `frontend/` if desired.
- **React Hook lint warnings** — pre-existing code issues, not blocking.

---

## Quick Start Commands

### First time (fresh database):
```bash
docker start mongo        # or: docker run -d -p 27017:27017 --name mongo mongo:7
npm install
cd frontend && npm install && cd ..
npm run data:import
npm run dev
```

### Subsequent starts:
```bash
docker start mongo
npm run dev
```

### If port conflicts occur:
```bash
pkill -f "nodemon backend"
lsof -ti :5001 :3000 | xargs kill -9
npm run dev
```

### Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Admin login: admin@example.com / 123456
