/**
 * Cloud model provider — OpenRouter (one key, many models) via its
 * OpenAI-compatible endpoint. Used ONLY for the public/cloud route: clean
 * catalog questions with no PII and no private-data intent.
 */

import { ModelProvider } from './base.js'
import { openaiChat } from './openaiCompatible.js'

export class CloudProvider extends ModelProvider {
  /**
   * @param {{ model?: string, baseUrl?: string, apiKey?: string, fetchImpl?: Function }} [opts]
   */
  constructor({
    model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    apiKey = process.env.OPENROUTER_API_KEY,
    fetchImpl,
  } = {}) {
    super({ model })
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.fetchImpl = fetchImpl
  }

  async chat({ messages, tools } = {}) {
    if (!this.apiKey) {
      throw new Error(
        'CLOUD provider requires OPENROUTER_API_KEY in env (PROVIDER_MODE=live)'
      )
    }
    return openaiChat({
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      model: this.model,
      messages,
      tools,
      // OpenRouter attribution headers (optional but recommended).
      extraHeaders: {
        'HTTP-Referer':
          process.env.OPENROUTER_REFERER || 'http://localhost:5001',
        'X-Title': 'ProShop M7 Privacy Assistant',
      },
      fetchImpl: this.fetchImpl,
    })
  }
}
