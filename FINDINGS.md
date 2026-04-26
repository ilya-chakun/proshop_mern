# FINDINGS — proshop_mern

## Structured bug-hunt coverage

- **HOTSPOTS:** reviewed multi-branch reducers, checkout screens, and request-handling routes such as `frontend/src/store.js`, `frontend/src/screens/OrderScreen.js`, and `backend/routes/uploadRoutes.js`.
- **EDGE CASES:** selected malformed persisted state and reload-sensitive checkout behavior as concrete findings.
- **OUTDATED DEPS:** reviewed the legacy dependency baseline in `package.json` and `frontend/package.json`; major-version upgrades remain intentionally out of scope for this homework because they would be large, high-risk changes.
- **HARDCODED VALUES:** reviewed ports, proxy targets, upload paths, and payment defaults while selecting the highest-risk issues first.
- **DEAD CODE:** checked for stale commented blocks and unused legacy paths; no standalone dead-code candidate outranked the listed top findings.

Top findings selected from that assessment:

| # | Risk | Where | What | How to fix | Status |
|---|------|-------|------|------------|--------|
| 1 | 🟡 medium | backend/routes/uploadRoutes.js::POST / | The image upload endpoint accepts requests without `protect` or `admin`, so anyone who can reach the API can write files into `uploads/` without signing in. The only current caller is the admin product editor, which makes the public route broader than intended. | Require authenticated admin access on the upload route and send the bearer token from the product image upload request. | ✅ fixed in commit ca153e6 |
| 2 | 🟡 medium | frontend/src/store.js::store bootstrap | The Redux store bootstraps persisted checkout state from `localStorage`. A malformed or manually edited value can throw during startup and prevent the storefront from rendering unless every persisted key uses the guarded parser. | Wrap persisted cart-state parsing in one safe helper that falls back to defaults when stored JSON is invalid. | ✅ fixed in commit a0015bb and completed in the final audit branch by extending the same guard to `paymentMethod` |
| 3 | 🟡 medium | frontend/package.json::scripts.build | The frontend `start` script already sets `NODE_OPTIONS=--openssl-legacy-provider`, but the `build` script does not. On the current Node.js runtime in this repo, `npm run build --prefix frontend` fails with `ERR_OSSL_EVP_UNSUPPORTED`, so production builds are broken. | Apply the same legacy OpenSSL flag to the build script so the existing React 16 toolchain can complete a production build. | ✅ fixed in commit 6a207ef |
| 4 | 🟡 medium | frontend/src/store.js::initialState | `savePaymentMethod` persists the checkout payment method to localStorage, but the Redux store never reads it back during startup. After a refresh, users lose the selected method and get bounced back from `PlaceOrderScreen` to `PaymentScreen`. | Rehydrate `paymentMethod` from localStorage into the initial cart state so checkout survives reloads. | ✅ fixed in commit b3f00a2 |
