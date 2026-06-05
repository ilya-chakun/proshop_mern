/**
 * Cost model for the privacy router (PLAN §3.4).
 *
 * HARD RULE: local route ⇒ costUsd === 0.00 (rubric). Cloud cost = tokens ×
 * a rough-but-defensible per-model price table. Prices are USD per 1K tokens.
 */

// USD per 1,000 tokens (input / output). Rough public list prices; "defensible".
const PRICE_TABLE = {
  'openai/gpt-4o-mini': { in: 0.00015, out: 0.0006 },
  'openai/gpt-4o': { in: 0.005, out: 0.015 },
  'anthropic/claude-3.5-sonnet': { in: 0.003, out: 0.015 },
  'google/gemini-1.5-flash': { in: 0.000075, out: 0.0003 },
}

// Fallback cloud price if the model isn't in the table (so cost is never silently 0).
const DEFAULT_CLOUD_PRICE = { in: 0.0005, out: 0.0015 }

/** Heuristic token estimate when a provider doesn't report usage (~4 chars/token). */
export const estimateTokens = (text = '') =>
  Math.max(1, Math.ceil(String(text).length / 4))

/**
 * @param {object} a
 * @param {'local'|'cloud'} a.route   Routing decision (authoritative for $0 local).
 * @param {string} a.model
 * @param {number} [a.promptTokens]
 * @param {number} [a.completionTokens]
 * @returns {number} USD cost, rounded to 6 dp. Local route always 0.
 */
export const estimateCostUsd = ({
  route,
  model,
  promptTokens = 0,
  completionTokens = 0,
}) => {
  if (route === 'local') return 0 // privacy route runs on owned hardware → free
  const price = PRICE_TABLE[model] || DEFAULT_CLOUD_PRICE
  const usd =
    (promptTokens / 1000) * price.in + (completionTokens / 1000) * price.out
  return Number(usd.toFixed(6))
}

/** Price a hypothetical all-cloud baseline for the "$ saved" dashboard card. */
export const baselineCloudCost = ({
  model = 'openai/gpt-4o-mini',
  promptTokens = 0,
  completionTokens = 0,
}) => estimateCostUsd({ route: 'cloud', model, promptTokens, completionTokens })

export { PRICE_TABLE, DEFAULT_CLOUD_PRICE }
