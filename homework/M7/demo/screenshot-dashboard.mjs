/**
 * M7 / M6 · T6.2 — dashboard screenshot (Playwright/chromium).
 *
 * Renders the REAL demo data (`demo/chatlogs-dump.json`, produced by
 * run-demo.mjs) into a data-faithful HTML view of the "Assistant Logs"
 * dashboard — same columns and summary cards as `AssistantLogsScreen.js` —
 * and screenshots it to `demo/dashboard.png`.
 *
 * Why a render harness instead of the live React screen: capturing the actual
 * `/admin/assistant-logs` route requires the full stack running (backend +
 * frontend dev server + an admin session). That is the `[LIVE]` proof (T6.4);
 * this AUTO step gives a deterministic PNG from real persisted rows so the demo
 * package always contains a dashboard image. The numbers shown are the genuine
 * mock-mode demo numbers, not invented.
 *
 * Falls back to a note file if the chromium browser can't launch.
 *
 * Usage:  node homework/M7/demo/screenshot-dashboard.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dumpPath = path.join(__dirname, 'chatlogs-dump.json')
const outPng = path.join(__dirname, 'dashboard.png')
const notePath = path.join(__dirname, 'dashboard-note.md')

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

function buildHtml(dump) {
  const { summary, logs } = dump
  const card = (label, value, accent) => `
    <div class="card">
      <div class="card-label">${esc(label)}</div>
      <div class="card-value" style="color:${accent}">${esc(value)}</div>
    </div>`

  const rows = logs
    .map((l) => {
      const badge =
        l.route === 'local'
          ? '<span class="badge b-local">🔒 local</span>'
          : '<span class="badge b-cloud">☁️ cloud</span>'
      const cost =
        (l.costUsd || 0) === 0
          ? '<span class="free">$0.00</span>'
          : `$${Number(l.costUsd).toFixed(6)}`
      const pii =
        (l.detectedPII || []).map((p) => esc(p.type)).join(', ') || '—'
      return `<tr>
        <td class="msg">${esc(l.message)}</td>
        <td>${badge}</td>
        <td class="reason">${esc(l.reason)}</td>
        <td>${pii}</td>
        <td class="mono">${esc(l.model)}</td>
        <td class="mono cost">${cost}</td>
      </tr>`
    })
    .join('\n')

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root{--ps-bg:#f6f7f9;--ps-surface:#fff;--ps-border:#e3e6ea;--ps-text:#1f2933;
      --ps-muted:#7b8794;--ps-primary:#0d6efd;--ps-success:#198754;--ps-info:#0dcaf0;}
    *{box-sizing:border-box}
    body{margin:0;background:var(--ps-bg);color:var(--ps-text);
      font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:28px;}
    h1{font-size:22px;margin:0 0 4px}
    .sub{color:var(--ps-muted);font-size:13px;margin:0 0 20px}
    .cards{display:flex;gap:14px;margin-bottom:22px;flex-wrap:wrap}
    .card{background:var(--ps-surface);border:1px solid var(--ps-border);border-radius:12px;
      padding:14px 18px;min-width:150px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
    .card-label{font-size:12px;color:var(--ps-muted);text-transform:uppercase;letter-spacing:.04em}
    .card-value{font-size:24px;font-weight:700;margin-top:4px}
    table{width:100%;border-collapse:collapse;background:var(--ps-surface);
      border:1px solid var(--ps-border);border-radius:12px;overflow:hidden;font-size:13px}
    th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--ps-border);vertical-align:top}
    th{background:#fafbfc;color:var(--ps-muted);font-weight:600;font-size:11px;text-transform:uppercase}
    tr:last-child td{border-bottom:none}
    .msg{max-width:240px}
    .reason{max-width:280px;color:var(--ps-muted);font-size:12px}
    .mono{font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
    .cost{text-align:right}
    .free{color:var(--ps-success);font-weight:700}
    .badge{display:inline-block;padding:3px 8px;border-radius:20px;font-size:12px;font-weight:600;color:#fff}
    .b-local{background:var(--ps-success)}
    .b-cloud{background:var(--ps-info);color:#063}
  </style></head><body>
    <h1>Assistant Logs</h1>
    <p class="sub">Privacy-routing audit · mock-mode demo · ${esc(
      dump.generatedAt
    )}</p>
    <div class="cards">
      ${card('Total turns', summary.total, 'var(--ps-text)')}
      ${card('Local (private)', summary.localCount, 'var(--ps-success)')}
      ${card('Cloud', summary.cloudCount, 'var(--ps-info)')}
      ${card('Actual cost', '$' + summary.actualCostUsd.toFixed(6), 'var(--ps-text)')}
      ${card('Saved vs all-cloud', '$' + summary.savedUsd.toFixed(6), 'var(--ps-success)')}
    </div>
    <table>
      <thead><tr><th>Message</th><th>Route</th><th>Reason</th><th>PII</th><th>Model</th><th>Cost</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`
}

async function main() {
  if (!fs.existsSync(dumpPath))
    throw new Error(
      'chatlogs-dump.json missing — run `node homework/M7/demo/run-demo.mjs` first'
    )
  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'))
  const html = buildHtml(dump)

  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (e) {
    fs.writeFileSync(
      notePath,
      `# dashboard.png not generated\n\nPlaywright is not installed: ${e.message}\n\n` +
        `Manual fallback: run the app (\`npm run dev\`), log in as admin, open ` +
        `\`/admin/assistant-logs\`, and screenshot it to \`demo/dashboard.png\`.\n`
    )
    console.log('  Playwright unavailable → wrote dashboard-note.md fallback')
    return
  }

  let browser
  try {
    browser = await chromium.launch()
  } catch (e) {
    fs.writeFileSync(
      notePath,
      `# dashboard.png not generated\n\nChromium failed to launch: ${e.message}\n\n` +
        `Install the browser with \`npx playwright install chromium\`, or take a ` +
        `manual screenshot of \`/admin/assistant-logs\`.\n`
    )
    console.log('  chromium launch failed → wrote dashboard-note.md fallback')
    return
  }

  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.screenshot({ path: outPng, fullPage: true })
  await browser.close()
  console.log(`  wrote ${path.relative(path.resolve(__dirname, '../../..'), outPng)}`)
  console.log('✓ screenshot complete')
}

main().catch((e) => {
  console.error('✗ screenshot failed:', e && e.stack ? e.stack : String(e))
  process.exit(1)
})
