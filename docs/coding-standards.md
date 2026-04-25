# JavaScript Coding Standards — ProShop MERN

## 1. Purpose

This project is a **legacy JavaScript MERN application**. It stays JavaScript —
do not convert it to TypeScript unless explicitly requested. These standards
encourage strong typing discipline and safe coding within plain JS.

See also: `AGENTS.md` for agent workflow rules.

## 2. Strong Typing Discipline in JavaScript

### JSDoc

Add JSDoc comments to non-trivial functions, middleware, service methods, and
shared data shapes. This helps editors provide autocompletion and catches
misuse early.

```js
/**
 * Find a product by its MongoDB ObjectId.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const getProductById = asyncHandler(async (req, res) => { /* … */ })
```

For shared shapes that appear in multiple files, document them once in a
comment block near the relevant model or constant file:

```js
/**
 * @typedef {Object} OrderItem
 * @property {string} name
 * @property {number} qty
 * @property {string} image
 * @property {number} price
 * @property {string} product - Product ObjectId
 */
```

### Explicit Checks Over Implicit Coercion

```js
// Prefer
if (product === undefined) { … }
const page = Number(req.query.pageNumber) || 1

// Avoid
if (!product) { … }  // falsy catches 0, '', null — often unintended
```

### Runtime Validation

Validate external input (request bodies, route params, query strings,
environment variables) at the boundary where it enters the application:

```js
if (!req.body.name || typeof req.body.name !== 'string') {
  res.status(400)
  throw new Error('Name is required')
}
```

For environment variables, fail fast at startup:

```js
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}
```

## 3. Backend JavaScript Standards

- Use **ES Module** syntax (`import`/`export`). Do not use `require`.
- Wrap route handlers with `express-async-handler` (existing pattern).
- Use existing `@desc / @route / @access` comment style for controllers.
  Extend with JSDoc `@param`/`@returns` for non-trivial logic.
- Mongoose schemas already define field types and `required` — treat them as
  the backend data contract. Keep schemas in sync with what controllers expect.
- Use `async/await` consistently. Do not mix `.then()` callbacks in the same
  function.
- Prefer small, focused functions. Extract repeated logic into helpers in
  `backend/utils/`.

## 4. Frontend JavaScript / React Standards

- The project uses **React 16 class-style functional components** with hooks
  (`useState`, `useEffect`, `useSelector`, `useDispatch`).
- Redux action types are already defined as named constants in
  `frontend/src/constants/`. Continue this pattern — do not use inline strings
  for action types.
- The project does **not** currently use PropTypes. Adding PropTypes to new or
  modified components is acceptable but optional — do not add a new dependency
  for this.
- Keep component files focused: one exported component per file.
- Destructure props and Redux state at the top of the component for clarity.

## 5. API and Data Contracts

- All API routes live under `/api/` (products, users, orders, upload).
- Error responses should always include `{ message: string }`.
- Success responses should be JSON. Keep the shape consistent within each
  resource (e.g., product list returns `{ products, page, pages }`).
- When adding new fields to a response, update the corresponding Mongoose
  model and document the shape with JSDoc or a comment.

## 6. Error Handling

- Use `express-async-handler` wrappers — do not add raw `try/catch` in
  controllers unless you need custom recovery logic.
- Do **not** swallow errors silently. If you catch, either re-throw or
  respond with an appropriate status code and message.
- Avoid unhandled promise rejections. Every `async` call should be awaited
  or have a `.catch()`.
- Frontend actions already follow a `REQUEST / SUCCESS / FAIL` pattern.
  Always dispatch `FAIL` with a meaningful error message.

## 7. Environment Variables and Secrets

- **`.env` must never be committed.** It is in `.gitignore`.
- **`.env.example`** must contain only safe placeholder values.
- Access env vars through `process.env` and validate at startup.
- Do not hard-code secrets, tokens, passwords, or database URIs in source code.

## 8. Refactoring Rules

- **No big-bang refactors.** Improve code incrementally when you touch a file.
- **No dependency upgrades** unless directly required by a fix or finding.
- **No TypeScript conversion** unless explicitly requested.
- **No framework migrations** (e.g., switching from Redux to another state
  manager).
- When refactoring, keep changes small and reviewable — this is a public
  homework fork.

## 9. What to Avoid

- Magic strings and magic numbers — use named constants.
- Loosely shaped objects passed across module boundaries without documentation.
- Implicit type coercion in conditionals (prefer `=== undefined` over `!val`).
- Mixing `async/await` with `.then()` chains in the same function.
- Committing `console.log` debugging statements to production code.
- Adding new dependencies without explicit justification.

## 10. Checklist Before Committing Code Changes

- [ ] New or modified functions have JSDoc if they are non-trivial.
- [ ] External input is validated at the boundary.
- [ ] No secrets, tokens, or passwords in committed files.
- [ ] Error paths return a proper status code and message.
- [ ] No unhandled promise rejections.
- [ ] Constants are used instead of magic strings/numbers.
- [ ] Changes are small, focused, and reviewable.
- [ ] `npm run dev` still starts without errors (if you can test locally).
