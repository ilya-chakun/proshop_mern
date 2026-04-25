# 2026-04-25 — Findings and Fixes

## Task

Complete Homework Block 3 by documenting real project findings in `FINDINGS.md`, fixing safe findings in isolated branches, and creating stacked pull requests.

## Files inspected

- `package.json`
- `frontend/package.json`
- `backend/server.js`
- `backend/config/db.js`
- `backend/controllers/orderController.js`
- `backend/controllers/productController.js`
- `backend/controllers/userController.js`
- `backend/routes/*.js`
- `backend/models/*.js`
- `backend/middleware/*.js`
- `frontend/src/store.js`
- `frontend/src/actions/*.js`
- `frontend/src/reducers/*.js`
- representative frontend screens including `ProductEditScreen`, `PlaceOrderScreen`, `OrderScreen`, `PaymentScreen`, `ProfileScreen`, `LoginScreen`, and `RegisterScreen`

## Findings selected

1. Upload API accepted unauthenticated writes to `uploads/`.
2. Store bootstrap crashed on invalid JSON in localStorage.
3. Frontend production build failed on Node.js 25 because the build script lacked the OpenSSL legacy flag.
4. Checkout lost the saved payment method after reload because store bootstrap ignored `paymentMethod`.

## Fix branches created

- `audit/findings-block-3`
- `fix/finding-1-upload-auth`
- `fix/finding-2-safe-localstorage`
- `fix/finding-3-openssl-build`
- `fix/finding-4-restore-payment-method`

## Verification commands

- `CI=true npm test --prefix frontend -- --watchAll=false`
- `CI=true npm test --prefix frontend -- --watchAll=false --passWithNoTests`
- `npm run build --prefix frontend`
- `NODE_OPTIONS=--openssl-legacy-provider npm run build --prefix frontend`
- `git diff --check`

## PR URLs

- Assessment: https://github.com/ilya-chakun/proshop_mern/pull/6
- Finding #1: https://github.com/ilya-chakun/proshop_mern/pull/7
- Finding #2: https://github.com/ilya-chakun/proshop_mern/pull/8
- Finding #3: https://github.com/ilya-chakun/proshop_mern/pull/9
- Finding #4: https://github.com/ilya-chakun/proshop_mern/pull/10

## Follow-up notes

- No frontend tests are currently checked into the repository, so frontend verification is build/manual oriented.
- The successful build still reports pre-existing React Hook dependency warnings in `ProductScreen` and `OrderScreen`.
- `.env` remained ignored and untracked throughout the task.
