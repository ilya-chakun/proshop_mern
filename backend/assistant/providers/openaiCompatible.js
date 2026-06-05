/**
 * Shared OpenAI-compatible /chat/completions client used by BOTH the local
 * (Ollama) and cloud (OpenRouter) providers, so request/response normalization
 * lives in exactly one place. Uses Node's global fetch (Node 18+).
 */

import { finalizeResult, messagesToText } from './base.js'

/** Tool-call arguments arrive as a JSON string from the API; parse defensively. */
const safeParseArgs = (raw) => {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return { _raw: String(raw) }
  }
}

/**
 * @param {object} a
 * @param {string} a.baseUrl           e.g. http://localhost:11434/v1
 * @param {string} [a.apiKey]
 * @param {string} a.model
 * @param {Array<object>} a.messages
 * @param {Array<object>} [a.tools]    OpenAI function-calling tool schema
 * @param {Record<string,string>} [a.extraHeaders]
 * @param {Function} [a.fetchImpl]     Injectable for tests; defaults to global fetch
 * @param {number} [a.timeoutMs]
 * @returns {Promise<object>} ChatResult
 */
export const openaiChat = async ({
  baseUrl,
  apiKey,
  model,
  messages,
  tools,
  extraHeaders = {},
  fetchImpl = globalThis.fetch,
  // Default request timeout. Configurable via ASSISTANT_TIMEOUT_MS so slow
  // local models (e.g. thinking models like qwen3) don't 500 on agentic turns.
  timeoutMs = Number(process.env.ASSISTANT_TIMEOUT_MS) || 60000,
}) => {
  if (typeof fetchImpl !== 'function') {
    throw new Error(
      'global fetch is unavailable; Node 18+ required for live providers'
    )
  }
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`
  const body = { model, messages }
  if (tools && tools.length) {
    body.tools = tools
    body.tool_choice = 'auto'
  }
  const headers = { 'Content-Type': 'application/json', ...extraHeaders }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()
  let resp
  try {
    resp = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
  const latencyMs = Date.now() - startedAt

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(
      `provider HTTP ${resp.status} ${resp.statusText}: ${text.slice(0, 300)}`
    )
  }

  const data = await resp.json()
  const choice = (data.choices && data.choices[0]) || {}
  const msg = choice.message || {}
  const toolCalls = (msg.tool_calls || []).map((tc) => ({
    id: tc.id,
    name: tc.function && tc.function.name,
    args: safeParseArgs(tc.function && tc.function.arguments),
  }))
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens:
          data.usage.total_tokens ||
          (data.usage.prompt_tokens || 0) + (data.usage.completion_tokens || 0),
      }
    : undefined

  return finalizeResult({
    content: msg.content || '',
    toolCalls,
    usage,
    model: data.model || model,
    latencyMs,
    promptText: messagesToText(messages),
  })
}
