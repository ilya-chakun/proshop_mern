/**
 * M7 · Live E2E demo (Playwright/chromium) with VIDEO + step screenshots.
 *
 * Walks the REAL running app (frontend :3000 → backend :5001 → local Ollama)
 * exactly like a human reviewer would, and records it:
 *
 *   1. Sign in as John (regular user).
 *   2. Open the floating Shop Assistant and ask 3 questions:
 *        · "привет какие есть товары"        → ☁️ cloud
 *        · "мне нужен телефон"                → ☁️ cloud
 *        · "show my orders for john@example.com" → 🔒 local (PII masked)
 *   3. Log out, sign in as Admin.
 *   4. Open Admin → Assistant Logs and show the persisted audit table.
 *
 * Outputs (homework/M7/e2e/artifacts/):
 *   · NN-*.png            one screenshot per step
 *   · m7-e2e-demo.webm    native Playwright recording (full run)
 *   · m7-e2e-demo.mp4     same video transcoded (if system ffmpeg present)
 *
 * Prereqs: app running (`npm run dev`) and DB seeded (`npm run data:import`).
 * Usage:   node homework/M7/e2e/run-e2e-demo.mjs
 *
 * Note: the local "thinking" model is slow (~10–80s/answer), so waits use a
 * generous 240s budget — matching ASSISTANT_TIMEOUT_MS. The video therefore
 * shows genuine latency (the 🤖 "thinking…" spinner) rather than fakes.
 */

import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const artifacts = path.join(__dirname, 'artifacts')
const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'
const ANSWER_TIMEOUT = 240_000

const USERS = {
  john: { email: 'john@example.com', password: '123456' },
  admin: { email: 'admin@example.com', password: '123456' },
}

fs.mkdirSync(artifacts, { recursive: true })

let stepNo = 0
const shot = async (page, name) => {
  const file = path.join(artifacts, `${String(++stepNo).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  📸 ${path.basename(file)}`)
}

const settle = (page, ms = 900) => page.waitForTimeout(ms)

/** Sign in via the /login form and wait for the redirect home. */
async function login(page, { email, password }) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[aria-label="Email address"]', email)
  await page.fill('input[aria-label="Password"]', password)
  await settle(page, 500)
  // Submit via Enter on the password field — the page has a second submit
  // button (the header SearchBox), so target the login form by its own field.
  await page.locator('input[aria-label="Password"]').press('Enter')
  // Header shows the user dropdown (#username) once logged in.
  await page.waitForSelector('#username', { timeout: 30_000 })
  await settle(page)
}

/** Log out through the user dropdown. */
async function logout(page) {
  await page.click('#username')
  await settle(page, 400)
  await page.click('text=Logout')
  await page.waitForSelector('a[href="/login"]', { timeout: 30_000 })
  await settle(page)
}

/**
 * Type a chat message, send it, and wait for the assistant's reply badge.
 * @returns the route shown on the new bot bubble ('local' | 'cloud').
 */
async function ask(page, text, expectBadgeCount) {
  const input = page.locator('input[aria-label="Message"]')
  await input.click()
  await input.fill(text)
  await settle(page, 400)
  await input.press('Enter')
  // Each answered bot turn adds one route <Badge>. Wait for the count to grow.
  await page
    .locator('.ps-chat-panel .badge')
    .nth(expectBadgeCount - 1)
    .waitFor({ state: 'visible', timeout: ANSWER_TIMEOUT })
  await settle(page, 800)
  const badge = page.locator('.ps-chat-panel .badge').nth(expectBadgeCount - 1)
  const label = (await badge.innerText()).trim()
  return label.includes('local') ? 'local' : 'cloud'
}

/**
 * Linger on the Assistant Logs dashboard so the video shows the full audit
 * history (not a single frame). Spends ~12s total: reads the summary cards,
 * smoothly scrolls down through every log row, highlights the masked-PII
 * "local" turn, then scrolls back to the top.
 */
async function tourDashboard(page) {
  // 1. Start at the top so the summary cards (Total / Local / Cloud / Saved)
  //    are visible, and hold a beat.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await settle(page, 1800)
  await shot(page, 'logs-summary-cards')

  // 2. Smoothly scroll the whole history from top to bottom in small steps so
  //    every row passes through the viewport on camera.
  const maxScroll = await page.evaluate(
    () => document.body.scrollHeight - window.innerHeight
  )
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    const top = Math.round((maxScroll * i) / steps)
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), top)
    await settle(page, 700)
  }
  await settle(page, 1200)
  await shot(page, 'logs-history-bottom')

  // 3. Bring the 🔒 local (masked-PII) row into view and pause on it — this is
  //    the privacy-routing money shot.
  const localRow = page.locator('.ps-table tbody tr', { hasText: 'local' }).first()
  if (await localRow.count()) {
    await localRow.scrollIntoViewIfNeeded()
    await settle(page, 2000)
    await shot(page, 'logs-local-row-highlight')
  }

  // 4. Scroll back to the top to close on the summary, holding one more beat.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await settle(page, 2000)
}

async function main() {
  let chromium
  ;({ chromium } = await import('playwright'))

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    recordVideo: { dir: artifacts, size: { width: 1280, height: 860 } },
  })
  const page = await context.newPage()
  page.setDefaultTimeout(60_000)

  const results = []
  try {
    // ── Act 1: John signs in ───────────────────────────────────────────────
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await shot(page, 'login-screen')

    await login(page, USERS.john)
    await shot(page, 'home-john-signed-in')

    // ── Act 2: open the assistant and ask 3 questions ──────────────────────
    await page.click('button[aria-label="Open assistant"]')
    await page.waitForSelector('.ps-chat-panel', { timeout: 15_000 })
    await settle(page)
    await shot(page, 'assistant-opened')

    const r1 = await ask(page, 'привет какие есть товары', 1)
    results.push(['привет какие есть товары', r1])
    await shot(page, `q1-${r1}`)

    const r2 = await ask(page, 'мне нужен телефон', 2)
    results.push(['мне нужен телефон', r2])
    await shot(page, `q2-${r2}`)

    const r3 = await ask(page, 'show my orders for john@example.com', 3)
    results.push(['show my orders for john@example.com', r3])
    await shot(page, `q3-${r3}`)

    // ── Act 3: log out, sign in as admin ───────────────────────────────────
    await logout(page)
    await shot(page, 'logged-out')

    await login(page, USERS.admin)
    await shot(page, 'home-admin-signed-in')

    // ── Act 4: open the Assistant Logs dashboard ───────────────────────────
    await page.click('#adminmenu')
    await settle(page, 500)
    await shot(page, 'admin-menu-open')

    await page.click('text=Assistant Logs')
    await page.waitForSelector('.ps-table', { timeout: 30_000 })
    await page.waitForSelector('.ps-table tbody tr', { timeout: 30_000 })
    await settle(page, 1200)
    await shot(page, 'assistant-logs-dashboard')

    const rowCount = await page.locator('.ps-table tbody tr').count()
    console.log(`\n✓ Assistant Logs dashboard shows ${rowCount} persisted row(s).`)

    // ── Act 5: linger on the dashboard and scroll the full history ──────────
    // Don't just flash one frame — give the reviewer ~12s to read the summary
    // cards and watch the whole audit history scroll past.
    await tourDashboard(page)
  } finally {
    // Closing the context flushes the .webm recording to disk.
    const video = page.video()
    await context.close()
    await browser.close()

    if (video) {
      const webm = await video.path()
      const finalWebm = path.join(artifacts, 'm7-e2e-demo.webm')
      fs.renameSync(webm, finalWebm)
      console.log(`\n🎬 video: ${path.relative(process.cwd(), finalWebm)}`)
      transcodeToMp4(finalWebm)
    }
  }

  console.log('\n── Route summary ──')
  for (const [q, r] of results) {
    console.log(`  ${r === 'local' ? '🔒 local' : '☁️ cloud'}  ${q}`)
  }
  console.log('\n✓ E2E demo complete.')
}

/** Transcode .webm → .mp4 with system ffmpeg if available (best-effort). */
function transcodeToMp4(webm) {
  const ffmpeg = spawnSync('which', ['ffmpeg']).stdout?.toString().trim()
  if (!ffmpeg) {
    console.log('  (system ffmpeg not found → keeping .webm only)')
    return
  }
  const mp4 = webm.replace(/\.webm$/, '.mp4')
  const res = spawnSync(
    'ffmpeg',
    ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4],
    { stdio: 'ignore' }
  )
  if (res.status === 0) {
    console.log(`🎬 video: ${path.relative(process.cwd(), mp4)}`)
  } else {
    console.log('  (ffmpeg transcode failed → keeping .webm only)')
  }
}

main().catch((e) => {
  console.error('✗ E2E demo failed:', e && e.stack ? e.stack : String(e))
  process.exit(1)
})
