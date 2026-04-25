# 0003: Use JWT bearer authentication with route-level role middleware

- Status: accepted
- Date: 2026-04-25
- Confidence: HIGH

## Context and Problem Statement

The application has both customer-only and admin-only capabilities, including profile management, order history, user administration, product administration, delivery updates, and image upload. The current backend and frontend code show an authentication model based on tokens rather than server-side sessions.

## Decision Drivers

- Protect private API routes without introducing server session storage.
- Distinguish normal authenticated users from admins.
- Keep the authorization pattern reusable across many routes.

## Considered Options

- JWT bearer tokens verified by middleware, with a separate admin guard.
- Server-side session authentication.
- Per-controller authorization checks without shared middleware.

## Decision Outcome

Chosen option: users receive a signed JWT after login or registration, the frontend sends it in the `Authorization` header, `protect` middleware verifies the token and loads the user, and `admin` middleware blocks routes that require administrator privileges.

## Consequences

### Positive

- Keeps API authentication stateless on the server.
- Centralizes authorization checks in reusable middleware.
- Makes admin-only routes explicit in route definitions.

### Negative

- Frontend code must manage token storage and request headers carefully.
- Token invalidation is less immediate than server-side session revocation.
- Security depends on correct handling of `JWT_SECRET` and client-side storage.

## Evidence in Code

- `backend/utils/generateToken.js` signs JWTs with `process.env.JWT_SECRET`.
- `backend/controllers/userController.js` returns a token from both login and registration flows.
- `backend/middleware/authMiddleware.js` verifies bearer tokens and loads the user record.
- `backend/routes/productRoutes.js`, `userRoutes.js`, `orderRoutes.js`, and `uploadRoutes.js` compose `protect` and `admin` on private endpoints.
- `frontend/src/actions/productActions.js`, `userActions.js`, and `orderActions.js` attach `Authorization: Bearer ${userInfo.token}` to protected API requests.
