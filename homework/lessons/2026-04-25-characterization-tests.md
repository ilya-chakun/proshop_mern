# Lesson Log — 2026-04-25 Characterization Tests

## Task name

Nice-to-have NH-3: characterization tests for one legacy function.

## Selected function

- `cartReducer`
- Source: `frontend/src/reducers/cartReducers.js`

## Files inspected

- `package.json`
- `frontend/package.json`
- `FINDINGS.md`
- `docs/report.md`
- `frontend/src/reducers/cartReducers.js`
- `frontend/src/reducers/orderReducers.js`
- `frontend/src/reducers/productReducers.js`
- `frontend/src/reducers/userReducers.js`
- `frontend/src/actions/cartActions.js`
- `frontend/src/store.js`
- backend controllers for comparison during function selection

## Files created

- `docs/m2-char-tests/original.js`
- `docs/m2-char-tests/characterization.test.js`
- `docs/m2-char-tests/refactored.js`
- `docs/m2-char-tests/reflection.md`

## Test command and result

- Attempted first: `CI=true npm test --prefix frontend -- --watchAll=false --runInBand --runTestsByPath ../docs/m2-char-tests/characterization.test.js`
  - Result: failed because the CRA Jest wrapper did not include tests outside `frontend/`
- Final command: `./frontend/node_modules/.bin/jest docs/m2-char-tests/characterization.test.js --runInBand`
  - Result: passed

## Follow-up notes

- The reducer was a good characterization candidate because it is pure, branchy, and independent from database/browser setup.
- The captured weird behavior includes dropped extra item fields during replacement and runtime throws for some malformed inputs.
- The experiment stayed isolated in docs so the real app behavior was not touched.
