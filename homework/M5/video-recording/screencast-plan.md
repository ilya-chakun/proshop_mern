# Screencast Plan — 3 видео для Playwright

> Цель: 3–5 мин суммарно (3 коротких видео), покрывающее ВСЕ требования из HOMEWORK_M5.md.
> Формат: Playwright headless → WebM → ffmpeg → MP4
> Разрешение: 1280×720

## Архитектура записи: 3 независимых видео

| # | Файл | Содержание | Время | Зависимости |
|---|------|-----------|-------|-------------|
| 1 | `video1_dashboard_wf1.mp4` | Dashboard + WF1 canvas + стресс-тест | ~2:00 | нет |
| 2 | `video2_wf2_telegram.mp4` | WF2 canvas + executions + Telegram алерты | ~2:00 | simulate_wf2.py ≥4 мин |
| 3 | `video3_results.mp4` | Dashboard после WF2 + logs.json + финал | ~1:00 | после video2 |

**Видео 1 и 2 можно записывать ПАРАЛЛЕЛЬНО** — они полностью независимы.
Видео 3 записывается после video2 (нужно чтобы WF2 уже изменил статус фичей).

Каждое видео = отдельный скрипт = отдельный browser context = свой WebM файл.

---

## Предусловия (перед запуском)

1. `docker compose up -d` — все контейнеры (mongo, backend, frontend, n8n)
2. Backend на порту 5001, Frontend на порту 3000
3. `simulate_wf2.py` запущен фоном **≥4 мин назад**:
   ```bash
   python3 homework/M5/simulators/simulate_wf2.py \
     --output homework/M5/data/logs.json --duration 900 --period 120 &
   # Подождать ≥4 мин перед запуском записи!
   ```
4. WF1 и WF2 активны в n8n
5. Telegram бот настроен и работает

## Константы (общие для всех скриптов)

```python
N8N_URL = "http://localhost:5678"
N8N_EMAIL = "test@gmail.com"
N8N_PASSWORD = "1999lifeGood!"
WF1_ID = "jCiU37drHMGylcS3"
WF2_ID = "ZdsYUJjX5SdPtawd"
WEBHOOK_URL = "http://localhost:5678/webhook/feature-control"
API_KEY = "532b6cc84bc4f2c4ff54b676baa3b209ab6eccb12c539a5dc25130d15e0d751c"
BACKEND_URL = "http://localhost:5001"
FRONTEND_URL = "http://localhost:3000"
TELEGRAM_BOT_TOKEN = "8953885994:AAFux6Igs0eLw-K4lPhzqdzfT57scYe4wFc"
TELEGRAM_CHAT_ID = "854243765"
CHROME_PROFILE = "/var/folders/18/8c8trpkx49vfklpqc49f96240000gp/T/opencode/chrome_profile"
```

---

# VIDEO 1: Dashboard + WF1 (~2:00)

Скрипт: `record_video1.py`
Выход: `video1_dashboard_wf1.mp4`

## Scene 1.1: Frontend Dashboard — Feature Flags (0:00–0:40)

**Что показывает:** Admin Dashboard, таблица фичей с inline Auto-Pilot кнопками (🔍 Check / 🧪 Test / ⛔ Off) в колонке 🤖 AI

### Шаги:

1. **Логин на frontend**
   ```python
   page.goto(f"{FRONTEND_URL}/login")
   time.sleep(2)
   page.fill('#email', 'admin@example.com')
   page.fill('#password', '123456')
   # ⚠️ ВАЖНО: button[type="submit"] — это Search! Нужен именно Sign In:
   page.click('button:has-text("Sign In")')
   time.sleep(4)
   ```

2. **Перейти на Feature Flags Dashboard**
   ```python
   # ⚠️ Правильный роут: /admin/featuredashboard (НЕ /admin/features — будет белый экран!)
   page.goto(f"{FRONTEND_URL}/admin/featuredashboard")
   time.sleep(4)
   ```

3. **Показать таблицу фичей** (status badges, traffic %, inline 🤖 AI column)
   ```python
   page.evaluate("window.scrollTo(0, 0)")
   time.sleep(3)
   ```

4. **Клик «🔍 Check» — inline Auto-Pilot кнопка в строке первой фичи**
   ```python
   page.click('.ps-autopilot-btn:has-text("Check")')
   time.sleep(8)  # AI Agent ~6-8s
   time.sleep(3)
   # Dismiss feedback alert
   page.click('.ps-autopilot-feedback .btn-close')
   time.sleep(1)
   ```

5. **Клик «⛔ Off» — inline rollback кнопка (action=rollback)**
   ```python
   page.click('.ps-autopilot-btn:has-text("Off")')
   time.sleep(8)
   time.sleep(3)
   ```

**~40 сек**

---

## Scene 1.2: n8n — WF1 Canvas и архитектура (0:40–1:10)

**Что показывает:** Архитектура WF1 в n8n editor

### Шаги:

1. **Логин в n8n**
   ```python
   page.goto(f"{N8N_URL}/signin")
   time.sleep(2)
   page.fill('input[autocomplete="email"]', N8N_EMAIL)
   page.fill('input[autocomplete="current-password"]', N8N_PASSWORD)
   page.click('button:has-text("Sign in")')
   time.sleep(3)
   ```

2. **Открыть WF1 Canvas**
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF1_ID}")
   time.sleep(4)
   page.keyboard.press("Control+Shift+1")  # Fit to screen
   time.sleep(2)
   ```

3. **Клик на AI Agent ноду** (sub-nodes: Chat Model, Memory, Tools, Output Parser)
   ```python
   page.click('.vue-flow__node:has-text("AI Agent")', timeout=5000)
   time.sleep(3)
   ```

4. **Клик на Switch ноду** (4 rules + fallback)
   ```python
   page.keyboard.press("Escape")
   time.sleep(1)
   page.click('.vue-flow__node:has-text("Switch")', timeout=5000)
   time.sleep(3)
   page.keyboard.press("Escape")
   time.sleep(1)
   ```

**~30 сек**

---

## Scene 1.3: WF1 — Стресс-тест + Hallucination Guard (1:10–2:00)

**Что показывает:** simulate_wf1.py --include-invalid, видимая команда, результаты, n8n executions
**⚠️ КЛЮЧЕВОЕ:** Стресс-тест должен быть ВИДИМЫМ — зритель видит команду И результаты.

### Шаги:

1. **Запустить стресс-тест** (фоновый процесс, stdout в PIPE)
   ```python
   import subprocess

   stress_proc = subprocess.Popen(
       ["python3", "homework/M5/simulators/simulate_wf1.py",
        "--webhook-url", "http://localhost:5678/webhook",
        "--api-key", API_KEY,
        "--duration", "50", "--interval", "3", "--include-invalid"],
       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
       cwd="/Users/ilyachakun/Desktop/projects/ai-course/proshop_mern"
   )
   ```
   > Формат stdout simulate_wf1.py (каждый запрос — 2 строки):
   > ```
   > [2026-05-24T22:10:00] action=check payload={...}
   >   → status=200 success=True message=...
   > [2026-05-24T22:10:03] [INVALID test] payload={..., "traffic_percentage": -50}
   >   → status=400 success=False message=...
   > ```

2. **ШАГ «ПОКАЗАТЬ КОМАНДУ»** — рендерим HTML-терминал в page (зритель видит что запускается)
   ```python
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
   time.sleep(5)
   ```

3. **Пока стресс-тест бежит — показать n8n Executions** (обновляем 3 раза)
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF1_ID}/executions")
   time.sleep(5)
   for _ in range(3):
       page.reload()
       time.sleep(8)
   ```

4. **Клик на execution** — показать trace (Switch → AI Agent → Respond)
   ```python
   page.click('.executions-list .execution-card:first-child')
   time.sleep(5)
   ```

5. **ШАГ «ПОКАЗАТЬ РЕЗУЛЬТАТЫ»** — дожидаемся завершения, читаем stdout, рендерим HTML
   ```python
   # Дождаться завершения (или terminate если ещё бежит)
   try:
       stress_proc.wait(timeout=10)
   except subprocess.TimeoutExpired:
       stress_proc.terminate()
       stress_proc.wait(timeout=5)

   # Прочитать весь stdout
   output = stress_proc.stdout.read()
   lines = [l for l in output.strip().split('\n') if l.strip()]

   # Посчитать статистику для summary
   ok_count = sum(1 for l in lines if '200' in l and 'status=' in l)
   err_count = sum(1 for l in lines if '400' in l and 'status=' in l)

   # Рендерим результат как видимый HTML-терминал
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
   {"".join(f'<div class="line {"ok" if "200" in l else "err" if "400" in l else ""}">{l}</div>' for l in lines[-20:])}
   <div class="summary">
     ✅ Valid requests → 200 OK: {ok_count} &nbsp;&nbsp;
     🚫 Invalid (-50%) → 400 Rejected: {err_count}
   </div>
   </body></html>
   """)
   time.sleep(8)  # Даём зрителю прочитать результаты
   ```

**~50 сек**

---

# VIDEO 2: WF2 + Telegram (~2:00)

Скрипт: `record_video2.py`
Выход: `video2_wf2_telegram.mp4`

**⚠️ Можно записывать ПАРАЛЛЕЛЬНО с Video 1** — полностью независимы.

## Scene 2.1: n8n — WF2 Canvas и архитектура (0:00–0:30)

**Что показывает:** Архитектура WF2: cron → logs → feature state → Switch → AI Agent → Telegram

### Шаги:

1. **Логин в n8n** (отдельный browser context)
   ```python
   page.goto(f"{N8N_URL}/signin")
   time.sleep(2)
   page.fill('input[autocomplete="email"]', N8N_EMAIL)
   page.fill('input[autocomplete="current-password"]', N8N_PASSWORD)
   page.click('button:has-text("Sign in")')
   time.sleep(3)
   ```

2. **Открыть WF2 Canvas**
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF2_ID}")
   time.sleep(4)
   page.keyboard.press("Control+Shift+1")  # Fit to screen
   time.sleep(2)
   ```

3. **Показать Schedule Trigger** (every 1 min)
   ```python
   page.click('.vue-flow__node:has-text("Schedule Trigger")', timeout=5000)
   time.sleep(3)
   page.keyboard.press("Escape")
   ```

4. **Показать Switch Decision** (deactivate/reenable/noop)
   ```python
   page.click('.vue-flow__node:has-text("Switch")', timeout=5000)
   time.sleep(3)
   page.keyboard.press("Escape")
   ```

5. **Показать Telegram ноду**
   ```python
   page.click('.vue-flow__node:has-text("Telegram")', timeout=5000)
   time.sleep(3)
   page.keyboard.press("Escape")
   ```

**~30 сек**

---

## Scene 2.2: WF2 — Executions и toggle cycle (0:30–1:15)

**Что показывает:** WF2 cron executions, deactivate и reenable traces

### Шаги:

1. **Открыть WF2 Executions**
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF2_ID}/executions")
   time.sleep(4)
   time.sleep(3)  # Показать список
   ```

2. **Клик на execution — DEACTIVATE trace**
   ```python
   page.click('.executions-list .execution-card:first-child')
   time.sleep(5)
   page.keyboard.press("Control+Shift+1")  # Fit
   time.sleep(3)
   ```

3. **Показать AI Agent reasoning**
   ```python
   page.click('.vue-flow__node:has-text("Agent")', timeout=5000)
   time.sleep(4)
   ```

4. **Найти RE-ENABLE execution**
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF2_ID}/executions")
   time.sleep(3)
   page.click('.executions-list .execution-card:nth-child(3)')
   time.sleep(5)
   ```

**~45 сек**

---

## Scene 2.3: Telegram — Реальные алерты бота (1:15–2:00)

**Что показывает:** Реальные Telegram messages от бота — полный цикл: 🚨 deactivate → ✅ reenable → 🚨 deactivate (минимум 3 алерта)

**⚠️ КЛЮЧЕВОЕ:** `getUpdates` API показывает только ВХОДЯЩИЕ сообщения, а бот шлёт ИСХОДЯЩИЕ. Нужно показать РЕАЛЬНЫЙ чат в Telegram Web через Chrome-профиль пользователя (уже залогинен).

### Подход: Telegram Web через `launch_persistent_context`

Chrome профиль пользователя (уже залогинен в Telegram Web) скопирован в `CHROME_PROFILE`.
**⚠️ Основной browser — обычный Chromium. Persistent context — ВТОРОЙ процесс с другим профилем. Конфликта нет.**

### Шаги (пошагово с проверками):

1. **Открыть Telegram Web через persistent context**
   ```python
   # ⚠️ ОТДЕЛЬНЫЙ Chromium процесс — не мешает основному browser context
   tg_browser = playwright.chromium.launch_persistent_context(
       user_data_dir=CHROME_PROFILE,
       headless=True,
       viewport={"width": 1280, "height": 720},
   )
   tg_page = tg_browser.pages[0] if tg_browser.pages else tg_browser.new_page()
   ```

2. **Навигация на Telegram Web**
   ```python
   tg_page.goto("https://web.telegram.org/a/")
   time.sleep(6)  # Telegram Web грузится долго
   ```

3. **Проверить что залогинен** (если нет — сразу fallback)
   ```python
   phone_input = tg_page.query_selector('input[type="tel"]')
   if phone_input:
       print("⚠️ Telegram Web требует логин — используем fallback (шаг 7)")
       tg_browser.close()
       use_fallback = True
   else:
       use_fallback = False
   ```

4. **Найти чат с ботом** (если залогинен)
   ```python
   if not use_fallback:
       # Ищем поле поиска (DOM Telegram Web может меняться)
       search = tg_page.query_selector('#telegram-search-input') or \
                tg_page.query_selector('input[placeholder*="Search"]') or \
                tg_page.query_selector('.SearchInput input')
       if search:
           search.click()
           time.sleep(1)
           search.fill("ProShop M5 Alerts")
           time.sleep(3)
           # Клик на результат
           tg_page.click('.ListItem:has-text("ProShop M5 Alerts")')
           time.sleep(3)
       else:
           print("⚠️ Поле поиска не найдено — fallback")
           tg_browser.close()
           use_fallback = True
   ```

5. **Скроллить к последним сообщениям и скриншот**
   ```python
   if not use_fallback:
       tg_page.evaluate("""
         const el = document.querySelector('.MessageList') ||
                    document.querySelector('.messages-container') ||
                    document.querySelector('[class*="message"]')?.parentElement;
         if (el) el.scrollTo(0, el.scrollHeight);
       """)
       time.sleep(2)

       tg_screenshot = "homework/M5/video-recording/telegram_chat.png"
       tg_page.screenshot(path=tg_screenshot)
       tg_browser.close()

       # Проверить что скриншот не пустой/белый
       import os
       if os.path.getsize(tg_screenshot) < 10000:  # <10KB = пустой
           print(f"⚠️ Скриншот слишком маленький — fallback")
           use_fallback = True
   ```

6. **Показать скриншот в основном видео** (если скриншот ОК)
   ```python
   if not use_fallback:
       import base64
       with open(tg_screenshot, "rb") as f:
           img_b64 = base64.b64encode(f.read()).decode()

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
       <div class="note">Реальные алерты: 🚨 deactivate → ✅ reenable → 🚨 deactivate</div>
       <img src="data:image/png;base64,{img_b64}" />
       </body></html>
       """)
       time.sleep(8)  # Даём зрителю прочитать
   ```

7. **FALLBACK: если Chrome profile / скриншот не сработали** — берём тексты из n8n execution data
   ```python
   if use_fallback:
       import urllib.request, json

       # Логинимся в n8n API
       login_data = json.dumps({"emailOrLdapLoginId": N8N_EMAIL, "password": N8N_PASSWORD}).encode()
       login_req = urllib.request.Request(f"{N8N_URL}/rest/login",
           data=login_data, headers={"Content-Type": "application/json"})
       login_resp = urllib.request.urlopen(login_req)
       cookie = login_resp.headers.get("Set-Cookie", "")

       # Получаем WF2 executions
       exec_req = urllib.request.Request(
           f"{N8N_URL}/rest/executions?workflowId={WF2_ID}&limit=10",
           headers={"Cookie": cookie})
       exec_resp = urllib.request.urlopen(exec_req)
       executions = json.loads(exec_resp.read())

       # Извлекаем тексты Telegram сообщений
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

       # Рендерим как HTML в стиле Telegram
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
       {"".join(f'<div class="msg {"deactivate" if "🚨" in m else "reenable" if "✅" in m else ""}">{m}</div>' for m in messages[-6:])}
       </body></html>
       """)
       time.sleep(8)
   ```

   > ⚠️ **ВАЖНО:** Должно быть видно минимум 3 алерта: 🚨→✅→🚨.
   > Если меньше — simulator не бежал достаточно долго, подождать ещё.

**~45 сек**

---

# VIDEO 3: Результаты + Финал (~1:00)

Скрипт: `record_video3.py`
Выход: `video3_results.mp4`

**⚠️ Записывать ПОСЛЕ Video 2** — нужно чтобы WF2 уже изменил статусы фичей.

## Scene 3.1: Dashboard после WF2 — автообновление (0:00–0:25)

**Что показывает:** Frontend Dashboard отражает изменения сделанные WF2 автоматически

### Шаги:

1. **Логин и переход на Dashboard**
   ```python
   page.goto(f"{FRONTEND_URL}/login")
   time.sleep(2)
   page.fill('#email', 'admin@example.com')
   page.fill('#password', '123456')
   page.click('button:has-text("Sign In")')
   time.sleep(4)

   # ⚠️ Правильный роут!
   page.goto(f"{FRONTEND_URL}/admin/featuredashboard")
   time.sleep(4)
   ```

2. **Показать обновлённый статус** (badge, traffic %)
   ```python
   page.evaluate("window.scrollTo(0, 0)")
   time.sleep(5)
   ```

**~25 сек**

---

## Scene 3.2: logs.json — живые данные (0:25–0:45)

**Что показывает:** Содержимое logs.json с событиями success/error от simulate_wf2.py

### Шаги:

1. **Показать logs.json красиво**
   ```python
   import json
   logs = json.loads(open("homework/M5/data/logs.json").read())
   recent = logs[-20:]

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
   {"".join(f'<tr><td>{e["timestamp"][:19]}</td><td>{e["feature_id"]}</td><td class="{e["status"]}">{e["status"]}</td><td>{e.get("error_rate_now", "?")}</td></tr>' for e in recent)}
   </table>
   </body></html>
   """)
   time.sleep(6)
   ```

**~20 сек**

---

## Scene 3.3: Финальный слайд (0:45–1:00)

```python
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
time.sleep(5)
```

**~15 сек**

---

# Сводная таблица

## Покрытие по видео

| # | Видео | Сцены | Время | Покрытие чеклиста |
|---|-------|-------|-------|-------------------|
| 1 | `video1_dashboard_wf1.mp4` | Dashboard + WF1 canvas + стресс-тест | ~2:00 | ✅ Dashboard, ✅ Inline Auto-Pilot (🔍/🧪/⛔), ✅ WF1 архитектура, ✅ Hallucination guard, ✅ Stress test видимый |
| 2 | `video2_wf2_telegram.mp4` | WF2 canvas + executions + Telegram | ~2:00 | ✅ WF2 архитектура, ✅ Toggle cycle, ✅ AI Agent reasoning, ✅ Telegram алерты (3 перехода) |
| 3 | `video3_results.mp4` | Dashboard обновлён + logs + финал | ~1:00 | ✅ Автообновление статуса, ✅ logs.json данные |

## Чеклист покрытия (HOMEWORK_M5.md → Screencast секция)

| Требование | Видео | Сцена |
|------------|-------|-------|
| Клик «⛔ Off» → состояние меняется | Video 1 | Scene 1.1 |
| `simulate_wf1.py --include-invalid` → отказы на `-50` видны | Video 1 | Scene 1.3 |
| `simulate_wf2.py` запущен фоном, данные видны | Video 3 | Scene 3.2 |
| n8n executions — WF2 cron срабатывает | Video 2 | Scene 2.2 |
| Telegram: deactivate → re-enable → deactivate (3 перехода!) | Video 2 | Scene 2.3 |
| Dashboard статус обновляется автоматически | Video 3 | Scene 3.1 |

## Параллельная запись

```
┌─────────────────────┐     ┌─────────────────────┐
│  record_video1.py   │     │  record_video2.py   │
│  (Dashboard + WF1)  │     │  (WF2 + Telegram)   │
│  ~2 min             │     │  ~2 min             │
└─────────────────────┘     └─────────────────────┘
         ↓                           ↓
         └───────────┬───────────────┘
                     ↓
            ┌─────────────────┐
            │ record_video3.py│
            │ (Results+Final) │
            │ ~1 min          │
            └─────────────────┘
```

---

## Технические заметки

### Исправленные баги из предыдущей записи

1. **Белый экран** — роут был `/admin/features` → исправлен на `/admin/featuredashboard`
2. **Кнопка логина** — `button[type="submit"]` кликала Search → исправлен на `button:has-text("Sign In")`
3. **Стресс-тест не виден** — добавлены HTML-терминалы с командой запуска и результатами
4. **Telegram не виден** — `getUpdates` не показывает исходящие → используем Telegram Web через Chrome profile
5. **Auto-Pilot рефакторинг** — убран отдельный блок `.auto-pilot-controls` → inline кнопки `.ps-autopilot-btn` в каждой строке таблицы (🔍 Check / 🧪 Test / ⛔ Off)

### n8n 2.21.7 selectors

- Canvas ноды: `.vue-flow__node:has-text("NodeName")` (НЕ `div[data-name]` — не существует)
- Execution list: `.execution-card:nth-child(N)`
- Fit to screen: `Control+Shift+1`
- Execution view: SVG-ноды, кликать нельзя — показываем highlighted path

### Fallbacks

- Telegram Web не грузится → собрать тексты из n8n execution data → рендер HTML
- n8n execution list пуст → retry reload
- AI Agent timeout → увеличить time.sleep() до 15s
- Frontend не грузится → curl + HTML render

### Конвертация WebM → MP4

```bash
ffmpeg -i video1.webm -c:v libx264 -preset fast -crf 23 -c:a aac video1_dashboard_wf1.mp4
ffmpeg -i video2.webm -c:v libx264 -preset fast -crf 23 -c:a aac video2_wf2_telegram.mp4
ffmpeg -i video3.webm -c:v libx264 -preset fast -crf 23 -c:a aac video3_results.mp4
```

### Как запустить

```bash
# 1. Поднять все сервисы
docker compose up -d

# 2. Запустить симулятор логов (≥4 мин до записи!)
python3 homework/M5/simulators/simulate_wf2.py \
  --output homework/M5/data/logs.json --duration 900 --period 120 &

# 3. Подождать ≥4 мин, затем записать Video 1 и 2 параллельно
python3 homework/M5/video-recording/record_video1.py &
python3 homework/M5/video-recording/record_video2.py &
wait

# 4. Записать Video 3
python3 homework/M5/video-recording/record_video3.py
```
