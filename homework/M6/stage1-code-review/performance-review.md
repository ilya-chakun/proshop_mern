# Performance Mate — Review Summary

**Reviewer:** performance-mate (via OpenCode Worker agent)
**Scope:** backend/controllers/*.js, backend/middleware/*.js, backend/routes/*.js, backend/server.js, ai/mcp-feature-flags/server.py, ai/mcp-search-docs/server.py, ai/rag/*.py
**Diff / scope size:** ~1200 lines across 18 files
**Hot paths:** /api/orders, /api/products (list), /api/feature-flags, /api/products/:id/reviews
**Date:** 2026-05-25

## Findings

- **HIGH:** 5 issues (blocking I/O, missing pagination)
- **MEDIUM:** 5 issues (N+1, caching, memory, missing index)
- **LOW:** 2 issues (sync I/O, heavy computation)

---

## HIGH severity

### 1. `backend/routes/featureFlagsRoutes.js:24` — Disk I/O on every feature flags GET request
Every GET `/api/feature-flags` reads `features.json` from disk via `fs.readFile`. Under load, filesystem contention significantly degrades latency.
**Estimated impact:** +2-5ms p50; +10-50ms p95 under concurrent load.
**Fix:** In-memory cache with TTL (5s). Invalidate on write.

### 2. `backend/routes/featureFlagsRoutes.js:33` — Duplicate file read for single feature lookup
GET `/api/feature-flags/:name` performs the same `fs.readFile` to read the entire file, then extracts one feature.
**Estimated impact:** Doubled I/O when clients fetch list + individual features.
**Fix:** Share cached data across routes.

### 3. `backend/routes/featureFlagsRoutes.js:62` — Read-modify-write without caching on state changes
Every POST `/api/feature-flags/state` reads entire file, modifies, writes back. No caching layer.
**Estimated impact:** +5-15ms per write; file corruption risk under concurrent writes.
**Fix:** In-memory state + periodic flush, or migrate to database.

### 4. `backend/controllers/orderController.js:112` — GET /api/orders returns ALL orders (no pagination)
`Order.find({}).populate('user', 'id name')` loads entire orders collection.
**Estimated impact:** 10K orders → +500ms-2s response, +5-20MB memory per request.
**Fix:** Add pagination (pageSize + skip + countDocuments) like productController.

### 5. `backend/controllers/orderController.js:105` — GET /api/orders/myorders unbounded
`Order.find({ user: req.user._id })` returns all orders for a user without limit.
**Estimated impact:** Heavy user with 500+ orders → +100-300ms per request.
**Fix:** Add pagination.

---

## MEDIUM severity

### 6. `backend/controllers/userController.js:111` — GET /api/users returns ALL users (no pagination)
`User.find({})` loads all users. Admin-only but unbounded.
**Estimated impact:** 100K users → +2-5s, +50MB+ memory.
**Fix:** Add pagination.

### 7. `backend/controllers/productController.js:119` — Full product load for review duplicate check
Loads entire product (including all reviews) just to check if user already reviewed.
**Estimated impact:** Product with 1000 reviews → ~200KB loaded, O(N) scan.
**Fix:** Use `Product.findOne({ _id: id, 'reviews.user': userId })` query.

### 8. `backend/controllers/productController.js:154` — Top products query not cached
`Product.find({}).sort({ rating: -1 }).limit(3)` — full collection scan + sort on every request.
**Estimated impact:** 10K products → +50-200ms p95.
**Fix:** Cache with 5-min TTL. Data changes infrequently.

### 9. `ai/rag/query.py:48` — Entire corpus cached in memory permanently
`_load_corpus()` scrolls ALL Qdrant documents into `_CORPUS` global with no TTL or size limit.
**Estimated impact:** 10K chunks × ~1KB = ~10MB base. Never freed or refreshed.
**Fix:** Add TTL-based eviction or use Qdrant's built-in full-text search.

### 10. `backend/controllers/orderController.js:105` — Missing index on Order.user field
`Order.find({ user: ... })` without confirmed compound index → potential full collection scan.
**Estimated impact:** 100K orders → +200-500ms per myorders request.
**Fix:** Add `orderSchema.index({ user: 1, createdAt: -1 })`.

---

## LOW severity

### 11. `ai/mcp-feature-flags/server.py:19` — Synchronous file read in MCP server
`FEATURES_PATH.open('r')` on every MCP tool call. Low traffic, minimal real impact.
**Estimated impact:** +1-3ms per MCP call.
**Fix:** Cache with TTL.

### 12. `ai/rag/query.py:138` — BM25 IDF recomputed on every query
`_bm25_search` recalculates `term_doc_freq` from entire corpus each time.
**Estimated impact:** 5K documents → +20-50ms per search.
**Fix:** Pre-compute IDF when corpus is loaded.

---

## Total estimated impact

- API latency p95 (worst case): +500ms-2s on unbounded endpoints (/api/orders, /api/users)
- Memory: +10-50MB per concurrent unbounded request
- Feature flags hot path: +5-15ms per read (cacheable)

## Cross-specialist collaboration

- ReDoS vector in product search regex (`$regex: req.query.keyword`) also flagged by security-mate as A03 injection
- Feature flags unauthenticated writes (security finding) amplify the performance concern — anyone can trigger file I/O

## Status

- ✅ N+1 scan complete
- ✅ Blocking I/O scan complete
- ✅ Missing pagination identified
- ✅ Caching opportunities identified
- ✅ Memory/unbounded growth checked
