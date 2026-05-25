# Fix 2 — Feature Flags Mutation Endpoints Missing Authentication

## Original Finding

- **Source:** synthesis.md FIX-2
- **File:** `backend/routes/featureFlagsRoutes.js:50`
- **Severity:** HIGH (A01 Broken Access Control)
- **Flagged by:** security-mate, architecture-mate, performance-mate (triple-flagged)
- **Description:** POST `/api/feature-flags/state` and POST `/api/feature-flags/traffic` have no authentication middleware. Any anonymous client can change feature flag states and traffic percentages.

## What Changed

1. Added auth middleware import
2. Added `protect, admin` middleware to both POST routes

```diff
 import express from 'express'
 import fs from 'node:fs/promises'
 import path from 'node:path'
 import { fileURLToPath } from 'node:url'
+import { protect, admin } from '../middleware/authMiddleware.js'

-router.post('/state', async (req, res, next) => {
+router.post('/state', protect, admin, async (req, res, next) => {

-router.post('/traffic', async (req, res, next) => {
+router.post('/traffic', protect, admin, async (req, res, next) => {
```

## Why This Approach

- **Consistent with project patterns** — every other mutation endpoint (user, product, order) uses `protect` + `admin` middleware
- **Minimal change** — 3 lines added, zero lines removed
- **No new dependencies** — uses existing `authMiddleware.js`
- **GET routes left public** — reading feature flag status is non-sensitive and needed by the frontend without auth

## Trade-offs

- The MCP feature-flags server (`ai/mcp-feature-flags/server.py`) writes directly to `backend/features.json` via file I/O, bypassing the Express API entirely. This fix does NOT affect the MCP server's ability to change flags — it only protects the HTTP API endpoint.
- If a future admin dashboard uses the HTTP API to manage flags, it will now need to send a valid JWT token with admin privileges.

## Test Status

Characterization tests in `tests/test-fix2-feature-flags-auth.js` verify:
1. GET / route exists and is public
2. POST /state route configuration (before: no protect; after: has protect)
3. POST /traffic route configuration (before: no protect; after: has protect)
4. Auth middleware import status

## Lessons Learned

This was the easiest fix (10 minutes, 3 lines) but had the highest real-world impact — it's an endpoint that allows changing application behavior for all users. The root cause was likely that the feature flags routes were added later (M5 homework) and the developer forgot to add auth middleware since the MCP server was the primary consumer and it uses direct file access anyway.
