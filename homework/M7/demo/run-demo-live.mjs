/**
 * M7 · T3.4 / T6.4 — LIVE demo harness (real local model).
 *
 * Same flow as run-demo.mjs but every turn is processed by the REAL local model
 * (Ollama `qwen3:8b-q8_0`) instead of the deterministic MockProvider, proving
 * genuine tool-calling by a real model.
 *
 * Routing decisions are still the REAL router's (router.js). Because no
 * OPENROUTER_API_KEY was provided, cloud-routed turns are ALSO executed on the
 * local model and flagged with `liveProcessorNote`; in production those turns
 * would hit OpenRouter (one-line swap, see README §2C). The privacy guarantee is
 * unaffected — PII turns always route local.
 *
 * Output:
 *   demo/transcript-live.json       — per-turn real-model transcript
 *   demo/chatlogs-live-dump.json    — persisted ChatLog rows (mode: 'live')
 *
 * Usage:  node homework/M7/demo/run-demo-live.mjs
 * Requires: `ollama serve` running with qwen3:8b-q8_0 pulled.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')
const rel = (p) => path.join(ROOT, p)

const MONGOMS = process.env.MONGOMS_VERSION || '7.0.14'
const BASE_URL =
  process.env.LOCAL_MODEL_BASE_URL || 'http://localhost:11434/v1'
const MODEL = process.env.LOCAL_MODEL_NAME || 'qwen3:8b-q8_0'
// qwen3 is a "thinking" model and PII (local) turns need TWO round-trips
// (tool call + final answer); give each HTTP call a generous budget so the
// real-model demo doesn't abort on slow reasoning. Production keeps the 60s default.
const LIVE_TIMEOUT_MS = Number(process.env.LOCAL_MODEL_TIMEOUT_MS || 240000)

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n')
  console.log(`  wrote ${path.relative(ROOT, p)}`)
}

async function preflight() {
  // Fail loudly if the local endpoint isn't reachable.
  const res = await fetch(BASE_URL.replace(/\/v1$/, '') + '/api/version').catch(
    (e) => {
      throw new Error(
        `local model endpoint unreachable at ${BASE_URL} — start \`ollama serve\` (${e.message})`
      )
    }
  )
  const v = await res.json()
  console.log(`  local endpoint up: ollama ${v.version} @ ${BASE_URL}`)
}

async function main() {
  console.log(`m7 demo — LIVE mode (real model: ${MODEL})`)

  process.env.NODE_ENV = 'test'
  process.env.MONGOMS_VERSION = MONGOMS

  await preflight()

  const queries = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'queries.json'), 'utf8')
  ).queries

  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongoose = (await import('mongoose')).default
  const { seedInto } = await import(rel('backend/seeder.js'))
  const { runAssistant } = await import(rel('backend/assistant/agent.js'))
  const { OllamaProvider } = await import(
    rel('backend/assistant/providers/ollama.js')
  )
  const { estimateCostUsd } = await import(rel('backend/assistant/pricing.js'))
  const ChatLog = (await import(rel('backend/models/chatLogModel.js'))).default

  const mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })

  const seeded = await seedInto()
  const actingUser = seeded.users.find((u) => !u.isAdmin) || seeded.users[0]
  console.log(`  acting as "${actingUser.name}" (${actingUser._id})`)

  await ChatLog.deleteMany({})
  const transcript = []

  for (const item of queries) {
    const t0 = Date.now()
    // Real local model for EVERY turn (injected provider bypasses cloud/key).
    // eslint-disable-next-line no-await-in-loop
    const result = await runAssistant({
      message: item.message,
      user: actingUser,
      provider: new OllamaProvider({
        model: MODEL,
        baseUrl: BASE_URL,
        timeoutMs: LIVE_TIMEOUT_MS,
      }),
    })
    const wallMs = Date.now() - t0

    const costUsd =
      result.route === 'local'
        ? 0
        : estimateCostUsd({
            route: result.route,
            model: result.model,
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
          })
    const detectedPII = result.matches.map((m) => ({
      type: m.type,
      masked: m.masked,
    }))
    const cloudFallback = result.route === 'cloud'

    // eslint-disable-next-line no-await-in-loop
    await ChatLog.create({
      user: actingUser._id,
      userName: actingUser.name,
      message: item.message,
      detectedPII,
      route: result.route,
      reason: result.reason,
      model: result.model,
      response: result.content,
      toolCalls: result.toolCalls.map((t) => ({ name: t.name, args: t.args })),
      latencyMs: wallMs,
      costUsd,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      mode: 'live',
    })

    transcript.push({
      id: item.id,
      message: item.message,
      route: result.route,
      reason: result.reason,
      model: result.model,
      detectedPII,
      toolCalls: result.toolCalls.map((t) => ({
        name: t.name,
        args: t.args,
        resultPreview:
          typeof t.result === 'object'
            ? Object.keys(t.result)
            : String(t.result).slice(0, 80),
      })),
      response: result.content,
      usage: result.usage,
      latencyMs: wallMs,
      costUsd,
      ...(cloudFallback
        ? {
            liveProcessorNote:
              'cloud route — processed on LOCAL model (no OPENROUTER_API_KEY); production swaps to OpenRouter',
          }
        : {}),
    })

    const tag = result.route === 'local' ? '🔒 local' : '☁️ cloud'
    console.log(
      `  ${item.id}: ${tag} (${result.reason}) — ${wallMs}ms, ${result.toolCalls
        .map((t) => t.name)
        .join(',') || 'no-tool'}`
    )
  }

  const logs = await ChatLog.find({}).sort({ createdAt: 1 }).lean()
  const localCount = transcript.filter((t) => t.route === 'local').length
  const summary = {
    total: transcript.length,
    localCount,
    cloudCount: transcript.length - localCount,
    realModel: MODEL,
    endpoint: BASE_URL,
    note: 'All turns executed by the real local model. Cloud-routed turns ran on the local model as a fallback (no OpenRouter key); routing decisions are the real router output.',
  }

  writeJson(path.join(__dirname, 'transcript-live.json'), {
    generatedAt: new Date().toISOString(),
    mode: 'live',
    realModel: MODEL,
    endpoint: BASE_URL,
    actingUser: { name: actingUser.name },
    turns: transcript,
    summary,
  })
  writeJson(path.join(__dirname, 'chatlogs-live-dump.json'), {
    generatedAt: new Date().toISOString(),
    mode: 'live',
    count: logs.length,
    logs,
    summary,
  })

  console.log(
    `\n  summary: ${summary.total} turns · ${summary.localCount} local / ${summary.cloudCount} cloud · real model ${MODEL}`
  )

  await mongoose.disconnect()
  await mongod.stop()
  console.log('✓ live demo complete')
}

main().catch((e) => {
  console.error('✗ live demo failed:', e && e.stack ? e.stack : String(e))
  process.exit(1)
})
