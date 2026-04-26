# ProShop MERN — Local Development Setup & Troubleshooting

**Date:** 2026-04-25
**Scope:** verify the manual Block 2 startup flow and document real setup issues without storing local secrets or machine-specific values.

## Files inspected

- `package.json`
- `frontend/package.json`
- `backend/server.js`
- `backend/config/db.js`
- `backend/seeder.js`
- `.gitignore`
- `.env.example`
- `README.md`

## Runtime and setup summary

| Item | Verified value |
|------|----------------|
| Backend entry | `backend/server.js` |
| Frontend entry | `frontend/src/index.js` |
| Dev command | `npm run dev` |
| Seed command | `npm run data:import` |
| MongoDB | local Docker container using `mongo:7` |
| Frontend URL | `http://localhost:3000` |
| Backend URL | `http://localhost:5001` for this local setup |

## Required environment variables

Discovered from `backend/server.js`, `backend/config/db.js`, `backend/utils/generateToken.js`, and `backend/middleware/authMiddleware.js`:

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | backend development/production mode |
| `PORT` | backend listen port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing and verification |
| `PAYPAL_CLIENT_ID` | PayPal client ID returned from `/api/config/paypal` |

## Safety note about `.env`

- A local `.env` file was used during the original verification run, but it remained untracked.
- This lesson log intentionally avoids copying local `.env` contents.
- Only `.env.example` should document configuration values, and it should use safe placeholders only.

## Commands run during the original verification task

```bash
docker ps -a --filter name=^mongo$
npm install
npm install --prefix frontend
npm run data:import
npm run dev
curl -i http://localhost:5001/api/products
curl -I http://localhost:3000
```

## Issues encountered and fixes

1. **Node.js 25 backend compatibility**
   - Earlier in the homework, `jsonwebtoken` had already been updated to `^9.0.3` so the backend no longer depended on the old `SlowBuffer` path that broke on newer Node.js.
2. **Port 5000 conflict on some macOS setups**
   - The local verification run used `PORT=5001` and the checked-in frontend proxy `http://127.0.0.1:5001`.
3. **Legacy React build tooling on modern Node.js**
   - `frontend/package.json` uses `NODE_OPTIONS=--openssl-legacy-provider` for the CRA start/build scripts.
4. **Lingering local processes**
   - If ports `3000` or `5001` were already occupied, the fix was to stop the old dev processes before retrying `npm run dev`.

## Verification results from the original startup task

| Check | Result |
|-------|--------|
| MongoDB container available locally | ✅ PASS |
| `npm run data:import` | ✅ PASS |
| `curl http://localhost:5001/api/products` | ✅ PASS |
| `curl -I http://localhost:3000` | ✅ PASS |
| Frontend proxy to backend | ✅ PASS |

## Files changed during the original startup task

| File | Notes |
|------|-------|
| `.env.example` | kept as safe-placeholder documentation |
| `frontend/package.json` | uses proxy `http://127.0.0.1:5001` and the OpenSSL legacy flag |
| `package-lock.json` | reflects the earlier `jsonwebtoken` compatibility update |
| `docs/start_app_troubleshooting.md` | stores the short verification log used by the homework report |

## Remaining caveats

- The repo is intentionally legacy, so `npm audit` still reports many known vulnerabilities in old tooling.
- `npm run build --prefix frontend` completes, but the legacy app still reports existing React Hook warnings in `ProductScreen.js` and `OrderScreen.js`.
- Manual PayPal checkout requires a real sandbox client ID in a local untracked `.env`; placeholder values are only for documentation.
