/**
 * ModelProvider contract (PLAN §3.3).
 *
 * Every provider exposes ONE async method:
 *   chat({ messages, tools }) -> ChatResult
 *
 * ChatResult is normalized across Mock / Ollama / Cloud so the agent loop and
 * ChatLog persistence never branch on which provider produced the turn:
 *   {
 *     content:   string,                  // assistant text ('' when it's a pure tool call)
 *     toolCalls: Array<{ id, name, args }>, // args ALWAYS a parsed object, never a JSON string
 *     usage:     { promptTokens, completionTokens, totalTokens },
 *     model:     string,
 *     latencyMs: number,
 *   }
 */

import { estimateTokens } from '../pricing.js'

/** Abstract base; subclasses MUST override chat(). */
export class ModelProvider {
  /** @param {{ model?: string }} [opts] */
  constructor({ model } = {}) {
    this.model = model
  }

  /**
   * @param {{ messages: Array<object>, tools?: Array<object> }} _args
   * @returns {Promise<object>} ChatResult
   */
  // eslint-disable-next-line no-unused-vars
  async chat(_args) {
    throw new Error('ModelProvider.chat() not implemented by subclass')
  }
}

/** Flatten message contents into one string for heuristic token estimation. */
export const messagesToText = (messages = []) =>
  messages
    .map((m) =>
      typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')
    )
    .join('\n')

/**
 * Fill a partial provider result into the full ChatResult contract, computing a
 * heuristic token usage when the provider did not report one (e.g. Mock/Ollama).
 *
 * @param {object} a
 * @param {string} [a.content]
 * @param {Array<{id,name,args}>} [a.toolCalls]
 * @param {{promptTokens:number,completionTokens:number,totalTokens:number}} [a.usage]
 * @param {string} [a.model]
 * @param {number} [a.latencyMs]
 * @param {string} [a.promptText]  Source text for prompt-token estimation fallback.
 * @returns {object} ChatResult
 */
export const finalizeResult = ({
  content = '',
  toolCalls = [],
  usage,
  model,
  latencyMs = 0,
  promptText = '',
}) => {
  let resolvedUsage = usage
  if (!resolvedUsage) {
    const promptTokens = estimateTokens(promptText)
    const completionTokens =
      estimateTokens(content) +
      toolCalls.reduce(
        (n, c) => n + estimateTokens(JSON.stringify(c.args || {})),
        0
      )
    resolvedUsage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    }
  }
  return {
    content: content || '',
    toolCalls: toolCalls || [],
    usage: resolvedUsage,
    model: model || 'unknown',
    latencyMs,
  }
}
