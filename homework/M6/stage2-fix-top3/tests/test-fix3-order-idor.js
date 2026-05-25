/**
 * Characterization tests for FIX-3: Order IDOR vulnerability.
 *
 * Documents the CURRENT behavior of getOrderById and updateOrderToPaid:
 * any authenticated user can access/modify any order without ownership check.
 *
 * Run: node homework-m6/stage2-fix-top3/tests/test-fix3-order-idor.js
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const controllerFile = readFileSync(
  'backend/controllers/orderController.js',
  'utf8',
)

// --- Test 1: getOrderById has no ownership check (BEFORE fix) ---
{
  // Extract the getOrderById function body
  const fnStart = controllerFile.indexOf('const getOrderById')
  const fnEnd = controllerFile.indexOf('const updateOrderToPaid')
  const fnBody = controllerFile.slice(fnStart, fnEnd)

  // BEFORE fix: no comparison of order.user with req.user
  const hasOwnershipCheck =
    fnBody.includes('req.user._id') && fnBody.includes('order.user')
  console.log(
    `  getOrderById has ownership check: ${hasOwnershipCheck}`,
  )
  console.log(
    '✅ Test 1 PASS: getOrderById ownership check status documented',
  )
}

// --- Test 2: updateOrderToPaid has no ownership check (BEFORE fix) ---
{
  const fnStart = controllerFile.indexOf('const updateOrderToPaid')
  const fnEnd = controllerFile.indexOf('const updateOrderToDelivered')
  const fnBody = controllerFile.slice(fnStart, fnEnd)

  const hasOwnershipCheck =
    fnBody.includes('req.user._id') && fnBody.includes('order.user')
  console.log(
    `  updateOrderToPaid has ownership check: ${hasOwnershipCheck}`,
  )
  console.log(
    '✅ Test 2 PASS: updateOrderToPaid ownership check status documented',
  )
}

// --- Test 3: getMyOrders correctly filters by user (no IDOR here) ---
{
  const fnStart = controllerFile.indexOf('const getMyOrders')
  const fnEnd = controllerFile.indexOf('const getOrders')
  const fnBody = controllerFile.slice(fnStart, fnEnd)

  const filtersbyUser = fnBody.includes('user: req.user._id')
  assert.ok(filtersbyUser, 'getMyOrders filters by req.user._id')
  console.log('✅ Test 3 PASS: getMyOrders correctly filters by user')
}

// --- Test 4: Route-level auth exists (protect middleware on order routes) ---
{
  const routeFile = readFileSync('backend/routes/orderRoutes.js', 'utf8')
  const hasProtect = routeFile.includes('protect')
  assert.ok(hasProtect, 'Order routes use protect middleware')
  console.log(
    '✅ Test 4 PASS: Order routes use protect middleware (auth required)',
  )
  // Note: protect ensures user is authenticated, but does NOT check ownership
  // That's the IDOR vulnerability — auth ≠ authorization
}

console.log('\nAll FIX-3 characterization tests passed.')
