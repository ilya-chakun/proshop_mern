# Characterization Test Reflection

## Selected function

- **Source file path:** `frontend/src/reducers/cartReducers.js`
- **Source function/component name:** `cartReducer`
- **Why it was selected:** it is real project code, small enough for an isolated experiment, has several visible branches, and can be exercised with plain Jest without a browser, database, or network calls.

## What behavior was captured

- **Happy path:** adding a new cart item, replacing an existing item, removing an item, saving shipping data, saving a payment method, and clearing cart items.
- **Edge cases:** default state creation, unknown actions returning the same state object, null state during add-item handling, and `undefined` action input.
- **Buggy/weird current behavior:**
  - replacing an existing cart item drops any extra fields from the prior item instead of preserving or merging them;
  - `paymentMethod` is added later even though it is not part of the reducer's default state shape;
  - calling the reducer with an `undefined` action throws a runtime error instead of failing gracefully.

## Refactoring summary

The refactor kept the reducer isolated and behavior-preserving, but split the add/replace logic into smaller helpers with clearer names: `replaceExistingItem` and `addOrReplaceCartItem`. It also introduced a named `DEFAULT_STATE` constant so the reducer shape is easier to read.

What intentionally did **not** change: the action type strings, replacement semantics, thrown runtime errors, default-state shape mismatch around `paymentMethod`, and the cart-clearing behavior that preserves checkout metadata.

## Test result

- **First attempted command:** `CI=true npm test --prefix frontend -- --watchAll=false --runInBand --runTestsByPath ../docs/m2-char-tests/characterization.test.js`
- **First attempt result:** failed because the Create React App Jest wrapper only searched within `frontend/` and would not pick up a test file stored under the required `docs/` experiment folder.
- **Working command used:** `./frontend/node_modules/.bin/jest docs/m2-char-tests/characterization.test.js --runInBand`
- **Result:** pass — 22 tests passed across the original and refactored implementations.

## Lessons learned

Characterization tests are useful because they turn an uncertain legacy behavior into something explicit and reviewable. Instead of guessing what the reducer *should* do, the tests freeze what it *actually* does today, including awkward state-shape inconsistencies and brittle runtime failures. That gives a refactoring effort a reliable safety rail.

This experiment also showed that isolated copies are a practical way to teach or demonstrate the pattern without risking production behavior. By keeping the experiment under `docs/m2-char-tests/`, it was possible to show the full cycle — copy, characterize, refactor, verify — while leaving the real application untouched.

## Safety note

- Production code was not changed.
- No secrets were added.
- `.env` was not committed.
