/**
 * Characterization tests for FIX-1: Regex injection in product search.
 *
 * These tests document the CURRENT (vulnerable) behavior of getProducts
 * where req.query.keyword is passed directly to MongoDB $regex.
 *
 * Run: node --experimental-vm-modules homework-m6/stage2-fix-top3/tests/test-fix1-regex-injection.js
 */
import assert from 'node:assert/strict'

// Simulate the CURRENT vulnerable regex construction
function buildKeywordFilter_BEFORE(keyword) {
  if (!keyword) return {}
  return { name: { $regex: keyword, $options: 'i' } }
}

// Simulate the FIXED regex construction
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildKeywordFilter_AFTER(keyword) {
  if (!keyword) return {}
  return { name: { $regex: escapeRegex(keyword), $options: 'i' } }
}

// --- Test 1: Normal keyword search (works before and after fix) ---
{
  const filter = buildKeywordFilter_BEFORE('phone')
  assert.deepStrictEqual(filter, { name: { $regex: 'phone', $options: 'i' } })
  const filterAfter = buildKeywordFilter_AFTER('phone')
  assert.deepStrictEqual(filterAfter, { name: { $regex: 'phone', $options: 'i' } })
  console.log('✅ Test 1 PASS: Normal keyword search works')
}

// --- Test 2: Special regex chars passed through (VULNERABLE behavior) ---
{
  const malicious = '.*'
  const filter = buildKeywordFilter_BEFORE(malicious)
  // BEFORE fix: regex special chars pass through — matches ALL products
  assert.deepStrictEqual(filter, { name: { $regex: '.*', $options: 'i' } })
  console.log('✅ Test 2 PASS: Special chars ".*" pass through unescaped (vulnerable)')

  // AFTER fix: special chars are escaped
  const filterAfter = buildKeywordFilter_AFTER(malicious)
  assert.deepStrictEqual(filterAfter, { name: { $regex: '\\.\\*', $options: 'i' } })
  console.log('✅ Test 2b PASS: After fix, ".*" is escaped to "\\.\\*"')
}

// --- Test 3: Empty keyword returns empty filter ---
{
  const filter = buildKeywordFilter_BEFORE('')
  assert.deepStrictEqual(filter, {})
  const filterAfter = buildKeywordFilter_AFTER('')
  assert.deepStrictEqual(filterAfter, {})
  console.log('✅ Test 3 PASS: Empty keyword returns empty filter')
}

// --- Test 4: ReDoS payload is neutralized after fix ---
{
  const redos = '(a+)+$'
  const filter = buildKeywordFilter_BEFORE(redos)
  // BEFORE: raw regex groups pass through — potential ReDoS
  assert.deepStrictEqual(filter, { name: { $regex: '(a+)+$', $options: 'i' } })
  console.log('✅ Test 4 PASS: ReDoS payload passes through unescaped (vulnerable)')

  const filterAfter = buildKeywordFilter_AFTER(redos)
  assert.deepStrictEqual(filterAfter, {
    name: { $regex: '\\(a\\+\\)\\+\\$', $options: 'i' },
  })
  console.log('✅ Test 4b PASS: After fix, ReDoS payload is escaped')
}

console.log('\nAll FIX-1 characterization tests passed.')
