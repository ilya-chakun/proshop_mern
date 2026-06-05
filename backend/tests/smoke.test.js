// Trivial ESM spec — proves the native-ESM Jest runner is green.
test('ESM jest runner works', () => {
  expect(1 + 1).toBe(2)
})

test('import.meta.url is available (native ESM, no __dirname)', () => {
  expect(typeof import.meta.url).toBe('string')
})
