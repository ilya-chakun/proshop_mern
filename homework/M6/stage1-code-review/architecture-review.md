# Architecture Mate — Review Summary

**Reviewer:** architecture-mate (via OpenCode Worker agent)
**Scope:** Full backend + AI layer architecture review
**Date:** 2026-05-25

## Findings

- **HIGH:** 4 issues (layer violations, boundary violations, missing service layer)
- **MEDIUM:** 5 issues (coupling, missing validation, inconsistencies)
- **LOW:** 2 issues (error handling, config)

---

## HIGH severity

### 1. `backend/controllers/orderController.js:14` — Client-trusted pricing (missing service layer)
Order creation accepts `itemsPrice`, `taxPrice`, `shippingPrice`, `totalPrice` directly from the client. No server-side price calculation exists. An attacker can submit a $0.01 total for any order.
**Layer:** Controller trusts client → should delegate to pricing service.
**Fix:** Create `services/orderService.js` with `calculateOrderPrices(orderItems)` that fetches product prices from DB.

### 2. `backend/routes/featureFlagsRoutes.js` — Business logic in route file
Feature flags routes contain ~100 lines of inline business logic: file I/O, JSON parsing, validation, error handling — all directly in route callbacks. Every other route in the project delegates to a controller.
**Layer:** Route → Controller pattern violated.
**Fix:** Extract to `controllers/featureFlagsController.js`.

### 3. `ai/mcp-feature-flags/server.py` — Cross-boundary file coupling
The Python MCP server writes directly to `backend/features.json`, which the Node.js Express server reads. Two separate processes share state via a flat file with no locking, no API boundary, and no consistency guarantees.
**Layer:** AI layer → Backend data layer (bypasses API boundary).
**Fix:** MCP server should call backend REST API instead of direct file write. Or use a shared database.

### 4. No service layer — controllers call models directly
All three controllers (`userController`, `productController`, `orderController`) import Mongoose models and perform all business logic inline. There is no service/domain layer.
**Layer:** Controller → Model (skipping Service).
**Impact:** Business logic is untestable without HTTP context. Cross-cutting concerns (validation, authorization, audit) are scattered.
**Fix:** For legacy project, document as tech debt. Prioritize extracting pricing logic first.

---

## MEDIUM severity

### 5. Embedded reviews in Product document
Reviews are stored as an embedded subdocument array inside Product. Works at current scale but becomes a bottleneck at 1000+ reviews per product (16MB document limit, write contention).
**Fix:** Document as tech debt. No change needed at current scale.

### 6. Password hashing in Mongoose pre-save hook
`userModel.js` contains bcrypt hashing in a pre-save hook. Mixes data layer with business logic. Makes unit testing harder.
**Fix:** Acceptable pattern for this project size.

### 7. No input validation middleware
No `express-validator` or `joi` middleware. Controllers either validate inline or don't validate at all. Request body shapes are trusted.
**Fix:** Add validation middleware between routes and controllers.

### 8. Feature flags route breaks controller pattern
Inconsistent architecture: feature flags are the only routes with inline logic. All other routes follow `route → controller` pattern.
**Fix:** Create `featureFlagsController.js`.

### 9. Feature flags routes missing auth — security architecture gap
POST `/state` and `/traffic` have no auth middleware. Every other mutation endpoint in the project uses `protect` + `admin` middleware. This is both a security bug and an architectural inconsistency.
**Fix:** Add `protect, admin` middleware.

---

## LOW severity

### 10. Inconsistent error response format
Some controllers `throw new Error()` (caught by express-async-handler → errorMiddleware). Others use `res.status().json()` directly. Mixed patterns.
**Fix:** Standardize on `throw` pattern.

### 11. RAG config hardcodes model names
`ai/rag/config.py` uses hardcoded defaults for model names and Qdrant URL. Dataclass allows overrides but no env var support.
**Fix:** Add `os.environ.get()` fallbacks.

---

## Architecture Diagram (Actual)

```
┌─────────────────────┐     ┌──────────────────────┐
│   React Frontend    │────▶│   Express Backend    │
│   (Redux + Router)  │     │                      │
└─────────────────────┘     │  Routes              │
                            │    ├─ userRoutes      │
┌─────────────────────┐     │    ├─ productRoutes   │
│  MCP Feature Flags  │──┐  │    ├─ orderRoutes     │
│  (Python FastMCP)   │  │  │    ├─ uploadRoutes    │
└─────────────────────┘  │  │    └─ featureFlagRtes │
                         │  │                      │
┌─────────────────────┐  │  │  Controllers          │
│  MCP Search Docs    │  │  │    ├─ userCtrl        │
│  (Python FastMCP)   │  │  │    ├─ productCtrl     │
└─────────────────────┘  │  │    └─ orderCtrl       │
                         │  │                      │
                         │  │  Models (Mongoose)    │
                         │  │    ├─ User            │
                         │  │    ├─ Product         │
                         │  │    └─ Order           │
                         │  └──────────┬───────────┘
                         │             │
                         │    ┌────────▼────────┐
                         │    │    MongoDB       │
                         │    └─────────────────┘
                         │
                         └──▶ backend/features.json
                              (direct file write!)
```

## ADR compliance

No formal ADRs exist in the project. The architecture follows a standard Express MVC pattern (routes → controllers → models) with one exception: feature flags routes bypass the controller layer.

## Status

- ✅ Layer boundary analysis complete
- ✅ Coupling assessment complete
- ✅ Cross-service boundary analysis complete
- ✅ Pattern consistency audit complete
