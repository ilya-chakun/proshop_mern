// M1 acceptance: provider layer is deterministic in mock mode and correctly
// normalizes an OpenAI-compatible response in live mode (with an injected fetch,
// so NO network is touched). Run under ESM jest: see backend/tests/README.md.

import { MockProvider } from '../assistant/providers/mock.js'
import { OllamaProvider } from '../assistant/providers/ollama.js'
import { CloudProvider } from '../assistant/providers/cloud.js'
import { getProvider } from '../assistant/providers/index.js'

// Pull the frozen fixtures straight from disk so the test can't drift from Mock.
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
const here = path.dirname(fileURLToPath(import.meta.url))
const QUERIES = JSON.parse(
  readFileSync(
    path.resolve(here, '../../homework/M7/demo/queries.json'),
    'utf-8'
  )
).queries

describe('MockProvider — deterministic two-phase replay', () => {
  const mock = new MockProvider()

  test('every frozen query replays its scripted tool calls then answer', async () => {
    for (const q of QUERIES) {
      // Phase 1: only the user message in context -> scripted tool calls.
      const phase1 = await mock.chat({
        messages: [{ role: 'user', content: q.message }],
      })
      expect(phase1.toolCalls.map((c) => c.name)).toEqual(
        q.mockToolCalls.map((c) => c.name)
      )
      expect(phase1.content).toBe('') // pure tool-call turn
      phase1.toolCalls.forEach((c) => expect(typeof c.args).toBe('object'))

      // Phase 2: a tool result is now present -> final scripted answer + latency.
      const phase2 = await mock.chat({
        messages: [
          { role: 'user', content: q.message },
          { role: 'assistant', content: '', tool_calls: phase1.toolCalls },
          { role: 'tool', content: '{"ok":true}' },
        ],
      })
      expect(phase2.content).toBe(q.mockAnswer)
      expect(phase2.latencyMs).toBe(q.mockLatencyMs)
      expect(phase2.usage.totalTokens).toBeGreaterThan(0)
    }
  })

  test('full round-trip latency equals the scripted mockLatencyMs (no double count)', async () => {
    const q = QUERIES[0]
    const p1 = await mock.chat({
      messages: [{ role: 'user', content: q.message }],
    })
    const p2 = await mock.chat({
      messages: [
        { role: 'user', content: q.message },
        { role: 'tool', content: '{}' },
      ],
    })
    expect(p1.latencyMs + p2.latencyMs).toBe(q.mockLatencyMs)
  })

  test('unknown message returns a safe fallback, not a crash', async () => {
    const res = await mock.chat({
      messages: [{ role: 'user', content: 'totally unscripted question' }],
    })
    expect(res.toolCalls).toEqual([])
    expect(res.content).toMatch(/mock mode/i)
  })
})

describe('getProvider factory', () => {
  test('mock mode always returns a MockProvider regardless of route', () => {
    expect(getProvider({ route: 'cloud', mode: 'mock' })).toBeInstanceOf(
      MockProvider
    )
    expect(getProvider({ route: 'local', mode: 'mock' })).toBeInstanceOf(
      MockProvider
    )
  })

  test('live mode maps route -> concrete provider', () => {
    expect(getProvider({ route: 'local', mode: 'live' })).toBeInstanceOf(
      OllamaProvider
    )
    expect(getProvider({ route: 'cloud', mode: 'live' })).toBeInstanceOf(
      CloudProvider
    )
  })

  test('unknown mode throws', () => {
    expect(() => getProvider({ mode: 'bogus' })).toThrow(/PROVIDER_MODE/)
  })
})

describe('openai-compatible normalization (injected fetch, no network)', () => {
  // Minimal fake of an OpenAI /chat/completions response with a tool call.
  const fakeFetch = async (url, opts) => {
    fakeFetch.lastUrl = url
    fakeFetch.lastBody = JSON.parse(opts.body)
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        model: 'qwen3:8b-q6_K',
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'call_1',
                  function: {
                    name: 'getProducts',
                    arguments: '{"query":"Airpods"}',
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
      }),
    }
  }

  test('OllamaProvider parses tool_calls args into objects and maps usage', async () => {
    const p = new OllamaProvider({ fetchImpl: fakeFetch })
    const res = await p.chat({
      messages: [{ role: 'user', content: 'Do you have Airpods?' }],
      tools: [{ type: 'function', function: { name: 'getProducts' } }],
    })
    expect(res.toolCalls).toHaveLength(1)
    expect(res.toolCalls[0].name).toBe('getProducts')
    expect(res.toolCalls[0].args).toEqual({ query: 'Airpods' }) // parsed, not a string
    expect(res.usage).toEqual({
      promptTokens: 11,
      completionTokens: 7,
      totalTokens: 18,
    })
    expect(fakeFetch.lastUrl).toBe('http://localhost:11434/v1/chat/completions')
    expect(fakeFetch.lastBody.tool_choice).toBe('auto')
  })

  test('CloudProvider without an API key throws before any fetch', async () => {
    const p = new CloudProvider({ apiKey: '', fetchImpl: fakeFetch })
    await expect(
      p.chat({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow(/OPENROUTER_API_KEY/)
  })

  test('CloudProvider sends Authorization bearer when key present', async () => {
    let seenAuth
    const spyFetch = async (url, opts) => {
      seenAuth = opts.headers.Authorization
      return fakeFetch(url, opts)
    }
    const p = new CloudProvider({ apiKey: 'test-key', fetchImpl: spyFetch })
    await p.chat({ messages: [{ role: 'user', content: 'hi' }] })
    expect(seenAuth).toBe('Bearer test-key')
  })

  test('non-OK HTTP response surfaces as an error', async () => {
    const errFetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'boom',
    })
    const p = new OllamaProvider({ fetchImpl: errFetch })
    await expect(
      p.chat({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow(/HTTP 500/)
  })
})
