#!/usr/bin/env python3
"""Video 1: Dashboard + WF1 Canvas + Stress Test (~2:00)"""

import glob as _glob
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

# ── Constants ──────────────────────────────────────────────
N8N_URL = "http://localhost:5678"
N8N_EMAIL = "test@gmail.com"
N8N_PASSWORD = "1999lifeGood!"
WF1_ID = "jCiU37drHMGylcS3"
FRONTEND_URL = "http://localhost:3000"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
WIDTH, HEIGHT = 1280, 720

# Read API key from frontend/.env
API_KEY = ""
env_path = os.path.join(PROJECT_ROOT, "frontend", ".env")
if os.path.exists(env_path):
    for line in open(env_path):
        if line.startswith("REACT_APP_N8N_API_KEY="):
            API_KEY = line.split("=", 1)[1].strip()
            break


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


# ── Scene 1.1: Frontend Dashboard ──────────────────────────
def scene_dashboard(page):
    print("\n=== Scene 1.1: Frontend Dashboard (0:00-0:40) ===")
    page.goto(f"{FRONTEND_URL}/login")
    wait(2, "login page")
    safe_fill(page, '#email', 'admin@example.com')
    safe_fill(page, '#password', '123456')
    safe_click(page, 'button:has-text("Sign In")')
    wait(4, "logging in")

    page.goto(f"{FRONTEND_URL}/admin/featuredashboard")
    wait(4, "feature dashboard")

    page.evaluate("window.scrollTo(0, 0)")
    wait(3, "feature table")

    # Click 🔍 Check on first feature row (inline Auto-Pilot button)
    safe_click(page, '.ps-autopilot-btn:has-text("Check")', timeout=3000)
    wait(8, "AI Agent check")
    wait(3, "result")

    # Dismiss feedback alert if shown
    safe_click(page, '.ps-autopilot-feedback .btn-close', timeout=2000)
    wait(1)

    # Click ⛔ Off on first feature row (rollback)
    safe_click(page, '.ps-autopilot-btn:has-text("Off")', timeout=3000)
    wait(8, "AI Agent rollback")
    wait(3, "result")


# ── Scene 1.2: n8n WF1 Canvas ─────────────────────────────
def scene_wf1_canvas(page):
    print("\n=== Scene 1.2: n8n WF1 Canvas (0:40-1:10) ===")
    page.goto(f"{N8N_URL}/signin")
    wait(2, "n8n signin")
    safe_fill(page, 'input[autocomplete="email"]', N8N_EMAIL)
    safe_fill(page, 'input[autocomplete="current-password"]', N8N_PASSWORD)
    safe_click(page, 'button:has-text("Sign in")')
    wait(3, "logging in")

    page.goto(f"{N8N_URL}/workflow/{WF1_ID}")
    wait(4, "WF1 canvas")
    page.keyboard.press("Control+Shift+1")
    wait(2, "fit to screen")

    safe_click(page, '.vue-flow__node:has-text("AI Agent")', timeout=5000)
    wait(3, "AI Agent node")

    page.keyboard.press("Escape")
    wait(1)

    safe_click(page, '.vue-flow__node:has-text("Switch")', timeout=5000)
    wait(3, "Switch node")
    page.keyboard.press("Escape")
    wait(1)


# ── Scene 1.3: Stress Test ─────────────────────────────────
def scene_stress_test(page):
    print("\n=== Scene 1.3: Stress Test (1:10-2:00) ===")

    # Launch stress test subprocess
    stress_proc = subprocess.Popen(
        [sys.executable,
         os.path.join(PROJECT_ROOT, "homework/M5/simulators/simulate_wf1.py"),
         "--webhook-url", "http://localhost:5678/webhook",
         "--api-key", API_KEY,
         "--duration", "50", "--interval", "3", "--include-invalid"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        cwd=PROJECT_ROOT,
    )
    print("  [STARTED] simulate_wf1.py --include-invalid")

    # Show command HTML terminal
    page.set_content("""
    <html><head><style>
      body { font-family: 'Menlo', monospace; background: #1e1e1e; color: #d4d4d4; padding: 30px; }
      .prompt { color: #6a9955; }
      .cmd { color: #dcdcaa; font-size: 18px; }
      .title { color: #569cd6; font-size: 24px; margin-bottom: 20px; }
      .desc { color: #9cdcfe; font-size: 16px; margin-top: 10px; }
    </style></head><body>
    <div class="title">🚀 WF1 Stress Test + Hallucination Guard</div>
    <div>
      <span class="prompt">$ </span>
      <span class="cmd">python3 simulate_wf1.py --webhook-url http://localhost:5678/webhook \\</span><br>
      <span class="cmd">  --api-key $API_KEY --duration 50 --interval 3 --include-invalid</span>
    </div>
    <div class="desc">⏳ Running... 13+ requests with valid & invalid (-50%) traffic</div>
    </body></html>
    """)
    wait(5, "showing command")

    # Show n8n executions while stress test runs
    page.goto(f"{N8N_URL}/workflow/{WF1_ID}/executions")
    wait(5, "executions loading")
    for i in range(3):
        page.reload()
        wait(8, f"reload executions ({i+1}/3)")

    # Click first execution
    safe_click(page, '.executions-list .execution-card:first-child', timeout=3000)
    wait(5, "execution trace")

    # Wait for stress test to finish
    try:
        stress_proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        stress_proc.terminate()
        stress_proc.wait(timeout=5)

    output = stress_proc.stdout.read()
    lines = [l for l in output.strip().split('\n') if l.strip()]

    ok_count = sum(1 for l in lines if '200' in l and 'status=' in l)
    err_count = sum(1 for l in lines if '400' in l and 'status=' in l)

    # Show results HTML terminal
    line_html = ""
    for l in lines[-20:]:
        css = "ok" if "200" in l else ("err" if "400" in l else "")
        line_html += f'<div class="line {css}">{l}</div>'

    page.set_content(f"""
    <html><head><style>
      body {{ font-family: 'Menlo', monospace; background: #1e1e1e; color: #d4d4d4; padding: 30px; }}
      .title {{ color: #569cd6; font-size: 22px; margin-bottom: 15px; }}
      .line {{ font-size: 13px; line-height: 1.6; white-space: pre-wrap; }}
      .ok {{ color: #6a9955; }}
      .err {{ color: #f44747; }}
      .summary {{ color: #dcdcaa; font-size: 18px; margin-top: 15px;
                  border-top: 1px solid #444; padding-top: 10px; }}
    </style></head><body>
    <div class="title">📊 Stress Test Results — simulate_wf1.py</div>
    {line_html}
    <div class="summary">
      ✅ Valid requests → 200 OK: {ok_count} &nbsp;&nbsp;
      🚫 Invalid (-50%) → 400 Rejected: {err_count}
    </div>
    </body></html>
    """)
    wait(8, "showing results")


def main():
    print("=" * 50)
    print("  Video 1: Dashboard + WF1 + Stress Test")
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
            scene_dashboard(page)
            scene_wf1_canvas(page)
            scene_stress_test(page)
        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback; traceback.print_exc()
        finally:
            page.close()
            context.close()
            browser.close()

    # Find & rename WebM
    videos = sorted(_glob.glob(os.path.join(OUTPUT_DIR, "*.webm")), key=os.path.getmtime)
    webm_path = os.path.join(OUTPUT_DIR, "video1.webm")
    if videos:
        latest = videos[-1]
        if latest != webm_path:
            os.rename(latest, webm_path)
        size_mb = os.path.getsize(webm_path) / (1024 * 1024)
        print(f"\n[DONE] {webm_path} ({size_mb:.1f} MB)")

    # Convert to MP4
    mp4_path = os.path.join(OUTPUT_DIR, "video1_dashboard_wf1.mp4")
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
