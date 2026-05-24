#!/usr/bin/env python3
"""Video 3: Results + Final Slide (~1:00)"""

import glob as _glob
import json
import os
import subprocess
import time

from playwright.sync_api import sync_playwright

# ── Constants ──────────────────────────────────────────────
FRONTEND_URL = "http://localhost:3000"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
WIDTH, HEIGHT = 1280, 720


def safe_click(page, selector, timeout=5000):
    try:
        page.click(selector, timeout=timeout)
        return True
    except Exception:
        print(f"  [SKIP] click: {selector}")
        return False


def safe_fill(page, selector, value, timeout=5000):
    try:
        page.fill(selector, value, timeout=timeout)
        return True
    except Exception:
        print(f"  [SKIP] fill: {selector}")
        return False


def wait(s, label=""):
    if label:
        print(f"  [{s}s] {label}")
    time.sleep(s)


# ── Scene 3.1: Dashboard after WF2 ────────────────────────
def scene_dashboard_after(page):
    print("\n=== Scene 3.1: Dashboard After WF2 (0:00-0:25) ===")
    page.goto(f"{FRONTEND_URL}/login")
    wait(2, "login page")
    safe_fill(page, '#email', 'admin@example.com')
    safe_fill(page, '#password', '123456')
    safe_click(page, 'button:has-text("Sign In")')
    wait(4, "logging in")

    page.goto(f"{FRONTEND_URL}/admin/featuredashboard")
    wait(4, "feature dashboard")

    page.evaluate("window.scrollTo(0, 0)")
    wait(5, "showing updated status")


# ── Scene 3.2: logs.json ──────────────────────────────────
def scene_logs(page):
    print("\n=== Scene 3.2: logs.json Data (0:25-0:45) ===")
    logs_path = os.path.join(PROJECT_ROOT, "homework", "M5", "data", "logs.json")
    logs = []
    try:
        with open(logs_path) as f:
            content = f.read().strip()
            if content:
                logs = json.loads(content)
    except Exception as e:
        print(f"  [LOGS] Error: {e}")

    recent = logs[-20:] if logs else []
    rows = ""
    for e in recent:
        status = e.get("status", "?")
        css = "error" if status == "error" else "success"
        ts = e.get("timestamp", "?")[:19]
        feat = e.get("feature_id", "?")
        er = e.get("error_rate_now", e.get("error_rate", "?"))
        if isinstance(er, float):
            er = f"{er:.2%}"
        rows += f'<tr><td>{ts}</td><td>{feat}</td><td class="{css}">{status}</td><td>{er}</td></tr>\n'

    page.set_content(f"""
    <html><head><style>
      body {{ font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }}
      h1 {{ color: #569cd6; }}
      table {{ border-collapse: collapse; width: 100%; }}
      th {{ background: #264f78; color: #fff; padding: 8px 12px; text-align: left; }}
      td {{ padding: 6px 12px; border-bottom: 1px solid #333; }}
      .error {{ color: #f44747; font-weight: bold; }}
      .success {{ color: #6a9955; }}
    </style></head><body>
    <h1>📊 logs.json — Traffic Events ({len(logs)} total)</h1>
    <table>
    <tr><th>Timestamp</th><th>Feature</th><th>Status</th><th>Error Rate</th></tr>
    {rows}
    </table>
    </body></html>
    """)
    wait(6, "showing logs")


# ── Scene 3.3: Final Slide ─────────────────────────────────
def scene_final(page):
    print("\n=== Scene 3.3: Final Slide (0:45-1:00) ===")
    page.set_content("""
    <html><head><style>
      body { font-family: -apple-system, sans-serif; background: #0d1117; color: #c9d1d9;
             display: flex; flex-direction: column; align-items: center; justify-content: center;
             height: 100vh; margin: 0; }
      h1 { font-size: 48px; color: #58a6ff; margin-bottom: 20px; }
      .stack { font-size: 20px; color: #8b949e; text-align: center; line-height: 2; }
      .check { color: #3fb950; }
    </style></head><body>
    <h1>M5 — n8n Agentic Workflows ✅</h1>
    <div class="stack">
      <span class="check">✅</span> WF1: Manual Trigger (Dashboard → AI Agent → MCP)<br>
      <span class="check">✅</span> WF2: Scheduled Monitor (Cron → AI → Telegram)<br>
      <span class="check">✅</span> Hallucination Guard (Switch + JSON Schema)<br>
      <span class="check">✅</span> Stress Test: 13 requests, all OK<br>
      <span class="check">✅</span> Telegram Alerts: deactivate ↔ reenable cycle<br>
      <span class="check">✅</span> Claude Haiku 4.5 • n8n 2.21.7 • Self-hosted Docker
    </div>
    </body></html>
    """)
    wait(5, "final slide")


def main():
    print("=" * 50)
    print("  Video 3: Results + Final")
    print("=" * 50)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            record_video_dir=OUTPUT_DIR,
            record_video_size={"width": WIDTH, "height": HEIGHT},
        )
        page = context.new_page()

        try:
            scene_dashboard_after(page)
            scene_logs(page)
            scene_final(page)
        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback; traceback.print_exc()
        finally:
            page.close()
            context.close()
            browser.close()

    # Find & rename WebM
    videos = sorted(_glob.glob(os.path.join(OUTPUT_DIR, "*.webm")), key=os.path.getmtime)
    webm_path = os.path.join(OUTPUT_DIR, "video3.webm")
    if videos:
        latest = videos[-1]
        if latest != webm_path:
            os.rename(latest, webm_path)
        size_mb = os.path.getsize(webm_path) / (1024 * 1024)
        print(f"\n[DONE] {webm_path} ({size_mb:.1f} MB)")

    # Convert to MP4
    mp4_path = os.path.join(OUTPUT_DIR, "video3_results.mp4")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", webm_path, "-c:v", "libx264",
             "-preset", "fast", "-crf", "23", "-c:a", "aac", mp4_path],
            check=True, capture_output=True, timeout=120)
        mp4_mb = os.path.getsize(mp4_path) / (1024 * 1024)
        print(f"  MP4: {mp4_path} ({mp4_mb:.1f} MB)")
    except Exception as e:
        print(f"  [WARN] ffmpeg: {e}")


if __name__ == "__main__":
    main()
