// M2 (T2.2 + T2.4) acceptance: the router maps EVERY frozen demo query to its
// expectedRoute with a human-readable reason, and the detector is "light" —
// well under 5 ms/message on CPU (proves the router needs no GPU).

import { route } from '../assistant/router.js'
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

describe('route() vs frozen demo fixtures', () => {
  test.each(QUERIES.map((q) => [q.id, q]))(
    '%s maps to its expectedRoute with a reason',
    (_id, q) => {
      const r = route(q.message)
      expect(r.target).toBe(q.expectedRoute)
      expect(typeof r.reason).toBe('string')
      expect(r.reason.length).toBeGreaterThan(0)
      if (q.expectedRoute === 'local') {
        expect(r.matches.length).toBeGreaterThan(0)
      } else {
        expect(r.matches).toHaveLength(0)
      }
    }
  )
})

describe('T2.4 — router is light (no GPU): < 5 ms/message on CPU', () => {
  test('average detect+route latency is well under 5 ms', () => {
    const msgs = QUERIES.map((q) => q.message)
    const ITER = 2000
    const start = process.hrtime.bigint()
    for (let i = 0; i < ITER; i++) route(msgs[i % msgs.length])
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6
    const perMsg = elapsedMs / ITER
    // eslint-disable-next-line no-console
    console.log(
      `[T2.4] router avg = ${perMsg.toFixed(4)} ms/msg over ${ITER} iterations`
    )
    expect(perMsg).toBeLessThan(5)
  })
})
