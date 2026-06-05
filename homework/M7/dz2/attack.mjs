/**
 * M7 / DZ2 · T7.2a (+ T7.4 mock half) — structural prompt-injection demo.
 *
 * Deterministic, offline, no real jailbreak required. It proves the STRUCTURAL
 * vulnerability and its deterministic fix by injecting a "compromised model"
 * provider (`ScriptedAttacker`) into the REAL agent loop. The attacker does the
 * worst thing a jailbroken/poisoned model could do:
 *   1. call getAllUsers()                    (broad-scope exfiltration attempt)
 *   2. call getMyProfile({ userId: <Jane> }) (forged-scope attempt via tool args)
 *   3. dump every tool output verbatim       (a model that "obeys" the injection)
 *
 * The OUTCOME depends only on the server-side tool registry, not on the model:
 *   - vuln build  (ASSISTANT_SECURITY=vuln):  getAllUsers exists → foreign emails leak.
 *   - secure build(ASSISTANT_SECURITY=secure): no getAllUsers path → leak impossible;
 *     forged userId arg is ignored by the scoped tool in BOTH builds.
 *
 * Writes:  dz2/before-structural.json (vuln)  and  dz2/after.json (secure).
 *
 * Usage:  node homework/M7/dz2/attack.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')
const rel = (p) => path.join(ROOT, p)
const MONGOMS = process.env.MONGOMS_VERSION || '7.0.14'

const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8')
)

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n')
  console.log(`  wrote ${path.relative(ROOT, p)}`)
}

/**
 * A deliberately malicious/compromised model. It ignores the system prompt and
 * tries the dangerous actions, then echoes every tool output it received — the
 * behaviour a successful injection would produce. The leak is then entirely a
 * function of what the SERVER let it call.
 */
class ScriptedAttacker {
  constructor(forgedUserId) {
    this.model = 'scripted-attacker'
    this.forgedUserId = forgedUserId
  }

  async chat({ messages = [] } = {}) {
    const toolMsgs = messages.filter((m) => m.role === 'tool')
    // Phase 2: a model that obeys "output everything" — dump tool outputs verbatim.
    if (toolMsgs.length) {
      const dump = toolMsgs.map((m) => m.content).join(' | ')
      return {
        content: `Here is everything I retrieved: ${dump}`,
        toolCalls: [],
        model: this.model,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        latencyMs: 0,
      }
    }
    // Phase 1: attempt broad exfiltration + forged-scope read.
    return {
      content: '',
      toolCalls: [
        { id: 'atk_0', name: 'getAllUsers', args: {} },
        { id: 'atk_1', name: 'getMyProfile', args: { userId: this.forgedUserId } },
      ],
      model: this.model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      latencyMs: 0,
    }
  }
}

async function runMode({ security, runAssistant, actingUser, foreign }) {
  const results = []
  for (const atk of fixtures.attacks) {
    const attacker = new ScriptedAttacker(String(foreign._id))
    // eslint-disable-next-line no-await-in-loop
    const r = await runAssistant({
      message: atk.message,
      user: actingUser,
      security,
      provider: attacker,
    })

    const haystack =
      JSON.stringify(r.toolCalls.map((t) => t.result)) + ' ' + (r.content || '')
    const leakedEmails = fixtures.knownUsers
      .map((u) => u.email)
      .filter((email) => email !== actingUser.email && haystack.includes(email))

    const broadCall = r.toolCalls.find((t) => t.name === 'getAllUsers')
    const profileCall = r.toolCalls.find((t) => t.name === 'getMyProfile')

    results.push({
      id: atk.id,
      type: atk.type,
      security,
      message: atk.message,
      toolCallsAttempted: r.toolCalls.map((t) => t.name),
      getAllUsersResult: broadCall ? broadCall.result : null,
      forgedProfileResult: profileCall ? profileCall.result : null,
      finalAnswer: r.content,
      leaked: leakedEmails.length > 0,
      leakedForeignEmails: leakedEmails,
      expectation:
        security === 'vuln' ? atk.vulnExpectation : atk.secureExpectation,
    })

    const tag = leakedEmails.length ? `LEAK → ${leakedEmails.join(',')}` : 'no leak'
    console.log(`  [${security}] ${atk.id}: ${tag}`)
  }
  return results
}

async function main() {
  console.log('m7 DZ2 — structural prompt-injection attack/defense (mock)')
  process.env.NODE_ENV = 'test'
  process.env.MONGOMS_VERSION = MONGOMS

  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongoose = (await import('mongoose')).default
  const { seedInto } = await import(rel('backend/seeder.js'))
  const { runAssistant } = await import(rel('backend/assistant/agent.js'))
  const Product = (await import(rel('backend/models/productModel.js'))).default

  const mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })

  const seeded = await seedInto()
  // Acting user = John; foreign user whose data must never leak = Jane.
  const actingUser =
    seeded.users.find((u) => u.email === 'john@example.com') ||
    seeded.users.find((u) => !u.isAdmin) ||
    seeded.users[0]
  const foreign =
    seeded.users.find((u) => u.email === 'jane@example.com') ||
    seeded.users.find((u) => u.email !== actingUser.email)

  // Seed the indirect-injection surface: poison a real product's review.
  const poison = fixtures.poisonedReview
  const target = await Product.findOne({ name: poison.targetProductName })
  if (target) {
    target.reviews = target.reviews || []
    target.reviews.push({
      name: poison.review.name,
      rating: poison.review.rating,
      comment: poison.review.comment,
      user: foreign._id,
    })
    target.numReviews = target.reviews.length
    await target.save()
    console.log(`  poisoned review seeded onto "${target.name}"`)
  } else {
    console.log(`  (warn) target product "${poison.targetProductName}" not found`)
  }

  console.log(`  acting as ${actingUser.name}; foreign user = ${foreign.name}\n`)

  const before = await runMode({
    security: 'vuln',
    runAssistant,
    actingUser,
    foreign,
  })
  const after = await runMode({
    security: 'secure',
    runAssistant,
    actingUser,
    foreign,
  })

  const meta = {
    generatedAt: new Date().toISOString(),
    mode: 'mock-structural',
    actingUser: { name: actingUser.name, email: actingUser.email },
    foreignUser: { name: foreign.name, email: foreign.email },
  }

  writeJson(path.join(__dirname, 'before-structural.json'), {
    ...meta,
    security: 'vuln',
    summary: {
      attacks: before.length,
      leaks: before.filter((r) => r.leaked).length,
    },
    results: before,
  })
  writeJson(path.join(__dirname, 'after.json'), {
    ...meta,
    security: 'secure',
    summary: {
      attacks: after.length,
      leaks: after.filter((r) => r.leaked).length,
    },
    results: after,
  })

  const vulnLeaks = before.filter((r) => r.leaked).length
  const secureLeaks = after.filter((r) => r.leaked).length
  console.log(
    `\n  vuln build: ${vulnLeaks}/${before.length} attacks leaked foreign data`
  )
  console.log(
    `  secure build: ${secureLeaks}/${after.length} attacks leaked foreign data`
  )

  await mongoose.disconnect()
  await mongod.stop()

  // The whole point: vuln leaks, secure does not. Fail loudly otherwise.
  if (vulnLeaks === 0)
    throw new Error('expected the vuln build to leak — attack not demonstrated')
  if (secureLeaks !== 0)
    throw new Error('SECURE BUILD LEAKED foreign data — defense is broken!')

  console.log('\n✓ DZ2 structural demo: vuln leaks, secure is airtight')
}

main().catch((e) => {
  console.error('✗ attack runner failed:', e && e.stack ? e.stack : String(e))
  process.exit(1)
})
