/**
 * M7 / M6 · T6.1 — DZ1 demo harness.
 *
 * Fires the frozen `demo/queries.json` through the REAL assistant pipeline
 * (router → PII → scoped tools → agent) against an in-memory Mongo seeded with
 * the project's own seed data, persists one ChatLog per turn, then writes two
 * artifacts used by the DZ1 writeup and the dashboard proof:
 *
 *   demo/transcript.json      — human-readable per-turn transcript
 *   demo/chatlogs-dump.json   — persisted ChatLog rows + summary cards
 *
 * Runs fully offline in `mock` provider mode (deterministic), so it is safe in
 * CI and needs no GPU / API key. The `[LIVE]` real-model rows (T6.4) are
 * appended separately.
 *
 * Usage:  node homework/M7/demo/run-demo.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')
const rel = (p) => path.join(ROOT, p)

const MONGOMS = process.env.MONGOMS_VERSION || '7.0.14'

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n')
  console.log(`  wrote ${path.relative(ROOT, p)}`)
}

async function main() {
  console.log('m7 demo — privacy-routing assistant (mock mode)')

  process.env.NODE_ENV = 'test'
  process.env.MONGOMS_VERSION = MONGOMS

  const queries = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'queries.json'), 'utf8')
  ).queries
  if (!Array.isArray(queries) || queries.length < 6)
    throw new Error('demo/queries.json must contain ≥6 queries')

  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongoose = (await import('mongoose')).default
  const { seedInto } = await import(rel('backend/seeder.js'))
  const { runAssistant } = await import(rel('backend/assistant/agent.js'))
  const { estimateCostUsd, baselineCloudCost } = await import(
    rel('backend/assistant/pricing.js')
  )
  const ChatLog = (await import(rel('backend/models/chatLogModel.js'))).default

  const mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })

  const seeded = await seedInto()
  const actingUser = seeded.users.find((u) => !u.isAdmin) || seeded.users[0]
  console.log(
    `  seeded ${seeded.users.length} users + ${seeded.products.length} products; acting as "${actingUser.name}"`
  )

  await ChatLog.deleteMany({})
  const transcript = []

  for (const item of queries) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runAssistant({
      message: item.message,
      user: actingUser,
      mode: 'mock',
    })

    const costUsd = estimateCostUsd({
      route: result.route,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    })
    const detectedPII = result.matches.map((m) => ({
      type: m.type,
      masked: m.masked,
    }))

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
      latencyMs: result.latencyMs,
      costUsd,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      mode: 'mock',
    })

    transcript.push({
      id: item.id,
      message: item.message,
      route: result.route,
      reason: result.reason,
      model: result.model,
      detectedPII,
      toolCalls: result.toolCalls.map((t) => t.name),
      response: result.content,
      latencyMs: result.latencyMs,
      costUsd,
    })

    const tag = result.route === 'local' ? '🔒 local' : '☁️ cloud'
    console.log(`  ${item.id}: ${tag} (${result.reason}) — $${costUsd}`)
  }

  // Summary cards — mirror chatLogController exactly.
  const all = await ChatLog.find({}).select(
    'route costUsd promptTokens completionTokens'
  )
  let localCount = 0
  let cloudCount = 0
  let actualCost = 0
  let baselineCost = 0
  for (const l of all) {
    actualCost += l.costUsd || 0
    if (l.route === 'local') {
      localCount += 1
      baselineCost += baselineCloudCost({
        promptTokens: l.promptTokens || 0,
        completionTokens: l.completionTokens || 0,
      })
    } else {
      cloudCount += 1
      baselineCost += l.costUsd || 0
    }
  }
  const summary = {
    total: all.length,
    localCount,
    cloudCount,
    actualCostUsd: Number(actualCost.toFixed(6)),
    baselineCloudCostUsd: Number(baselineCost.toFixed(6)),
    savedUsd: Number((baselineCost - actualCost).toFixed(6)),
  }

  const logs = await ChatLog.find({}).sort({ createdAt: 1 }).lean()

  writeJson(path.join(__dirname, 'transcript.json'), {
    generatedAt: new Date().toISOString(),
    mode: 'mock',
    actingUser: { name: actingUser.name, isAdmin: !!actingUser.isAdmin },
    turns: transcript,
    summary,
  })
  writeJson(path.join(__dirname, 'chatlogs-dump.json'), {
    generatedAt: new Date().toISOString(),
    mode: 'mock',
    count: logs.length,
    logs,
    summary,
  })

  console.log(
    `\n  summary: ${summary.total} turns · ${localCount} local / ${cloudCount} cloud · saved $${summary.savedUsd} vs all-cloud`
  )

  await mongoose.disconnect()
  await mongod.stop()
  console.log('✓ demo complete')
}

main().catch((e) => {
  console.error('✗ demo failed:', e && e.stack ? e.stack : String(e))
  process.exit(1)
})
