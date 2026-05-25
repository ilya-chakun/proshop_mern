# Security Mate — Review Summary

**Reviewer:** security-mate (via OpenCode Worker agent)
**Scope:** backend/controllers/*.js, backend/middleware/*.js, backend/routes/*.js, backend/server.js, backend/utils/*.js, backend/models/userModel.js, ai/mcp-feature-flags/server.py, ai/mcp-search-docs/server.py, ai/rag/*.py
**Diff / scope size:** ~1200 lines across 18 files
**Date:** 2026-05-25

## Findings

- **HIGH:** 6 issues
- **MEDIUM:** 8 issues
- **LOW:** 4 issues

---

## HIGH severity

### 1. `backend/controllers/productController.js:12` — NoSQL Injection via unsanitized regex (A03)
User-supplied `req.query.keyword` is passed directly to MongoDB `$regex` without escaping special regex characters. An attacker can craft a ReDoS payload or extract data via regex injection.
```js
name: { $regex: req.query.keyword, $options: 'i' }
```
**Fix:** Escape regex special chars or switch to `$text` index search.
**Effort:** 30 min

### 2. `backend/controllers/orderController.js:43` — IDOR on order viewing (A01)
Any authenticated user can view any order by guessing/knowing the order ID. No ownership check.
```js
const order = await Order.findById(req.params.id).populate('user', 'name email')
// No check: order.user._id !== req.user._id
```
**Fix:** Add `order.user._id.toString() === req.user._id.toString() || req.user.isAdmin` check.
**Effort:** 15 min

### 3. `backend/controllers/orderController.js:60` — IDOR on order payment (A01)
`updateOrderToPaid` accepts any authenticated user marking any order as paid. No ownership verification.
**Fix:** Same ownership guard as #2.
**Effort:** 15 min

### 4. `backend/routes/userRoutes.js:16` — No rate limiting on login (A04)
Login endpoint has zero rate limiting, enabling brute-force password attacks.
```js
router.post('/login', authUser)
```
**Fix:** Add `express-rate-limit` (5 attempts / 15 min per IP).
**Effort:** 30 min

### 5. `backend/routes/userRoutes.js:15` — No rate limiting on registration (A04)
Registration has no rate limiting, enabling mass account creation attacks.
**Fix:** Add rate-limit middleware to POST /api/users.
**Effort:** 15 min

### 6. `backend/routes/featureFlagsRoutes.js:50` — Unauthenticated feature flag mutation (A01)
POST `/api/feature-flags/state` and POST `/api/feature-flags/traffic` have no authentication middleware. Any anonymous client can change feature flags and traffic percentages.
```js
router.post('/state', async (req, res, next) => { ... })  // no protect/admin
router.post('/traffic', async (req, res, next) => { ... }) // no protect/admin
```
**Fix:** Add `protect, admin` middleware to both POST routes.
**Effort:** 10 min

---

## MEDIUM severity

### 7. `backend/controllers/userController.js:40` — No password strength validation on registration (A07)
Passwords of any length/complexity accepted. User can register with password "1".
**Fix:** Add minimum length (8 chars) and complexity validation.
**Effort:** 20 min

### 8. `backend/controllers/userController.js:88` — No password validation on profile update (A07)
Same issue as #7 but on the profile update endpoint.
**Fix:** Apply same validation as registration.
**Effort:** 10 min

### 9. `backend/middleware/errorMiddleware.js:12` — Stack trace exposure (A05)
Stack traces shown whenever `NODE_ENV !== 'production'`. If NODE_ENV is unset (common in staging/test), full stack traces leak.
**Fix:** Default to hiding stacks; only show when explicitly `development`.
**Effort:** 5 min

### 10. `backend/server.js:33` — PayPal Client ID on unauthenticated endpoint (A05)
`/api/config/paypal` exposes PayPal client ID without authentication.
**Fix:** While semi-public, consider embedding in frontend build or requiring auth.
**Effort:** 15 min

### 11. `backend/controllers/orderController.js:14` — Client-supplied prices trusted (A08)
`itemsPrice`, `taxPrice`, `shippingPrice`, `totalPrice` all accepted from request body without server-side recalculation. Attacker can set totalPrice to $0.01.
**Fix:** Recalculate from product DB prices server-side.
**Effort:** 1 hour

### 12. `backend/routes/uploadRoutes.js:31` — No file size limit on uploads (A08)
Multer configured without `limits.fileSize`. Attacker can upload arbitrarily large files.
**Fix:** Add `limits: { fileSize: 5 * 1024 * 1024 }`.
**Effort:** 5 min

### 13. `backend/middleware/authMiddleware.js:21` — Sensitive error logging (A09)
Full error object (potentially containing token data) logged via `console.error(error)`.
**Fix:** Log only `error.message`.
**Effort:** 5 min

### 14. `backend/controllers/userController.js:153` — Admin privilege change without audit (A01)
`user.isAdmin = req.body.isAdmin` — admin rights toggled with no audit trail.
**Fix:** Add logging for privilege changes.
**Effort:** 15 min

---

## LOW severity

### 15. `backend/server.js:25` — No request body size limit (A05)
`express.json()` used without `limit` option. Large JSON payloads can cause DoS.
**Fix:** `express.json({ limit: '10kb' })`.
**Effort:** 5 min

### 16. `backend/server.js:19` — Missing security headers (A05)
No `helmet` middleware configured. Missing X-Content-Type-Options, X-Frame-Options, CSP.
**Fix:** Add `helmet` middleware.
**Effort:** 15 min

### 17. `ai/mcp-feature-flags/server.py:18` — Race condition on features.json writes (A04)
No file locking in `_load()`/`_save()`. Concurrent writes from both MCP server and Express routes can corrupt the file.
**Fix:** Add file locking (`filelock` library) or use a database instead.
**Effort:** 30 min

### 18. `backend/routes/featureFlagsRoutes.js:52` — Debug logging of request body (A09)
`console.log('POST /state body:', JSON.stringify(req.body))` logs all request data.
**Fix:** Remove or gate behind `NODE_ENV === 'development'`.
**Effort:** 5 min

---

## Status

- ✅ All OWASP categories A01-A10 scanned
- ✅ Secrets scan completed (no hardcoded secrets found — JWT_SECRET loaded from env)
- ✅ Crypto config reviewed (bcrypt with salt rounds 10 — acceptable)
- ⚠️ No automated dependency audit run (`npm audit`) — manual review only
