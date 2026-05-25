# Fix 3 — IDOR: Any Authenticated User Can View/Pay Any Order

## Original Finding

- **Source:** synthesis.md FIX-3
- **File:** `backend/controllers/orderController.js:43,60`
- **Severity:** HIGH (A01 Broken Access Control)
- **Flagged by:** security-mate
- **Description:** `getOrderById` and `updateOrderToPaid` accept any authenticated user accessing any order by ID without verifying ownership. Exposes PII (names, addresses, payment info) and allows unauthorized payment status changes.

## What Changed

Added ownership verification in both `getOrderById` and `updateOrderToPaid`:

```diff
 const getOrderById = asyncHandler(async (req, res) => {
   const order = await Order.findById(req.params.id).populate('user', 'name email')

   if (order) {
+    // Ownership check: only order owner or admin can view
+    if (
+      order.user._id.toString() !== req.user._id.toString() &&
+      !req.user.isAdmin
+    ) {
+      res.status(403)
+      throw new Error('Not authorized to view this order')
+    }
     res.json(order)
```

```diff
 const updateOrderToPaid = asyncHandler(async (req, res) => {
   const order = await Order.findById(req.params.id)

   if (order) {
+    // Ownership check: only order owner or admin can mark as paid
+    if (
+      order.user._id.toString() !== req.user._id.toString() &&
+      !req.user.isAdmin
+    ) {
+      res.status(403)
+      throw new Error('Not authorized to update this order')
+    }
     order.isPaid = true
```

## Why This Approach

- **Standard authorization pattern** — compare `order.user._id` with `req.user._id`, allow admin override
- **403 Forbidden** (not 404) — intentional decision to tell the user they're not authorized rather than hiding the order's existence. Both are valid; 403 is more helpful for debugging while 404 provides slightly better security through obscurity.
- **Admin bypass** — admins need access to all orders for order management (existing `getOrders` endpoint already provides this)
- **`updateOrderToDelivered` not changed** — it already requires `admin` middleware at the route level, so only admins can reach it

## Trade-offs

- The `.populate('user', 'name email')` call in `getOrderById` means `order.user` is a populated object with `_id`, `name`, `email`. The ownership check works correctly because `.populate()` preserves `_id`.
- In `updateOrderToPaid`, `order.user` is NOT populated (no `.populate()` call), so `order.user` is the raw ObjectId. The `.toString()` comparison still works because Mongoose ObjectId has a `.toString()` method.

## Test Status

Characterization tests in `tests/test-fix3-order-idor.js` verify:
1. `getOrderById` ownership check status (before: absent; after: present)
2. `updateOrderToPaid` ownership check status (before: absent; after: present)
3. `getMyOrders` correctly filters by user (no IDOR — uses query filter)
4. Order routes use `protect` middleware (auth required at route level)

## Lessons Learned

Authentication ≠ Authorization. The `protect` middleware ensures the user is logged in, but it doesn't check whether they're allowed to access the specific resource. IDOR vulnerabilities are among the most common web security issues (OWASP A01) precisely because developers often confuse "is logged in" with "is allowed to do this."
