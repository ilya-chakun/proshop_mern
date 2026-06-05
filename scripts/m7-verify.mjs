#!/usr/bin/env node
/**
 * m7:verify — the autonomy gate for the M7 capstone (PLAN §8.3).
 *
 * Runs a sequence of NAMED stages. Each stage either passes, or exits non-zero
 * with a single clear reason. Stages whose milestone isn't built yet fail with a
 * "PENDING <milestone>" message instead of crashing — so this harness is wired
 * from M0 but only turns fully green at M8 (T8.5).
 *
 * Acceptance (full green, T8.5) — exit 0 IFF all hold:
 *   A fixtures present & valid (queries.json, tool-schema.json)
 *   B every backend jest+supertest spec passes
 *   C memory-Mongo boots (pinned MONGOMS_VERSION) + seeds via in-process seedInto()
 *   D router maps every demo query to its expectedRoute            [M2]
 *   E every query produces a ChatLog: route==expectedRoute,
 *     local rows costUsd===0, PII masked                            [M3/M4]
 *   F widget jsdom test passes (CI=true --watchAll=false)           [M5]
 *   G DZ2 structural injection: vuln build leaks, secure build does not [M7]
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rel = (p) => path.join(ROOT, p)
const MONGOMS = process.env.MONGOMS_VERSION || '6.0.14'

let stage = '(init)'
const fail = (reason) => {
  console.error(`\n✗ m7:verify FAILED at stage ${stage}\n  reason: ${reason}\n`)
  process.exit(1)
}
const pending = (milestone, what) => {
  console.error(
    `\n⏳ m7:verify INCOMPLETE at stage ${stage} — PENDING ${milestone}\n  needs: ${what}\n`
  )
  process.exit(2)
}
const ok = (msg) => console.log(`  ✓ ${msg}`)
const banner = (s) => {
  stage = s
  console.log(`\n── stage ${s} ──`)
}

function loadJson(p, label) {
  if (!fs.existsSync(p)) fail(`${label} missing at ${path.relative(ROOT, p)}`)
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    fail(`${label} is not valid JSON: ${e.message}`)
  }
}

async function main() {
  console.log('m7:verify — privacy-routing assistant gate')
  console.log(`root: ${ROOT}`)
  console.log(`MONGOMS_VERSION: ${MONGOMS}`)

  // ── A: fixtures ───────────────────────────────────────────────
  banner('A: fixtures')
  const q = loadJson(rel('homework/M7/demo/queries.json'), 'demo/queries.json')
  const schema = loadJson(
    rel('homework/M7/demo/tool-schema.json'),
    'demo/tool-schema.json'
  )
  if (!Array.isArray(q.queries) || q.queries.length < 6)
    fail('queries.json must contain ≥6 queries')
  const toolNames = schema.tools.map((t) => t.function.name)
  for (const item of q.queries) {
    for (const c of item.mockToolCalls || []) {
      if (!toolNames.includes(c.name))
        fail(`query ${item.id} references unknown tool "${c.name}"`)
    }
    if (!['local', 'cloud'].includes(item.expectedRoute))
      fail(`query ${item.id} has invalid expectedRoute`)
  }
  ok(`${q.queries.length} queries valid; tools: ${toolNames.join(', ')}`)

  // ── B: backend jest+supertest ─────────────────────────────────
  banner('B: backend jest+supertest')
  try {
    execSync('npm test', {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, MONGOMS_VERSION: MONGOMS, NODE_ENV: 'test' },
    })
  } catch (e) {
    fail('backend jest suite did not pass')
  }
  ok('backend jest+supertest green')

  // ── C: memory-Mongo + in-process seedInto() ───────────────────
  banner('C: memory-Mongo seed via seedInto()')
  process.env.NODE_ENV = 'test'
  process.env.MONGOMS_VERSION = MONGOMS
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongoose = (await import('mongoose')).default
  const { seedInto } = await import(rel('backend/seeder.js'))
  const mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  const seeded = await seedInto()
  if (seeded.users.length !== 3)
    fail(`expected 3 seeded users, got ${seeded.users.length}`)
  if (seeded.products.length !== 6)
    fail(`expected 6 seeded products, got ${seeded.products.length}`)
  ok(`seeded ${seeded.users.length} users + ${seeded.products.length} products`)

  // ── D: router maps every query to expectedRoute ───────────────
  banner('D: router → expectedRoute [M2]')
  const routerPath = rel('backend/assistant/router.js')
  if (!fs.existsSync(routerPath)) {
    await mongoose.disconnect()
    await mongod.stop()
    pending('M2', 'backend/assistant/router.js (route(message) → {target,...})')
  }
  const { route } = await import(routerPath)
  let mismatches = 0
  for (const item of q.queries) {
    const r = route(item.message)
    const target = r.target || r.route
    if (target !== item.expectedRoute) {
      console.error(
        `    ✗ ${item.id}: expected ${item.expectedRoute}, got ${target}`
      )
      mismatches++
    }
  }
  if (mismatches) fail(`${mismatches} router/expectedRoute mismatches`)
  ok('router matches expectedRoute for every query')

  // ── E: ChatLog pipeline ───────────────────────────────────────
  banner('E: ChatLog route/cost/PII-mask [M3/M4]')
  const chatLogModelPath = rel('backend/models/chatLogModel.js')
  const agentPath = rel('backend/assistant/agent.js')
  if (!fs.existsSync(chatLogModelPath) || !fs.existsSync(agentPath)) {
    await mongoose.disconnect()
    await mongod.stop()
    pending('M3/M4', 'backend/assistant/agent.js + backend/models/chatLogModel.js')
  }

  const { runAssistant } = await import(agentPath)
  const { estimateCostUsd } = await import(rel('backend/assistant/pricing.js'))
  const ChatLog = (await import(chatLogModelPath)).default
  const actingUser = seeded.users[0] // a real seeded user → scoped tools resolve

  await ChatLog.deleteMany({})
  let eRoute = 0
  let eLocalFree = 0
  let ePiiMasked = 0
  for (const item of q.queries) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runAssistant({
      message: item.message,
      user: actingUser,
      mode: 'mock',
    })

    // (c) route must equal the frozen expectedRoute
    if (result.route !== item.expectedRoute)
      fail(`${item.id}: ChatLog route ${result.route} != expected ${item.expectedRoute}`)
    eRoute++

    const costUsd = estimateCostUsd({
      route: result.route,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    })
    // (d) local route ⇒ costUsd === 0 (the privacy/cost rubric rule)
    if (result.route === 'local' && costUsd !== 0)
      fail(`${item.id}: local row must be $0, got ${costUsd}`)
    if (result.route === 'local') eLocalFree++

    // (e) any detected PII is stored MASKED (never the raw value)
    const detectedPII = result.matches.map((m) => ({ type: m.type, masked: m.masked }))
    for (const m of result.matches) {
      if (!m.masked || m.masked === m.value)
        fail(`${item.id}: PII (${m.type}) not masked in ChatLog`)
      ePiiMasked++
    }

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
  }

  const logCount = await ChatLog.countDocuments({})
  if (logCount !== q.queries.length)
    fail(`expected ${q.queries.length} ChatLog rows, got ${logCount}`)
  const localRows = await ChatLog.find({ route: 'local' })
  if (localRows.some((r) => r.costUsd !== 0))
    fail('a persisted local-route ChatLog has non-zero costUsd')
  ok(
    `${logCount} ChatLogs: ${eRoute} routes correct, ${eLocalFree} local rows $0, ${ePiiMasked} PII values masked`
  )

  // ── F: widget jsdom test ──────────────────────────────────────
  banner('F: widget jsdom test [M5]')
  const widgetTest = rel('frontend/src/components/ChatWidget.test.js')
  if (!fs.existsSync(widgetTest)) pending('M5', 'frontend ChatWidget.test.js')
  execSync(
    'CI=true npm test --prefix frontend -- --watchAll=false --testPathPattern=ChatWidget',
    {
      cwd: ROOT,
      stdio: 'inherit',
      // SKIP_PREFLIGHT_CHECK: backend jest hoists babel-jest@29 to the root
      // node_modules, which trips CRA's react-scripts 3.4.3 preflight. The
      // frontend test only needs jsdom + RTL, so bypassing the check is safe.
      env: { ...process.env, CI: 'true', SKIP_PREFLIGHT_CHECK: 'true' },
    }
  )
  ok('widget jsdom test green')

  // ── G: DZ2 structural injection (vuln leaks, secure airtight) ──
  banner('G: DZ2 attack/defense [M7]')
  const attackRunner = rel('homework/M7/dz2/attack.mjs')
  if (!fs.existsSync(attackRunner)) {
    await mongoose.disconnect()
    await mongod.stop()
    pending('M7', 'homework/M7/dz2/attack.mjs (structural injection demo)')
  }
  try {
    execSync('node homework/M7/dz2/attack.mjs', {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, MONGOMS_VERSION: MONGOMS, NODE_ENV: 'test' },
    })
  } catch (e) {
    fail('DZ2 attack runner failed (vuln must leak, secure must not)')
  }
  const before = loadJson(
    rel('homework/M7/dz2/before-structural.json'),
    'dz2/before-structural.json'
  )
  const after = loadJson(rel('homework/M7/dz2/after.json'), 'dz2/after.json')
  if (!(before.summary.leaks > 0))
    fail('vuln build did not leak — attack not demonstrated')
  if (after.summary.leaks !== 0)
    fail('SECURE BUILD LEAKED — deterministic defense is broken')
  ok(
    `DZ2: vuln leaked ${before.summary.leaks}/${before.summary.attacks}, secure leaked ${after.summary.leaks}/${after.summary.attacks}`
  )

  await mongoose.disconnect()
  await mongod.stop()
  console.log('\n✓ m7:verify PASSED — all stages green')
  process.exit(0)
}

main().catch((e) => fail(e && e.stack ? e.stack : String(e)))
