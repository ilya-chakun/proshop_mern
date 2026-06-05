/**
 * Provider factory (PLAN §3.3).
 *
 *   getProvider({ route, mode }) -> ModelProvider
 *
 * - mode 'mock' (default, PROVIDER_MODE=mock): ALWAYS MockProvider, regardless of
 *   route, so tests and the offline demo are deterministic and network-free.
 * - mode 'live': route 'local' -> OllamaProvider, route 'cloud' -> CloudProvider.
 *
 * The route is decided upstream by the privacy router (M2); this factory only
 * maps an already-made decision to a concrete provider.
 */

import { MockProvider } from './mock.js'
import { OllamaProvider } from './ollama.js'
import { CloudProvider } from './cloud.js'

export { ModelProvider, finalizeResult, messagesToText } from './base.js'
export { MockProvider } from './mock.js'
export { OllamaProvider } from './ollama.js'
export { CloudProvider } from './cloud.js'

/**
 * @param {object} [a]
 * @param {'local'|'cloud'} [a.route='cloud']
 * @param {'mock'|'live'} [a.mode]   Defaults to PROVIDER_MODE env, then 'mock'.
 * @param {object} [a.overrides]     Passed to the concrete provider constructor.
 * @returns {ModelProvider}
 */
export const getProvider = ({
  route = 'cloud',
  mode = process.env.PROVIDER_MODE || 'mock',
  overrides = {},
} = {}) => {
  if (mode === 'mock') return new MockProvider(overrides)
  if (mode !== 'live') {
    throw new Error(`unknown PROVIDER_MODE '${mode}' (expected 'mock' | 'live')`)
  }
  return route === 'local'
    ? new OllamaProvider(overrides)
    : new CloudProvider(overrides)
}
