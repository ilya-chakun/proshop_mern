/**
 * Refactored copy of the legacy cartReducer from frontend/src/reducers/cartReducers.js.
 * This file is intentionally isolated from production code and is expected to preserve
 * the current behavior captured by characterization tests, including awkward behavior.
 */

const CART_ADD_ITEM = 'CART_ADD_ITEM'
const CART_REMOVE_ITEM = 'CART_REMOVE_ITEM'
const CART_SAVE_SHIPPING_ADDRESS = 'CART_SAVE_SHIPPING_ADDRESS'
const CART_SAVE_PAYMENT_METHOD = 'CART_SAVE_PAYMENT_METHOD'
const CART_CLEAR_ITEMS = 'CART_RESET'

const DEFAULT_STATE = { cartItems: [], shippingAddress: {} }

const replaceExistingItem = (cartItems, existingItem, nextItem) =>
  cartItems.map((cartItem) =>
    cartItem.product === existingItem.product ? nextItem : cartItem
  )

const addOrReplaceCartItem = (cartItems, nextItem) => {
  const existingItem = cartItems.find(
    (cartItem) => cartItem.product === nextItem.product
  )

  if (existingItem) {
    return replaceExistingItem(cartItems, existingItem, nextItem)
  }

  return [...cartItems, nextItem]
}

const cartReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
    case CART_ADD_ITEM: {
      const nextItem = action.payload

      return {
        ...state,
        cartItems: addOrReplaceCartItem(state.cartItems, nextItem),
      }
    }
    case CART_REMOVE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter(
          (cartItem) => cartItem.product !== action.payload
        ),
      }
    case CART_SAVE_SHIPPING_ADDRESS:
      return {
        ...state,
        shippingAddress: action.payload,
      }
    case CART_SAVE_PAYMENT_METHOD:
      return {
        ...state,
        paymentMethod: action.payload,
      }
    case CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
      }
    default:
      return state
  }
}

module.exports = {
  cartReducer,
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
  CART_CLEAR_ITEMS,
}
