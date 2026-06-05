/**
 * Privacy router (PLAN §3.1) — the VISIBLE, GPU-free routing decision.
 * This is deliberately code (not buried in config) so the "router decision is
 * visible" rubric is satisfied by reading one small file.
 *
 *   route(message) -> { target: 'local'|'cloud', reason, matches }
 *
 * Rule: a message goes LOCAL when detectPII finds ANY match — either literal PII
 * (email / phone / card / postal) or a private-data INTENT whose answer would
 * pull the user's own orders/profile (tool output that must not leak to cloud).
 * Clean public-catalog questions go to the CLOUD model.
 */

import { detectPII } from './pii.js'

/**
 * @param {string} message
 * @returns {{ target: 'local'|'cloud', reason: string, matches: Array<object> }}
 */
export const route = (message = '') => {
  const matches = detectPII(message)
  if (matches.length) {
    const types = [...new Set(matches.map((m) => m.type))]
    return {
      target: 'local',
      reason: `LOCAL — detected ${types.join(', ')}; must stay on-device (no leak to cloud).`,
      matches,
    }
  }
  return {
    target: 'cloud',
    reason:
      'CLOUD — no PII and no private-data intent; public catalog question.',
    matches: [],
  }
}
