// M2 (T2.1) acceptance: table-driven detector tests, ≥20 cases (PII vs clean),
// plus the Luhn unit and masking checks. Names are asserted as a regex MISS.

import { detectPII, luhnValid, maskValue } from '../assistant/pii.js'

const hasType = (msg, type) => detectPII(msg).some((m) => m.type === type)

describe('luhnValid', () => {
  test('accepts the canonical test card', () => {
    expect(luhnValid('4111 1111 1111 1111')).toBe(true)
    expect(luhnValid('4111111111111111')).toBe(true)
  })
  test('rejects a near-miss and too-short numbers', () => {
    expect(luhnValid('4111 1111 1111 1112')).toBe(false)
    expect(luhnValid('1234')).toBe(false)
  })
})

describe('detectPII — table-driven (PII positives)', () => {
  const PII_CASES = [
    ['email', 'My email is jane@example.com', 'email'],
    ['email w/ plus', 'contact me at john+shop@mail.co.uk', 'email'],
    ['phone US dash', 'call 415-555-0132 please', 'phone'],
    ['phone US dot', 'number 415.555.0132', 'phone'],
    ['phone US paren', 'reach (415) 555-0132', 'phone'],
    ['phone intl +1', 'my cell +1 415 555 0132', 'phone'],
    ['phone RU', 'позвоните +7 999 123 45 67', 'phone'],
    ['card spaced', 'card 4111 1111 1111 1111 saved?', 'card'],
    ['card plain', 'is 4111111111111111 on file', 'card'],
    ['card dashed', 'use 4111-1111-1111-1111', 'card'],
    ['postal zip', 'ship to 94016 today', 'postal'],
    ['postal zip+4', 'zip 94016-1234', 'postal'],
    ['intent my order', 'where is my order', 'intent'],
    ['intent my profile', 'show my profile email', 'intent'],
    ['intent my receipt', 'resend my receipt', 'intent'],
    ['intent track', 'track my package', 'intent'],
  ]
  test.each(PII_CASES)('%s -> detects %s', (_label, msg, type) => {
    expect(hasType(msg, type)).toBe(true)
  })
})

describe('detectPII — clean catalog questions (no PII)', () => {
  const CLEAN = [
    'Do you have the Airpods in stock?',
    "What's the price of the Sony Playstation 4 Pro?",
    'Tell me about the Logitech gaming mouse.',
    'Is the iPhone available?',
    'Which model came out in 2020?',
    'How many Echo Dot units are left?',
  ]
  test.each(CLEAN)('clean: %s', (msg) => {
    expect(detectPII(msg)).toHaveLength(0)
  })

  test('a non-Luhn 16-digit run is NOT flagged as a card', () => {
    expect(hasType('order 4111 1111 1111 1112 reference', 'card')).toBe(false)
  })

  test('a bare name is a documented MISS (no Presidio)', () => {
    expect(detectPII('where is John Smith order')).toHaveLength(0)
  })
})

describe('maskValue — never re-leak protected values', () => {
  test('email keeps only first char + domain', () => {
    expect(maskValue('jane@example.com', 'email')).toBe('j***@example.com')
  })
  test('card/phone keep only last 4 digits', () => {
    expect(maskValue('4111 1111 1111 1111', 'card')).toBe('***1111')
    expect(maskValue('415-555-0132', 'phone')).toBe('***0132')
  })
})
