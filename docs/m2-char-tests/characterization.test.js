const {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
  CART_CLEAR_ITEMS,
} = require('./original')
const { cartReducer: originalCartReducer } = require('./original')
const { cartReducer: refactoredCartReducer } = require('./refactored')

const runSharedCharacterizationTests = (implementation) => {
  test('returns the default state for an unknown action when state is undefined', () => {
    expect(implementation(undefined, { type: 'SOMETHING_ELSE' })).toEqual({
      cartItems: [],
      shippingAddress: {},
    })
  })

  test('returns the exact same state object for an unknown action', () => {
    const state = { cartItems: [], shippingAddress: { city: 'Kyiv' } }

    expect(implementation(state, { type: 'NO_OP' })).toBe(state)
  })

  test('appends a new cart item when the product is not already present', () => {
    const state = { cartItems: [], shippingAddress: {} }
    const item = { product: 'p1', qty: 1, name: 'Mouse' }

    expect(implementation(state, { type: CART_ADD_ITEM, payload: item })).toEqual(
      {
        cartItems: [item],
        shippingAddress: {},
      }
    )
  })

  test('replaces an existing cart item when the product id matches', () => {
    const state = {
      cartItems: [
        { product: 'p1', qty: 1, name: 'Mouse' },
        { product: 'p2', qty: 2, name: 'Keyboard' },
      ],
      shippingAddress: {},
    }
    const replacement = { product: 'p1', qty: 5, name: 'Mouse' }

    expect(
      implementation(state, { type: CART_ADD_ITEM, payload: replacement })
    ).toEqual({
      cartItems: [replacement, { product: 'p2', qty: 2, name: 'Keyboard' }],
      shippingAddress: {},
    })
  })

  test('drops extra fields from the previous item during replacement', () => {
    const state = {
      cartItems: [{ product: 'p1', qty: 1, name: 'Mouse', promo: 'SAVE10' }],
      shippingAddress: {},
    }
    const replacement = { product: 'p1', qty: 3, name: 'Mouse' }

    // This asserts current buggy behavior. Correct behavior would probably be: merge or preserve meaningful fields.
    expect(
      implementation(state, { type: CART_ADD_ITEM, payload: replacement })
    ).toEqual({
      cartItems: [replacement],
      shippingAddress: {},
    })
  })

  test('removes only the matching product id', () => {
    const state = {
      cartItems: [
        { product: 'p1', qty: 1 },
        { product: 'p2', qty: 2 },
      ],
      shippingAddress: {},
    }

    expect(
      implementation(state, { type: CART_REMOVE_ITEM, payload: 'p1' })
    ).toEqual({
      cartItems: [{ product: 'p2', qty: 2 }],
      shippingAddress: {},
    })
  })

  test('replaces the shipping address payload as-is', () => {
    const state = { cartItems: [], shippingAddress: { city: 'Lviv' } }
    const shippingAddress = { city: 'Odesa', postalCode: '65000' }

    expect(
      implementation(state, {
        type: CART_SAVE_SHIPPING_ADDRESS,
        payload: shippingAddress,
      })
    ).toEqual({
      cartItems: [],
      shippingAddress,
    })
  })

  test('adds paymentMethod even though it is not present in the default state shape', () => {
    const state = { cartItems: [], shippingAddress: {} }

    // This asserts current awkward behavior. Correct behavior would probably be: keep one explicit default state shape everywhere.
    expect(
      implementation(state, {
        type: CART_SAVE_PAYMENT_METHOD,
        payload: 'PayPal',
      })
    ).toEqual({
      cartItems: [],
      shippingAddress: {},
      paymentMethod: 'PayPal',
    })
  })

  test('clears only cart items and keeps checkout metadata', () => {
    const state = {
      cartItems: [{ product: 'p1', qty: 1 }],
      shippingAddress: { city: 'Dnipro' },
      paymentMethod: 'PayPal',
    }

    expect(implementation(state, { type: CART_CLEAR_ITEMS })).toEqual({
      cartItems: [],
      shippingAddress: { city: 'Dnipro' },
      paymentMethod: 'PayPal',
    })
  })

  test('throws when action is undefined', () => {
    // This asserts current buggy behavior. Correct behavior would probably be: a defensive default action object.
    expect(() => implementation(undefined, undefined)).toThrow(
      "Cannot read properties of undefined (reading 'type')"
    )
  })

  test('throws when CART_ADD_ITEM receives a null state', () => {
    expect(() =>
      implementation(null, {
        type: CART_ADD_ITEM,
        payload: { product: 'p1', qty: 1 },
      })
    ).toThrow("Cannot read properties of null (reading 'cartItems')")
  })
}

describe('original behavior', () => {
  runSharedCharacterizationTests(originalCartReducer)
})

describe('refactored behavior', () => {
  runSharedCharacterizationTests(refactoredCartReducer)
})
