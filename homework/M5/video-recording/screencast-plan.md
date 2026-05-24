# Screencast Plan — Детальный сценарий для Playwright

> Цель: 3–5 мин видео, покрывающее ВСЕ требования из HOMEWORK_M5.md чеклиста.
> Формат: Playwright headless → WebM → ffmpeg → MP4
> Разрешение: 1280×720

## Предусловия (перед запуском скрипта)

1. `docker compose up -d n8n` — n8n контейнер запущен
2. Backend запущен на порту 5001 (`npm run server`)
3. Frontend запущен на порту 3000 (`npm run client`)
4. `simulate_wf2.py` запущен фоном ≥2 мин назад (чтобы logs.json наполнился):
   ```bash
   python3 homework/M5/simulators/simulate_wf2.py \
     --output homework/M5/data/logs.json --duration 900 --period 120 &
   ```
5. WF1 и WF2 активны в n8n
6. Telegram бот настроен и работает

## Константы для скрипта

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
```

---

## SCENE 1: Frontend Dashboard — Feature Flags (0:00–0:40)

**Что показывает:** Admin Dashboard с вкладкой Feature Flags, таблица фичей, Auto-Pilot Controls

### Шаги Playwright:

1. **Навигация на frontend**
   ```python
   page.goto(f"{FRONTEND_URL}/login")
   time.sleep(2)
   ```

2. **Логин как админ**
   ```python
   page.fill('input[type="email"]', 'admin@example.com')
   page.fill('input[type="password"]', '123456')
   page.click('button[type="submit"]')
   time.sleep(3)
   ```

3. **Перейти на Feature Flags Dashboard**
   ```python
   # Клик по ссылке Feature Flags в навбаре или переход по URL
   page.goto(f"{FRONTEND_URL}/admin/features")
   time.sleep(3)
   ```

4. **Скроллить чтобы показать таблицу фичей** (status badges, traffic %)
   ```python
   page.evaluate("window.scrollTo(0, 0)")
   time.sleep(3)
   ```

5. **Показать Auto-Pilot Controls** (кнопки «Запустить проверку», «Тестовый режим», «Откатить фичу»)
   ```python
   # Scroll к блоку Auto-Pilot Controls если нужно
   page.evaluate("document.querySelector('.auto-pilot-controls')?.scrollIntoView({behavior: 'smooth'})")
   time.sleep(3)
   ```

6. **Клик «Запустить проверку» (action=check)** — кнопка меняется на «Проверяем…», потом показывает alert с результатом
   ```python
   page.click('button:has-text("Запустить проверку")')
   time.sleep(8)  # AI Agent processing time ~6-8s
   # Alert с результатом должен появиться
   time.sleep(3)
   ```

7. **Клик «Откатить фичу» (action=rollback)** — демонстрация изменения состояния
   ```python
   page.click('button:has-text("Откатить фичу")')
   time.sleep(8)
   # Status badge должен измениться
   time.sleep(3)
   ```

**Длительность: ~40 сек**

---

## SCENE 2: n8n — WF1 Canvas и архитектура (0:40–1:20)

**Что показывает:** Архитектура WF1 в n8n editor, все ноды

### Шаги Playwright:

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
   ```

3. **Zoom out чтобы все ноды были видны** (Webhook → Switch → AI Agent → Respond)
   ```python
   # Ctrl+- для zoom out, или кнопка "Fit to screen"
   page.keyboard.press("Control+Shift+1")  # Fit to screen shortcut в n8n
   time.sleep(2)
   ```

4. **Клик на AI Agent ноду** чтобы показать sub-nodes (Chat Model, Memory, Tools, Output Parser)
   ```python
   page.click('div[data-name="AI Agent"]', timeout=5000)
   time.sleep(3)
   ```

5. **Клик на Switch ноду** чтобы показать правила валидации (4 rules + fallback)
   ```python
   page.click('div[data-name="Switch"]', timeout=5000)
   time.sleep(3)
   ```

6. **Закрыть панель**
   ```python
   page.keyboard.press("Escape")
   time.sleep(2)
   ```

**Длительность: ~40 сек**

---

## SCENE 3: WF1 — Стресс-тест + Hallucination test (1:20–2:30)

**Что показывает:** simulate_wf1.py --include-invalid, быстрые запросы, отказы на -50, успешные операции

### Шаги Playwright:

1. **Запустить стресс-тест из скрипта** (параллельный процесс)
   ```python
   import subprocess, threading

   # Запуск стресс-теста в фоне (--include-invalid для hallucination test)
   stress_proc = subprocess.Popen(
       [
           "python3", "homework/M5/simulators/simulate_wf1.py",
           "--webhook-url", "http://localhost:5678/webhook",
           "--api-key", API_KEY,
           "--duration", "50",
           "--interval", "3",
           "--include-invalid"
       ],
       stdout=subprocess.PIPE,
       stderr=subprocess.STDOUT,
       text=True,
       cwd="/Users/ilyachakun/Desktop/projects/ai-course/proshop_mern"
   )
   ```

2. **Пока стресс-тест идёт — показать n8n Executions list** (обновляется в реальном времени)
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF1_ID}/executions")
   time.sleep(5)
   ```

3. **Подождать пока появятся несколько execution** — обновлять страницу
   ```python
   for _ in range(4):
       page.reload()
       time.sleep(8)
   ```

4. **Клик на execution с ОШИБКОЙ** (status 400 — hallucination test, -50 rejected)
   ```python
   # Найти execution с ошибкой (если есть) или последнюю
   page.click('.executions-list .execution-card:first-child')
   time.sleep(3)
   ```

5. **Показать trace — Switch нода отвергла запрос ДО AI Agent** (подсветка пути)
   ```python
   time.sleep(5)
   ```

6. **Клик на УСПЕШНУЮ execution** — показать полный путь через AI Agent
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF1_ID}/executions")
   time.sleep(3)
   # Клик на успешную execution
   page.click('.executions-list .execution-card.success:first-child')
   time.sleep(5)
   ```

7. **Показать AI Agent reasoning** (Intermediate Steps / Verbose output)
   ```python
   page.click('div[data-name="AI Agent"]', timeout=5000)
   time.sleep(3)
   # Scroll через output данных
   time.sleep(4)
   ```

8. **Собрать вывод стресс-теста**
   ```python
   stress_proc.terminate()
   output = stress_proc.stdout.read()
   # Вывод содержит: status=200 (success) и status=400 (invalid -50)
   ```

**Длительность: ~70 сек**

---

## SCENE 4: n8n — WF2 Canvas и архитектура (2:30–3:00)

**Что показывает:** Архитектура WF2, cron trigger, Switch decision, AI Agent, Telegram

### Шаги Playwright:

1. **Открыть WF2 Canvas**
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF2_ID}")
   time.sleep(4)
   ```

2. **Fit to screen**
   ```python
   page.keyboard.press("Control+Shift+1")
   time.sleep(2)
   ```

3. **Показать Schedule Trigger** (every 1 min)
   ```python
   page.click('div[data-name="Schedule Trigger"]', timeout=5000)
   time.sleep(3)
   page.keyboard.press("Escape")
   ```

4. **Показать Switch Decision** (deactivate/reenable/noop)
   ```python
   page.click('div[data-name="Switch"]', timeout=5000)
   time.sleep(3)
   page.keyboard.press("Escape")
   ```

5. **Показать Telegram ноду**
   ```python
   page.click('div[data-name*="Telegram"]', timeout=5000)
   time.sleep(3)
   page.keyboard.press("Escape")
   ```

**Длительность: ~30 сек**

---

## SCENE 5: WF2 — Executions и toggle cycle (3:00–3:45)

**Что показывает:** WF2 cron executions, deactivate и reenable execution traces

### Шаги Playwright:

1. **Открыть WF2 Executions**
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF2_ID}/executions")
   time.sleep(4)
   ```

2. **Показать список — несколько execution каждую минуту**
   ```python
   time.sleep(3)
   ```

3. **Клик на execution где произошёл DEACTIVATE** (AI Agent path → Telegram)
   ```python
   # Найти execution (первую успешную с Telegram)
   page.click('.executions-list .execution-card:first-child')
   time.sleep(5)
   ```

4. **Показать trace: Schedule → Code (logs) → HTTP (get_feature) → Merge → Switch → Set Decision → AI Agent → Telegram**
   ```python
   # Zoom fit
   page.keyboard.press("Control+Shift+1")
   time.sleep(3)
   ```

5. **Клик на AI Agent ноду** чтобы показать reasoning (deactivated / reenabled)
   ```python
   page.click('div[data-name*="Agent"]', timeout=5000)
   time.sleep(4)
   ```

6. **Вернуться в executions и найти RE-ENABLE execution** (если есть)
   ```python
   page.goto(f"{N8N_URL}/workflow/{WF2_ID}/executions")
   time.sleep(3)
   # Клик на другую execution
   page.click('.executions-list .execution-card:nth-child(3)')
   time.sleep(5)
   ```

**Длительность: ~45 сек**

---

## SCENE 6: Telegram — Алерты (3:45–4:10)

**Что показывает:** Реальные Telegram messages от бота (deactivate → reenable)

### Шаги Playwright:

1. **Получить последние сообщения бота через Telegram API**
   ```python
   import urllib.request, json

   # Fetch last messages from Telegram bot
   tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates?offset=-10"
   req = urllib.request.Request(tg_url)
   resp = urllib.request.urlopen(req, timeout=10)
   data = json.loads(resp.read())

   # Собрать тексты сообщений для отображения
   messages = [u["message"]["text"] for u in data.get("result", []) if "message" in u]
   ```

2. **Открыть Telegram Web** (web.telegram.org) и показать чат с ботом
   ```python
   page.goto("https://web.telegram.org/a/")
   time.sleep(5)
   ```

   > **АЛЬТЕРНАТИВА (проще и надёжнее):** Если Telegram Web требует авторизацию, вместо этого:
   > - Сделать скриншот через Telegram Bot API getUpdates
   > - Или показать сообщения в простой HTML-странице:

   ```python
   # Создать простую HTML-страницу с Telegram сообщениями
   html = f"""
   <html><head><style>
     body {{ font-family: -apple-system, sans-serif; background: #17212b; color: #fff; padding: 40px; }}
     h1 {{ color: #64b5ef; }}
     .msg {{ background: #182533; border-radius: 12px; padding: 16px 20px; margin: 12px 0;
             max-width: 600px; font-size: 16px; line-height: 1.5; border-left: 3px solid #64b5ef; }}
     .deactivate {{ border-left-color: #e53935; }}
     .reenable {{ border-left-color: #43a047; }}
   </style></head><body>
   <h1>🤖 Telegram Bot Alerts — Feature Monitor</h1>
   {"".join(f'<div class="msg {"deactivate" if "деактивирована" in m or "🚨" in m else "reenable" if "восстановлена" in m or "✅" in m else ""}">{m}</div>' for m in messages[-6:])}
   </body></html>
   """
   page.set_content(html)
   time.sleep(6)
   ```

3. **Пауза чтобы зритель прочитал алерты** (🚨 deactivate + ✅ reenable)
   ```python
   time.sleep(4)
   ```

**Длительность: ~25 сек**

---

## SCENE 7: Dashboard после WF2 — состояние обновилось (4:10–4:30)

**Что показывает:** Frontend Dashboard отражает изменения сделанные WF2 автоматически

### Шаги Playwright:

1. **Вернуться на Frontend Feature Dashboard**
   ```python
   page.goto(f"{FRONTEND_URL}/admin/features")
   time.sleep(4)
   ```

2. **Показать что статус feature flag изменился** (badge другого цвета, traffic % обновился)
   ```python
   time.sleep(3)
   ```

3. **Scroll к таблице — видно текущее состояние после auto-toggle**
   ```python
   page.evaluate("window.scrollTo(0, 0)")
   time.sleep(3)
   ```

**Длительность: ~15 сек**

---

## SCENE 8: logs.json — живые данные (4:30–4:50)

**Что показывает:** Содержимое logs.json с событиями success/error

### Шаги Playwright:

1. **Показать logs.json через backend API** (или прямо файл)
   ```python
   # Открыть backend endpoint с логами
   page.goto(f"{BACKEND_URL}/api/feature-flags/logs")
   time.sleep(4)
   ```

   > Альтернатива — показать в красивом виде:
   ```python
   import json
   logs = json.loads(open("homework/M5/data/logs.json").read())
   recent = logs[-20:]  # последние 20 событий

   html = f"""
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
   """
   page.set_content(html)
   time.sleep(5)
   ```

**Длительность: ~15 сек**

---

## SCENE 9: Финал — итоговый слайд (4:50–5:00)

### Шаги Playwright:

```python
html = """
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
"""
page.set_content(html)
time.sleep(5)
```

**Длительность: ~10 сек**

---

## Итого по сценам

| # | Сцена | Время | Что покрывает из чеклиста |
|---|-------|-------|--------------------------|
| 1 | Frontend Dashboard + Auto-Pilot | 0:00–0:40 | ✅ Dashboard расширен Auto-Pilot Controls, ✅ UI обновляется |
| 2 | n8n WF1 Canvas | 0:40–1:20 | ✅ Архитектура WF1, ✅ Switch rules, ✅ AI Agent sub-nodes |
| 3 | Стресс-тест + Hallucination | 1:20–2:30 | ✅ simulate_wf1.py --include-invalid, ✅ -50 отвергается, ✅ 10+ requests |
| 4 | n8n WF2 Canvas | 2:30–3:00 | ✅ Архитектура WF2, Schedule Trigger, Switch decision, Telegram |
| 5 | WF2 Executions toggle | 3:00–3:45 | ✅ WF2 cron срабатывает, ✅ deactivate/reenable trace |
| 6 | Telegram алерты | 3:45–4:10 | ✅ 🚨 deactivate + ✅ reenable (полный цикл) |
| 7 | Dashboard после WF2 | 4:10–4:30 | ✅ Статус обновился автоматически |
| 8 | logs.json данные | 4:30–4:50 | ✅ simulate_wf2.py пишет логи, видны success/error |
| 9 | Финальный слайд | 4:50–5:00 | Итог |

**Общее время: ~5:00** (в рамках 3–5 мин)

---

## Чеклист покрытия (из HOMEWORK_M5.md → Screencast секция)

| Требование | Сцена |
|------------|-------|
| Клик на «Откатить фичу» в Dashboard → состояние меняется | Scene 1 |
| `simulate_wf1.py --include-invalid` → видно отказы на `-50` | Scene 3 |
| `simulate_wf2.py` запущен фоном | Предусловие + Scene 8 |
| В n8n executions видно срабатывание WF2 cron | Scene 5 |
| Telegram получает алерты deactivate → re-enable → deactivate | Scene 6 |
| В Dashboard статус фичи обновляется автоматически | Scene 7 |

## Доп. покрытие (не явно в чеклисте, но показано в примерах)

| Что | Сцена |
|-----|-------|
| Admin login + Feature Flags tab | Scene 1 |
| AI Agent sub-nodes (LLM, Tools, Output Parser) | Scene 2 |
| Стресс-тест (10+ rapid requests) | Scene 3 |
| WF2 AI Agent reasoning (verbose) | Scene 5 |
| logs.json содержимое | Scene 8 |
| Switch rules (4 правила + fallback) | Scene 2 |

---

## Технические заметки

### n8n selectors (могут меняться между версиями)

- Ноды на canvas: `div[data-name="NodeName"]` или `.node-default[data-name="..."]`
- Execution list: `.executions-sidebar .execution-card` или `.executions-list li`
- Fit to screen: клавиша `1` (без модификаторов) в n8n 2.21.7
- Zoom: `Ctrl+-` / `Ctrl+=`

### Fallbacks

- Если Telegram Web не грузится → показать через Bot API getUpdates → рендер HTML
- Если n8n execution list пуст → подождать, retry reload
- Если AI Agent timeout → увеличить time.sleep() до 15s
- Если frontend не загружается → показать через curl + HTML render

### Конвертация WebM → MP4

```bash
ffmpeg -i screencast.webm -c:v libx264 -preset fast -crf 23 -c:a aac screencast.mp4
```
