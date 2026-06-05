/**
 * Local model provider (Part 0) — talks to Ollama's OpenAI-compatible endpoint.
 * Used for the LOCAL/private route so PII and the user's own data never leave
 * the machine. Defaults come from .env (LOCAL_MODEL_BASE_URL / LOCAL_MODEL_NAME).
 */

import { ModelProvider } from './base.js'
import { openaiChat } from './openaiCompatible.js'

export class OllamaProvider extends ModelProvider {
  /**
   * @param {{ model?: string, baseUrl?: string, fetchImpl?: Function, timeoutMs?: number }} [opts]
   * `timeoutMs` is optional; when omitted, openaiChat applies its default. Local
   * "thinking" models (e.g. qwen3) can need a longer budget than the cloud default,
   * so callers (such as the LIVE demo harness) may raise it.
   */
  constructor({
    model = process.env.LOCAL_MODEL_NAME || 'qwen3:8b-q8_0',
    baseUrl = process.env.LOCAL_MODEL_BASE_URL || 'http://localhost:11434/v1',
    fetchImpl,
    timeoutMs,
  } = {}) {
    super({ model })
    this.baseUrl = baseUrl
    this.fetchImpl = fetchImpl
    this.timeoutMs = timeoutMs
  }

  async chat({ messages, tools } = {}) {
    return openaiChat({
      baseUrl: this.baseUrl,
      // Ollama ignores the key, but some HTTP clients require a non-empty value.
      apiKey: 'ollama',
      model: this.model,
      messages,
      tools,
      fetchImpl: this.fetchImpl,
      // Only override when provided, so openaiChat's default still applies otherwise.
      ...(this.timeoutMs != null ? { timeoutMs: this.timeoutMs } : {}),
    })
  }
}
