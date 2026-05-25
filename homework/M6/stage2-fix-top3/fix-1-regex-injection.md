# Fix 1 — NoSQL Injection via Unsanitized Regex in Product Search

## Original Finding

- **Source:** synthesis.md FIX-1
- **File:** `backend/controllers/productController.js:14`
- **Severity:** HIGH (A03 Injection)
- **Flagged by:** security-mate
- **Description:** User-supplied `req.query.keyword` passed directly to MongoDB `$regex` without escaping special regex characters. Enables ReDoS attacks and regex injection.

## What Changed

Added `escapeRegex()` helper function that escapes all special regex characters (`.*+?^${}()|[]\`) before passing user input to MongoDB `$regex`.

```diff
+const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
+
 const getProducts = asyncHandler(async (req, res) => {
   const keyword = req.query.keyword
     ? {
         name: {
-          $regex: req.query.keyword,
+          $regex: escapeRegex(req.query.keyword),
           $options: 'i',
         },
       }
```

## Why This Approach

- **Minimal change** — single helper function, one-line call-site change
- **No new dependencies** — uses built-in `String.prototype.replace`
- **Standard pattern** — this is the recommended approach from the MongoDB documentation for user-supplied regex input
- **Alternative considered:** switching to `$text` index search would be more performant but requires schema changes and index creation — too large a change for this fix

## Trade-offs

- Users can no longer use regex patterns in search (e.g., `phone|tablet`) — this is acceptable since end users don't expect regex search in an e-commerce product search
- Exact substring matching still works as before

## Test Status

Characterization tests in `tests/test-fix1-regex-injection.js` verify:
1. Normal keyword search works (before and after)
2. Special chars `.*` are escaped after fix
3. Empty keyword returns empty filter (before and after)
4. ReDoS payload `(a+)+$` is escaped after fix

## Lessons Learned

The fix is trivial (3 lines) but the vulnerability is severe — it's a reminder that any user input reaching a regex engine needs escaping. MongoDB's `$regex` is particularly dangerous because it runs server-side and can cause the database to hang on ReDoS payloads.
