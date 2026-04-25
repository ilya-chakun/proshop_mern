# 0002: Use Redux with thunk and localStorage for shared client state

- Status: accepted
- Date: 2026-04-25
- Confidence: HIGH

## Context and Problem Statement

The frontend needs shared state across many screens: product lists and details, cart contents, logged-in user data, shipping address, payment method, and order workflows. The current code shows both asynchronous API calls and state that must survive page reloads during checkout.

## Decision Drivers

- Share state across many React Router screens without prop drilling.
- Support async REST calls from the UI.
- Persist selected client state across reloads, especially cart and checkout data.

## Considered Options

- Redux with thunk middleware and selective `localStorage` persistence.
- React-only local component state.
- A different global state library.

## Decision Outcome

Chosen option: the frontend uses a centralized Redux store with `combineReducers`, async action creators powered by `redux-thunk`, and `localStorage` persistence for cart, shipping address, payment method, and logged-in user information.

## Consequences

### Positive

- Gives the app one predictable place for shared client state.
- Supports async API workflows with established legacy patterns.
- Keeps checkout and login state available after reloads.

### Negative

- Adds boilerplate across constants, actions, reducers, and store setup.
- Requires manual synchronization between Redux state and `localStorage`.
- Increases coupling between screens and the global store shape.

## Evidence in Code

- `frontend/src/store.js` builds a Redux store with `createStore`, `combineReducers`, `redux-thunk`, and `composeWithDevTools`.
- `frontend/src/actions/*.js` files call the API with `axios` and dispatch request, success, and fail actions.
- `frontend/src/actions/cartActions.js` and `frontend/src/actions/userActions.js` save state to `localStorage`.
- `frontend/src/store.js` rehydrates `cartItems`, `userInfo`, `shippingAddress`, and `paymentMethod` from `localStorage`.
