/**
 * Deterministic, CPU-only PII + private-intent detection (PLAN §3.2).
 *
 * Zero dependencies, no GPU, fully reproducible — this is precisely what lets
 * the privacy ROUTER run "light" and behave identically in mock and live modes.
 *
 *   detectPII(message) -> Array<{ type, value, masked }>
 *   type ∈ 'email' | 'phone' | 'card' | 'postal' | 'intent'
 *
 * NAMES are intentionally NOT caught here (a documented regex miss). The
 * optional Presidio service (Stretch, T2.3) covers names over HTTP when
 * PRESIDIO_URL is set; the route logic is unchanged either way.
 */

/** Mask a matched value so logs never re-leak what routing just protected. */
export const maskValue = (value, type) => {
  const s = String(value)
  if (type === 'email') {
    const [user, domain] = s.split('@')
    if (!domain) return '***'
    return `${user.slice(0, 1)}***@${domain}`
  }
  if (type === 'intent') return s.toLowerCase()
  const digits = s.replace(/\D/g, '')
  return digits.length >= 4 ? `***${digits.slice(-4)}` : '***'
}

/** Luhn checksum — rejects random digit runs, accepts real card numbers. */
export const luhnValid = (input) => {
  const d = String(input).replace(/\D/g, '')
  if (d.length < 13 || d.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
// Phones WITH separators (never bare digit runs) so they can't overlap cards.
const PHONE_RES = [
  /(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, // 415-555-0132 · (415) 555-0132 · +1 415 555 0132
  /\+\d{1,3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, // +7 999 123 45 67
]
// Candidate card: 13–19 digits, optionally grouped by single spaces/dashes.
const CARD_CANDIDATE_RE = /\b(?:\d[ -]?){13,19}\b/g
// Standalone 5-digit (US ZIP, optionally +4). Conservative to limit false hits.
const POSTAL_RE = /\b\d{5}(?:-\d{4})?\b/g
// Private-data INTENT: no literal PII, but the answer pulls the user's OWN data.
const INTENT_RES = [
  {
    re: /\bmy\s+(order|orders|receipt|receipts|profile|account|address|email|phone|card|payment)\b/gi,
    label: 'my-data',
  },
  { re: /\bwhere\s+is\s+my\b/gi, label: 'order-status' },
  { re: /\b(track|cancel|return|resend)\s+my\b/gi, label: 'order-action' },
]

/**
 * @param {string} message
 * @returns {Array<{type:string, value:string, masked:string}>}
 */
export const detectPII = (message = '') => {
  const text = String(message)
  let work = text // mutable copy; matched spans are blanked so detectors don't overlap
  const matches = []

  const consume = (value) => {
    const idx = work.indexOf(value)
    if (idx >= 0) {
      work =
        work.slice(0, idx) +
        ' '.repeat(value.length) +
        work.slice(idx + value.length)
    }
  }
  const add = (type, value) => {
    matches.push({ type, value, masked: maskValue(value, type) })
    consume(value)
  }

  // 1. email (highest precedence)
  for (const m of text.matchAll(EMAIL_RE)) add('email', m[0])
  // 2. card (Luhn-checked) on remaining text
  for (const m of work.matchAll(CARD_CANDIDATE_RE)) {
    if (luhnValid(m[0])) add('card', m[0].trim())
  }
  // 3. phone
  for (const re of PHONE_RES) {
    for (const m of work.matchAll(re)) add('phone', m[0].trim())
  }
  // 4. postal
  for (const m of work.matchAll(POSTAL_RE)) add('postal', m[0])
  // 5. private-data intent (scanned on original text; keyword-only, no span consume)
  for (const { re, label } of INTENT_RES) {
    for (const m of text.matchAll(re)) {
      matches.push({ type: 'intent', value: m[0].trim(), masked: label })
    }
  }
  return matches
}
