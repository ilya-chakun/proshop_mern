/**
 * Deterministic provider for autonomous tests and the offline demo (PROVIDER_MODE=mock).
 *
 * Single source of truth: it reads scripted tool-calls/answers from the FROZEN
 * fixtures at homework/M7/demo/queries.json — the SAME file the router tests use
 * for expectedRoute — so demo behavior and routing assertions can never drift.
 *
 * Two-phase agent protocol (no sleeping; reports the scripted latency as data):
 *   Phase 1 (no tool output in context yet) -> emit entry.mockToolCalls, content ''.
 *   Phase 2 (a role:'tool' message is present, or no tool was needed)
 *                                            -> emit entry.mockAnswer.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { ModelProvider, finalizeResult, messagesToText } from './base.js'

const here = path.dirname(fileURLToPath(import.meta.url))
// backend/assistant/providers -> repo root -> homework/M7/demo/queries.json
const QUERIES_PATH = path.resolve(
  here,
  '../../../homework/M7/demo/queries.json'
)

/** Load and cache the frozen demo queries. */
const loadQueries = () => {
  const raw = JSON.parse(readFileSync(QUERIES_PATH, 'utf-8'))
  return raw.queries || []
}

export class MockProvider extends ModelProvider {
  /** @param {{ model?: string, queries?: Array<object> }} [opts] */
  constructor({ model = 'mock-1', queries } = {}) {
    super({ model })
    this.queries = queries || loadQueries()
  }

  /** Find the fixture whose message matches the latest user turn. */
  _findEntry(messages) {
    const userMsgs = messages.filter((m) => m.role === 'user')
    const last = userMsgs[userMsgs.length - 1]
    const text = (last && last.content) || ''
    return (
      this.queries.find((q) => q.message === text) ||
      this.queries.find((q) => text.includes(q.message)) ||
      null
    )
  }

  async chat({ messages = [] } = {}) {
    const entry = this._findEntry(messages)
    const hasToolResult = messages.some((m) => m.role === 'tool')
    const promptText = messagesToText(messages)

    if (!entry) {
      return finalizeResult({
        content: "I don't have a scripted answer for that in mock mode.",
        model: this.model,
        latencyMs: 0,
        promptText,
      })
    }

    if (
      !hasToolResult &&
      Array.isArray(entry.mockToolCalls) &&
      entry.mockToolCalls.length
    ) {
      // Phase 1: scripted tool calls only. Latency is attributed to the final
      // answer turn (below) so a full round-trip totals entry.mockLatencyMs.
      const toolCalls = entry.mockToolCalls.map((c, i) => ({
        id: `mock_${entry.id}_${i}`,
        name: c.name,
        args: c.args || {},
      }))
      return finalizeResult({
        content: '',
        toolCalls,
        model: this.model,
        latencyMs: 0,
        promptText,
      })
    }

    // Phase 2: final scripted answer.
    return finalizeResult({
      content: entry.mockAnswer || '',
      model: this.model,
      latencyMs: entry.mockLatencyMs || 0,
      promptText,
    })
  }
}
