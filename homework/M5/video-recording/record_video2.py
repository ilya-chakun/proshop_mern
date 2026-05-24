#!/usr/bin/env python3
"""Video 2: WF2 Canvas + Executions + Telegram Alerts (~2:00)"""

import base64
import glob as _glob
import json
import os
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

# ── Constants ──────────────────────────────────────────────
N8N_URL = "http://localhost:5678"
N8N_EMAIL = "test@gmail.com"
N8N_PASSWORD = "1999lifeGood!"
WF2_ID = "ZdsYUJjX5SdPtawd"
CHROME_PROFILE = "/var/folders/18/8c8trpkx49vfklpqc49f96240000gp/T/opencode/chrome_profile"

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


# ── Scene 2.1: WF2 Canvas ─────────────────────────────────
def scene_wf2_canvas(page):
    print("\n=== Scene 2.1: n8n WF2 Canvas (0:00-0:30) ===")
    page.goto(f"{N8N_URL}/signin")
    wait(2, "n8n signin")
    safe_fill(page, 'input[autocomplete="email"]', N8N_EMAIL)
    safe_fill(page, 'input[autocomplete="current-password"]', N8N_PASSWORD)
    safe_click(page, 'button:has-text("Sign in")')
    wait(3, "logging in")

    page.goto(f"{N8N_URL}/workflow/{WF2_ID}")
    wait(4, "WF2 canvas")
    page.keyboard.press("Control+Shift+1")
    wait(2, "fit to screen")

    safe_click(page, '.vue-flow__node:has-text("Schedule Trigger")', timeout=5000)
    wait(3, "Schedule Trigger")
    page.keyboard.press("Escape")
    wait(1)

    safe_click(page, '.vue-flow__node:has-text("Switch")', timeout=5000)
    wait(3, "Switch node")
    page.keyboard.press("Escape")
    wait(1)

    safe_click(page, '.vue-flow__node:has-text("Telegram")', timeout=5000)
    wait(3, "Telegram node")
    page.keyboard.press("Escape")
    wait(1)


# ── Scene 2.2: WF2 Executions ─────────────────────────────
def scene_wf2_executions(page):
    print("\n=== Scene 2.2: WF2 Executions (0:30-1:15) ===")
    page.goto(f"{N8N_URL}/workflow/{WF2_ID}/executions")
    wait(4, "executions loading")
    wait(3, "showing list")

    safe_click(page, '.executions-list .execution-card:first-child', timeout=3000)
    wait(5, "deactivate trace")
    page.keyboard.press("Control+Shift+1")
    wait(3, "fit")

    safe_click(page, '.vue-flow__node:has-text("Agent")', timeout=5000)
    wait(4, "AI Agent reasoning")

    page.goto(f"{N8N_URL}/workflow/{WF2_ID}/executions")
    wait(3)
    safe_click(page, '.executions-list .execution-card:nth-child(3)', timeout=3000)
    wait(5, "reenable trace")


# ── Scene 2.3: Telegram Alerts ─────────────────────────────
def scene_telegram(page, playwright_obj):
    print("\n=== Scene 2.3: Telegram Alerts (1:15-2:00) ===")
    use_fallback = False

    try:
        tg_browser = playwright_obj.chromium.launch_persistent_context(
            user_data_dir=CHROME_PROFILE,
            headless=True,
            viewport={"width": WIDTH, "height": HEIGHT},
            args=['--disable-gpu', '--no-sandbox'],
        )
        tg_page = tg_browser.pages[0] if tg_browser.pages else tg_browser.new_page()

        tg_page.goto("https://web.telegram.org/a/", wait_until="domcontentloaded")
        wait(6, "Telegram Web loading")

        # Check if logged in
        phone_input = tg_page.query_selector('input[type="tel"]')
        if phone_input:
            print("  [WARN] Telegram needs login — fallback")
            tg_browser.close()
            use_fallback = True
        else:
            # Click on "ProShop M5 Alerts" chat directly from chat list (left sidebar)
            # Try clicking the chat in the sidebar first (no search needed if visible)
            chat_clicked = False

            # Attempt 1: direct click in chat list
            try:
                tg_page.click('.ListItem:has-text("ProShop M5 Alerts")', timeout=3000)
                chat_clicked = True
                wait(3, "chat opened from list")
            except Exception:
                print("  [INFO] Chat not in visible list, searching...")

            # Attempt 2: use search
            if not chat_clicked:
                search = (tg_page.query_selector('#telegram-search-input') or
                          tg_page.query_selector('input[placeholder*="Search"]') or
                          tg_page.query_selector('.SearchInput input'))
                if search:
                    search.click()
                    wait(1)
                    search.fill("ProShop M5 Alerts")
                    wait(3, "searching chat")

                    # Click on the chat under "Chats and Contacts" heading (not Messages)
                    try:
                        # The chat result appears as a ListItem with "bot" subtitle
                        tg_page.click('.search-section:has-text("Chats") .ListItem:has-text("ProShop M5 Alerts")', timeout=3000)
                        chat_clicked = True
                    except Exception:
                        pass

                    if not chat_clicked:
                        # Fallback: click first matching ListItem
                        try:
                            tg_page.locator('.ListItem:has-text("ProShop M5 Alerts")').first.click(timeout=3000)
                            chat_clicked = True
                        except Exception:
                            pass

                    wait(3, "chat opened from search")

            if not chat_clicked:
                print("  [WARN] Could not open chat — fallback")
                tg_browser.close()
                use_fallback = True
            else:
                # Wait for chat messages to load
                wait(4, "waiting for messages to load")

                # Scroll UP first to show earlier messages (deactivate/reenable)
                tg_page.evaluate("""
                  const containers = [
                    document.querySelector('.MessageList'),
                    document.querySelector('[class*="MessageList"]'),
                    document.querySelector('#MiddleColumn .Transition__slide--active'),
                  ];
                  for (const el of containers) {
                    if (el) { el.scrollTop = 0; break; }
                  }
                """)
                wait(3, "scrolled to top (older messages)")

                # Take first screenshot showing older messages
                tg_screenshot1 = os.path.join(OUTPUT_DIR, "telegram_chat_top.png")
                tg_page.screenshot(path=tg_screenshot1)

                # Now scroll to bottom for latest messages
                tg_page.evaluate("""
                  const containers = [
                    document.querySelector('.MessageList'),
                    document.querySelector('[class*="MessageList"]'),
                    document.querySelector('#MiddleColumn .Transition__slide--active'),
                  ];
                  for (const el of containers) {
                    if (el) { el.scrollTop = el.scrollHeight; break; }
                  }
                """)
                wait(3, "scrolled to latest messages")

                tg_screenshot = os.path.join(OUTPUT_DIR, "telegram_chat.png")
                tg_page.screenshot(path=tg_screenshot)
                tg_browser.close()

                if os.path.getsize(tg_screenshot) < 10000:
                print("  [WARN] Screenshot too small — fallback")
                use_fallback = True
            else:
                # Show first screenshot (older messages with deactivate/reenable)
                with open(tg_screenshot1, "rb") as f:
                    img_b64_1 = base64.b64encode(f.read()).decode()

                page.set_content(f"""
                <html><head><style>
                  body {{ margin: 0; background: #17212b; display: flex; flex-direction: column;
                         align-items: center; justify-content: center; height: 100vh; }}
                  h1 {{ color: #64b5ef; font-family: -apple-system, sans-serif; margin-bottom: 10px; }}
                  .note {{ color: #8b949e; font-size: 14px; margin-bottom: 15px; font-family: sans-serif; }}
                  img {{ max-height: 85vh; max-width: 95vw; border-radius: 12px;
                         box-shadow: 0 4px 24px rgba(0,0,0,0.5); }}
                </style></head><body>
                <h1>📱 Telegram Bot — @proshop_m5_alerts_bot</h1>
                <div class="note">🚨 deactivate → ✅ reenable — Real AI Agent alerts via n8n</div>
                <img src="data:image/png;base64,{img_b64_1}" />
                </body></html>
                """)
                wait(6, "showing older Telegram messages")

                # Show second screenshot (latest messages)
                with open(tg_screenshot, "rb") as f:
                    img_b64_2 = base64.b64encode(f.read()).decode()

                page.set_content(f"""
                <html><head><style>
                  body {{ margin: 0; background: #17212b; display: flex; flex-direction: column;
                         align-items: center; justify-content: center; height: 100vh; }}
                  h1 {{ color: #64b5ef; font-family: -apple-system, sans-serif; margin-bottom: 10px; }}
                  .note {{ color: #8b949e; font-size: 14px; margin-bottom: 15px; font-family: sans-serif; }}
                  img {{ max-height: 85vh; max-width: 95vw; border-radius: 12px;
                         box-shadow: 0 4px 24px rgba(0,0,0,0.5); }}
                </style></head><body>
                <h1>📱 Telegram Bot — Latest Messages</h1>
                <div class="note">Continuous monitoring: error_rate, state changes, JSON payloads</div>
                <img src="data:image/png;base64,{img_b64_2}" />
                </body></html>
                """)
                wait(6, "showing latest Telegram messages")
    except Exception as e:
        print(f"  [WARN] Telegram Web failed: {e}")
        use_fallback = True

    if use_fallback:
        _telegram_fallback(page)


def _telegram_fallback(page):
    """Extract Telegram messages from n8n WF2 execution data."""
    print("  [FALLBACK] Using n8n execution data for Telegram messages")
    try:
        login_data = json.dumps({"emailOrLdapLoginId": N8N_EMAIL, "password": N8N_PASSWORD}).encode()
        login_req = urllib.request.Request(
            f"{N8N_URL}/rest/login",
            data=login_data, headers={"Content-Type": "application/json"})
        login_resp = urllib.request.urlopen(login_req)
        cookie = login_resp.headers.get("Set-Cookie", "")

        exec_req = urllib.request.Request(
            f"{N8N_URL}/rest/executions?workflowId={WF2_ID}&limit=10",
            headers={"Cookie": cookie})
        exec_resp = urllib.request.urlopen(exec_req)
        executions = json.loads(exec_resp.read())

        messages = []
        for ex in executions.get("data", []):
            run_data = ex.get("data", {}).get("resultData", {}).get("runData", {})
            for node_name, node_runs in run_data.items():
                if "Telegram" in node_name:
                    for run in node_runs:
                        for item in run.get("data", {}).get("main", [[]])[0]:
                            text = item.get("json", {}).get("text", "")
                            if text:
                                messages.append(text)

        msg_html = ""
        for m in messages[-6:]:
            css = "deactivate" if "🚨" in m else ("reenable" if "✅" in m else "")
            msg_html += f'<div class="msg {css}">{m}</div>'

        page.set_content(f"""
        <html><head><style>
          body {{ font-family: -apple-system, sans-serif; background: #17212b; color: #fff; padding: 40px; }}
          h1 {{ color: #64b5ef; }}
          .msg {{ background: #182533; border-radius: 12px; padding: 16px 20px; margin: 12px 0;
                  max-width: 600px; font-size: 15px; line-height: 1.5; white-space: pre-wrap; }}
          .deactivate {{ border-left: 3px solid #e53935; }}
          .reenable {{ border-left: 3px solid #43a047; }}
        </style></head><body>
        <h1>📱 Telegram Bot Alerts — @proshop_m5_alerts_bot</h1>
        {msg_html}
        </body></html>
        """)
        wait(8, "showing fallback Telegram messages")
    except Exception as e:
        print(f"  [ERROR] Fallback also failed: {e}")


def main():
    print("=" * 50)
    print("  Video 2: WF2 + Telegram")
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
            scene_wf2_canvas(page)
            scene_wf2_executions(page)
            scene_telegram(page, p)
        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback; traceback.print_exc()
        finally:
            page.close()
            context.close()
            browser.close()

    # Find & rename WebM
    videos = sorted(_glob.glob(os.path.join(OUTPUT_DIR, "*.webm")), key=os.path.getmtime)
    webm_path = os.path.join(OUTPUT_DIR, "video2.webm")
    if videos:
        latest = videos[-1]
        if latest != webm_path:
            os.rename(latest, webm_path)
        size_mb = os.path.getsize(webm_path) / (1024 * 1024)
        print(f"\n[DONE] {webm_path} ({size_mb:.1f} MB)")

    # Convert to MP4
    mp4_path = os.path.join(OUTPUT_DIR, "video2_wf2_telegram.mp4")
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
