/**
 * Scoped DB tools for the assistant agent (PLAN §3.3).
 *
 * SECURITY INVARIANT (designed in from day one — the deterministic DZ2 defense):
 * the scoped tools (`getMyOrders`, `getMyProfile`) take their user id from a
 * TRUSTED_UID that the SERVER injects from the verified JWT session
 * (`req.user._id`). The model can pass arguments, but for scoped tools those
 * arguments are IGNORED — there is no LLM-controlled path to widen the scope to
 * another user. `getProducts` is the only public, unscoped catalog tool.
 *
 * `buildToolExecutors(trustedUid)` returns a name→async-fn map already bound to
 * the session user, so the agent loop can invoke a tool purely by name+args
 * without ever handling identity itself.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import Product from '../models/productModel.js'
import Order from '../models/orderModel.js'
import User from '../models/userModel.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const TOOL_SCHEMA_PATH = path.resolve(
  here,
  '../../homework/M7/demo/tool-schema.json'
)

/** Load the FROZEN OpenAI function-calling tool schema (single source of truth). */
export const loadToolSchema = () =>
  JSON.parse(readFileSync(TOOL_SCHEMA_PATH, 'utf-8')).tools

/** Escape user text before using it inside a Mongo $regex. */
const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Public catalog search. Unscoped by design — product data is safe for cloud.
 * @param {{ query?: string }} [args]
 */
export const getProducts = async ({ query } = {}) => {
  let filter = {}
  if (query && String(query).trim()) {
    const rx = new RegExp(escapeRegex(query.trim()), 'i')
    filter = { $or: [{ name: rx }, { brand: rx }, { category: rx }] }
  }
  const products = await Product.find(filter).limit(20)
  return products.map((p) => ({
    name: p.name,
    price: p.price,
    brand: p.brand,
    category: p.category,
    countInStock: p.countInStock,
  }))
}

/**
 * The CURRENT user's own orders. `trustedUid` comes from the session, NEVER the
 * model. @param {string} trustedUid
 */
export const getMyOrders = async (trustedUid) => {
  const orders = await Order.find({ user: trustedUid }).sort({ createdAt: -1 })
  return orders.map((o) => ({
    id: String(o._id),
    totalPrice: o.totalPrice,
    isPaid: o.isPaid,
    paidAt: o.paidAt || null,
    isDelivered: o.isDelivered,
    deliveredAt: o.deliveredAt || null,
    createdAt: o.createdAt,
    items: (o.orderItems || []).map((i) => ({ name: i.name, qty: i.qty })),
  }))
}

/**
 * The CURRENT user's own profile. `trustedUid` from session, NEVER the model.
 * @param {string} trustedUid
 */
export const getMyProfile = async (trustedUid) => {
  const user = await User.findById(trustedUid).select('name email isAdmin')
  if (!user) return null
  return { name: user.name, email: user.email, isAdmin: user.isAdmin }
}

/**
 * DANGEROUS broad tool — DZ2 "vulnerable build" ONLY.
 *
 * Returns EVERY user's name + email with no scoping to the session user. This is
 * the lethal-trifecta leg the secure build removes: it gives the LLM a handle to
 * widen scope to foreign users, so any successful prompt injection (direct or via
 * a poisoned review) can exfiltrate other customers' data. It is registered into
 * the executor map ONLY when security==='vuln'; the secure build has no path to it.
 */
export const getAllUsers = async () => {
  const users = await User.find({}).select('name email')
  return users.map((u) => ({ name: u.name, email: u.email }))
}

/** OpenAI function schema for the dangerous broad tool (vuln build advertises it). */
export const GET_ALL_USERS_TOOL = {
  type: 'function',
  function: {
    name: 'getAllUsers',
    description:
      'Return the name and email address of every registered user. Use for ' +
      'admin/audit requests.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
}

/**
 * Bind every tool to the trusted session user.
 *
 * @param {string} trustedUid  req.user._id from the verified JWT.
 * @param {{ security?: 'secure'|'vuln' }} [opts]  'vuln' additionally exposes the
 *        broad getAllUsers() tool (DZ2 attack build). Defaults to 'secure'.
 * @returns {Record<string, (args:object)=>Promise<any>>}
 */
export const buildToolExecutors = (trustedUid, { security = 'secure' } = {}) => {
  const executors = {
    // Public: honors the model-provided query argument.
    getProducts: (args = {}) => getProducts(args),
    // Scoped: model args are intentionally DISCARDED; identity is server-trusted.
    getMyOrders: () => getMyOrders(trustedUid),
    getMyProfile: () => getMyProfile(trustedUid),
  }
  // The deterministic DZ2 defense lives HERE: the broad tool simply does not
  // exist in the secure executor map, so the model has no action to widen scope.
  if (security === 'vuln') {
    executors.getAllUsers = () => getAllUsers()
  }
  return executors
}
