# Backend tests — ESM + Jest notes (READ BEFORE WRITING SPECS)

This project is `"type": "module"`, so backend Jest runs in **native ESM** mode via:

```
node --experimental-vm-modules node_modules/.bin/jest
```

(wired as `npm test` at repo root; config in `jest.config.json`, `transform: {}` so no Babel).

## Hard ESM-Jest constraints (cost real debugging time if forgotten)

1. **`jest.mock()` is a NO-OP under `--experimental-vm-modules`.**
   To mock an ES module you MUST use:
   ```js
   import { jest } from '@jest/globals'
   jest.unstable_mockModule('../assistant/providers/ollama.js', () => ({ default: ... }))
   const { thing } = await import('../assistant/thing.js') // dynamic import AFTER the mock
   ```
   Static `import` of the unit-under-test BEFORE the mock will bind the real module.

2. **No `__dirname` / `require`.** Use `import.meta.url` +
   `fileURLToPath`. Do not add `require()` anywhere in backend.

3. **The `connectDB` guard must be code-level (env check), NOT jest-mocked.**
   Because (1) makes module mocking unreliable, importing `app` must avoid Mongo by
   checking `process.env.NODE_ENV === 'test'` inside the code itself (see `server.js`).

4. **`jest` global** is not auto-injected in ESM — import it: `import { jest } from '@jest/globals'`.

## Conventions
- Specs live in `backend/tests/**/*.test.js`.
- Use `mongodb-memory-server` for DB tests; pin `MONGOMS_VERSION` (see `.env.example`,
  6.0.14 verified on Node 26 / arm64).
- Set `process.env.NODE_ENV = 'test'` at the top of any spec that imports `app`/`server.js`.
