# M5 Homework Plan — n8n Agentic Workflows

## Overview

Build two n8n workflows integrating M3 (MCP server) + M4 (Feature Dashboard) + M5 (AI Agent):
- **WF1**: Manual trigger from Dashboard — UI buttons → n8n webhook → AI Agent → MCP → UI update
- **WF2**: Scheduled defensive monitor — cron reads logs.json → AI Agent auto-toggles features → Telegram alerts
- **Hallucination test**: Prove Algorithm-before-AI with `traffic_percentage: -50`
- **Two Python simulators**: sine-wave driven dispatchers for both workflows

**Estimated time**: 4–6 hours total

---

## Разделение работы: AI vs Человек

### Что делает AI (я) — автоматически

| # | Задача | Статус |
|---|--------|--------|
| 1 | Добавить n8n в `docker-compose.yml` + запустить | Код + Docker |
| 2 | Создать `AutoPilotControls.jsx` компонент | Код |
| 3 | Интегрировать в `FeatureDashboardScreen.js` | Код |
| 4 | Добавить `REACT_APP_*` env-переменные во frontend | Код |
| 5 | Сгенерировать `wf1-manual-trigger.json` (готовый к импорту) | Код |
| 6 | Сгенерировать `wf2-scheduled-monitor.json` (готовый к импорту) | Код |
| 7 | Написать GCAO system prompts (WF1 + WF2) | Код |
| 8 | Создать `simulate_wf1.py` | Код |
| 9 | Создать `simulate_wf2.py` | Код |
| 10 | Добавить JSON Schema валидацию в MCP сервер (если нет) | Код |
| 11 | Написать `docs/m5/README.md` | Код |
| 12 | Проверить MCP сервер через feature-flags MCP tools | Код |
| 13 | Запустить n8n Docker и убедиться что UI доступен | Docker |
| 14 | Сгенерировать `logs.json` прогоном `simulate_wf2.py` | Код |

### Что делает человек (вы) — ручные шаги

> **UPDATE:** Шаги H3–H5 были автоматизированы через n8n REST API (см. ниже).
> Человек делал только H1–H2 (Telegram бот) + положил креды в файлы.

| # | Задача | Время | Статус / Как сделано |
|---|--------|-------|----------------------|
| H1 | Создать Telegram-бота через @BotFather | 5 мин | ✅ Вручную (нужен Telegram аккаунт) |
| H2 | Найти `chat_id` Telegram | 3 мин | ✅ Вручную (нужно написать боту /start) |
| H3 | Импортировать 2 JSON workflow в n8n UI | 5 мин | ✅ **Автоматизировано** — AI импортировал через `POST /rest/workflows` |
| H4 | Настроить 3 credentials в n8n UI | 10 мин | ✅ **Автоматизировано** — AI создал через `POST /rest/credentials` |
| H5 | Подключить sub-nodes к AI Agent в n8n UI | 15 мин | ✅ **Автоматизировано** — AI привязал credentials через `PATCH /rest/workflows/:id` |
| H6 | Активировать оба workflow | 1 мин | ⬜ Осталось сделать |
| H7 | Сделать скриншоты `trace-wf1.png` и `trace-wf2-toggle.png` | 5 мин | ⬜ Вручную (браузер) |
| H8 | Записать screencast (3–5 мин) | 15 мин | ⬜ Вручную (экран + демо) |
| H9 | Создать PR | 5 мин | ⬜ Git + review |

**Итого оставшихся ручных действий: ~25 минут** (было ~60)

### Как были автоматизированы шаги H3–H5

Вместо ручной работы в n8n UI, AI использовал n8n REST API напрямую:

1. **Логин** — `POST /rest/login` с credentials из `n8n_creds.txt` → session cookie
2. **Импорт workflow** — `POST /rest/workflows` с JSON-телом из сгенерированных файлов
3. **Создание credentials** — `POST /rest/credentials` для каждого типа:
   - `httpHeaderAuth` — Header Auth (X-API-Key для webhook)
   - `telegramApi` — Telegram bot token
   - `googlePalmApi` — Google Gemini API key
4. **Привязка credentials к нодам** — `GET /rest/workflows/:id` → модификация нод → `PATCH /rest/workflows/:id`
5. **Замена Chat Model** — тип ноды изменён с `lmChatAnthropic` на `lmChatGoogleGemini` (модель `gemini-2.0-flash`)

### Файлы с credentials (в .gitignore)

Человек положил секреты в файлы, AI прочитал их и создал credentials через API.
Все 3 файла добавлены в `.gitignore` — **никогда не коммитятся**:

```
docs/m5/credentials/n8n_creds.txt          # email + password от n8n (self-hosted)
docs/m5/credentials/telegram_bot_keys.txt  # Telegram bot token + chat_id
docs/m5/credentials/google_gemini_api_key.txt  # Google Gemini API key
```

---

## Phase 0: Prerequisites (AI делает)

- [ ] **0.1** Проверить MCP сервер (3 tools: `get_feature_info`, `set_feature_state`, `adjust_traffic_rollout`)
- [ ] **0.2** Проверить что MCP имеет валидацию `0 <= percentage <= 100` (уже есть — строка 178 server.py)
- [ ] **0.3** Добавить n8n сервис в `docker-compose.yml`:
  ```yaml
  n8n:
    image: n8nio/n8n:latest
    container_name: proshop-n8n
    ports:
      - '5678:5678'
    volumes:
      - n8n-data:/home/node/.n8n
      - ./docs/m5/data:/data/logs  # для logs.json
    environment:
      - GENERIC_TIMEZONE=Europe/Minsk
      - N8N_SECURE_COOKIE=false
    restart: unless-stopped
  ```
- [ ] **0.4** Запустить `docker compose up -d n8n` и убедиться что http://localhost:5678 отвечает
- [ ] **0.5** Сгенерировать API key: `openssl rand -hex 32`

---

## Phase 1: WF1 — Manual Trigger (AI делает код)

### 1A: Frontend (AI делает)

- [ ] **1A.1** Создать `frontend/src/components/AutoPilotControls.js`:
  - React 16 + React-Bootstrap (match existing stack — НЕ `.jsx`, проект использует `.js`)
  - `process.env.REACT_APP_N8N_WEBHOOK_URL` и `process.env.REACT_APP_N8N_API_KEY`
  - 3 кнопки: Запустить проверку (check), Тестовый режим (test), Откатить фичу (rollback)
  - Loading/feedback state, Alert компонент из react-bootstrap
- [ ] **1A.2** Интегрировать в `FeatureDashboardScreen.js`:
  - Добавить `selectedFeature` state (клик на строку таблицы)
  - Рендерить `<AutoPilotControls>` под таблицей для выбранной фичи
  - `handleFeatureUpdate` — обновить данные после операции агента
- [ ] **1A.3** Добавить env-переменные в `frontend/.env`:
  ```
  REACT_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook
  REACT_APP_N8N_API_KEY=<сгенерированный ключ>
  ```

### 1B: n8n Workflow JSON (AI генерирует)

- [ ] **1B.1** Сгенерировать `docs/m5/workflows/wf1-manual-trigger.json` с нодами:
  1. Webhook Trigger (POST `/feature-control`, Header Auth, Response Mode = Respond to Webhook Node)
  2. Switch (rules mode, 4 правила валидации + fallback → AI Agent)
  3. Respond to Webhook 400 (для reject-выходов Switch)
  4. AI Agent (Tools Agent, maxIterations=5, GCAO system prompt)
  5. Sub-nodes: Chat Model placeholder, Window Buffer Memory (length=5, sessionKey=$json.feature_id), MCP/HTTP tools, Structured Output Parser
  6. Respond to Webhook 200 (от AI Agent main)

### 1C: GCAO System Prompt (AI пишет)

- [ ] **1C.1** Встроить GCAO из спецификации A.5 прямо в JSON workflow (поле systemMessage)

---

## Phase 2: WF2 — Scheduled Monitor (AI делает код)

### 2A: Python Simulator (AI делает)

- [ ] **2A.1** Создать `docs/m5/simulators/simulate_wf2.py`:
  - Синусоидальный error_rate: baseline=0.05, amplitude=0.10, period=300s
  - Пишет events в `logs.json`: `{timestamp, feature_id, status, error_rate_now}`
  - CLI: `--output`, `--duration`, `--rps`, `--period`, `--amplitude`, `--baseline`
  - Лимит 10,000 событий

### 2B: n8n Workflow JSON (AI генерирует)

- [ ] **2B.1** Сгенерировать `docs/m5/workflows/wf2-scheduled-monitor.json` с нодами:
  1. Schedule Trigger (every 1 min)
  2. Code Node "Read & Analyze Logs" (читает `/data/logs/logs.json`, считает error_rate за 60s)
  3. HTTP Request "Get Feature Status" (MCP get_feature_info)
  4. Code Node "Merge Data"
  5. Switch "Decision" (deactivate if >5% + not Disabled / reenable if <1% + Disabled / fallback)
  6. 2x Set Node (Set Decision)
  7. AI Agent (maxIterations=3, NO memory, GCAO B.4)
  8. Telegram Send Message (только от AI Agent)
  9. NoOp (fallback)

### 2C: Python Simulator WF1 (AI делает)

- [ ] **2C.1** Создать `docs/m5/simulators/simulate_wf1.py`:
  - Sine-wave traffic_percentage (50 + 40 * sin)
  - Ротация actions: check → test → rollout → check → rollback → check
  - `--include-invalid` — каждый 7-й запрос с `traffic_percentage: -50`

---

## Phase 3: Hallucination Test (AI проверяет + код)

- [ ] **3.1** Проверить что MCP server отвергает `-50` (уже есть: строка 178 server.py — `0 <= percentage <= 100`)
- [ ] **3.2** Switch нода в WF1 JSON уже содержит правило `traffic_percentage < 0 || > 100 → reject`
- [ ] **3.3** Документировать обе точки защиты в README

---

## Phase 4: Documentation (AI делает)

- [ ] **4.1** Написать `docs/m5/README.md` по шаблону из спецификации
- [ ] **4.2** Сгенерировать `logs.json` прогоном simulate_wf2.py (коротко, ~60s)

---

## Phase 5: Ручные шаги (ВЫ делаете)

> Все шаги ниже выполняются ПОСЛЕ того, как я закончу фазы 0–4.
> К этому моменту у вас будут все файлы + n8n запущен на http://localhost:5678.

---

### H1. Создать Telegram-бота (5 мин) ✅ DONE

1. Откройте Telegram, найдите `@BotFather`
2. Отправьте `/newbot`
3. Введите имя бота, например: `ProShop M5 Alerts`
4. Введите username бота, например: `proshop_m5_alerts_bot`
5. **Скопируйте token** (формат `123456789:ABCdefGHI...`) — он понадобится в шаге H4

**Результат выполнения:**
```
/newbot
Alright, a new bot. How are we going to call it? Please choose a name for your bot.
ProShop M5 Alerts
Good. Now let's choose a username for your bot. It must end in `bot`.
proshop_m5_alerts_bot
Done! Congratulations on your new bot. You will find it at t.me/proshop_m5_alerts_bot.

Token: <YOUR_TELEGRAM_BOT_TOKEN>
```

---

### H2. Найти chat_id (3 мин) ✅ DONE

1. Откройте вашего нового бота в Telegram
2. Отправьте ему `/start`
3. В терминале выполните (подставив ваш token):
   ```bash
   curl -s "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getUpdates" | python3 -m json.tool
   ```
4. В ответе найдите `"chat": {"id": <YOUR_CHAT_ID>}` — это ваш `chat_id`
5. **Запишите** этот `chat_id` — он понадобится в шаге H4

**Результат выполнения:**
```json
{
    "ok": true,
    "result": [
        {
            "update_id": 189192928,
            "message": {
                "from": {"id": <YOUR_CHAT_ID>, "first_name": "Ilya", "username": "ilya_chakun"},
                "chat": {"id": <YOUR_CHAT_ID>, "type": "private"},
                "text": "/start"
            }
        }
    ]
}
```
**chat_id: `<YOUR_CHAT_ID>`**

---

### H3. Импортировать workflow в n8n (5 мин) ✅ DONE

1. Откройте http://localhost:5678 в браузере
2. При первом входе — создайте аккаунт (email/пароль — локальные, любые)

**Импорт WF1:**
3. На главной → кнопка `...` (или `Add workflow`) → `Import from File`
4. Выберите файл `docs/m5/workflows/wf1-manual-trigger.json`
5. Workflow появится на canvas

**Импорт WF2:**
6. Повторите шаги 3-5 для `docs/m5/workflows/wf2-scheduled-monitor.json`

**Результат:** Оба workflow импортированы в n8n UI.

---

### H4. Настроить credentials в n8n (10 мин)

**4a) Header Auth (для WF1 webhook):**
1. Откройте WF1 workflow → кликните на **Webhook Trigger** ноду
2. В поле **Authentication** выберите `Header Auth`
3. Нажмите **Create New Credential** (или выберите существующий)
4. Name: `n8n-feature-control-api-key`
5. Header Name: `X-API-Key`
6. Header Value: скопируйте значение из файла `frontend/.env` (строка `REACT_APP_N8N_API_KEY=...`)
7. Save

> **Альтернативный путь:** Главное меню (☰) → **Credentials** → **Add Credential** → `Header Auth`

**4b) Chat Model credential (для AI Agent):**
1. Откройте **AI Agent** ноду → кликните на **Chat Model** sub-node
2. Выберите тип модели (OpenAI / Anthropic / Google Gemini)
3. Нажмите **Create New Credential** → вставьте API Key
4. Save

**4c) Telegram API (для WF2 alerts):**
1. Откройте WF2 workflow → кликните на **Telegram** ноду
2. В поле Credential нажмите **Create New Credential** → `Telegram API`
3. Access Token: вставьте token из шага H1 (`<YOUR_TELEGRAM_BOT_TOKEN>`)
4. Save

---

### H5. Подключить credentials и sub-nodes в workflow (15 мин)

**В WF1 (`wf1-manual-trigger`):**
1. Откройте workflow на canvas
2. Кликните на **Webhook Trigger** ноду → Authentication → выберите credential `n8n-feature-control-api-key`
3. Кликните на **Chat Model** sub-node (внутри AI Agent) → выберите credential вашей модели
4. Кликните на **MCP Client Tool** или **HTTP Request Tool** sub-node(s):
   - Если MCP: SSE Endpoint = URL вашего MCP сервера (например `http://host.docker.internal:5001/sse` если MCP на хосте)
   - Если HTTP: настройте URL для каждого из 3 tools
5. Сохраните workflow (Ctrl+S)

**В WF2 (`wf2-scheduled-monitor`):**
6. Аналогично — настройте Chat Model credential
7. Настройте MCP/HTTP tools (те же URL что в WF1)
8. Кликните на **Telegram** ноду → выберите credential Telegram API → Chat ID = ваш `chat_id` из шага H2
9. Сохраните workflow

**Важно — проверьте в AI Agent нодах:**
- WF1: `Options → System Message` начинается с `=` (expression syntax)
- WF1: Window Buffer Memory → `sessionKey` = `={{ $json.feature_id }}`
- WF2: AI Agent НЕ имеет Memory sub-node

---

### H6. Активировать workflow (1 мин)

1. Откройте WF1 → тумблер "Active" в правом верхнем углу → ON
2. Откройте WF2 → тумблер "Active" → ON
3. WF2 начнёт срабатывать каждую минуту (но без данных в logs.json пока ничего не сделает)

---

### H7. Тестирование + скриншоты (10 мин)

**Тест WF1:**
```bash
# Без ключа — должно быть 403
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"check"}'
# Ожидание: 403

# С ключом — должно быть 200
curl -s -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <ваш ключ из frontend/.env>" \
  -d '{"feature_id":"search_v2","action":"check"}'
# Ожидание: 200 + JSON с feature info

# Тест галлюцинации
curl -s -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <ваш ключ>" \
  -d '{"feature_id":"search_v2","action":"rollout","traffic_percentage":-50}'
# Ожидание: 400 + {"success":false,"rejected_at":"input-validation"}
```

**Тест WF2:**
```bash
# Запустите симулятор логов (из корня проекта)
python3 docs/m5/simulators/simulate_wf2.py --output docs/m5/data/logs.json --duration 600 --period 120
```
Подождите 2-3 минуты, наблюдайте в n8n → Executions как WF2 срабатывает и переключает фичу.

**Скриншоты:**
1. В n8n → Executions → найдите execution WF1 где агент делал reasoning → скриншот → сохранить как `docs/m5/trace-wf1.png`
2. Найдите execution WF2 где произошёл toggle (deactivate или reenable) → скриншот → `docs/m5/trace-wf2-toggle.png`

---

### H8. Записать screencast (15 мин)

Откройте Loom / QuickTime / OBS. Покажите за 3–5 минут:
1. Dashboard в браузере → клик «Откатить фичу» → статус меняется
2. Терминал: `python3 docs/m5/simulators/simulate_wf1.py --webhook-url http://localhost:5678/webhook/feature-control --api-key <key> --include-invalid` → видны отказы на -50
3. Терминал: `python3 docs/m5/simulators/simulate_wf2.py` уже запущен
4. n8n UI → Executions → видно срабатывание WF2
5. Telegram → алерты deactivate → re-enable (полный цикл)
6. Dashboard → статус фичи обновился

Сохранить как `docs/m5/screencast.mp4` или ссылку на Loom.

---

### H9. Создать PR (5 мин)

```bash
git checkout -b feat/m5-agentic-workflows
git add docs/m5/ frontend/src/components/AutoPilotControls.js frontend/src/screens/FeatureDashboardScreen.js frontend/.env.example
# НЕ коммитить frontend/.env с реальными ключами!
git commit -m "feat: M5 homework — n8n agentic workflows (WF1 manual + WF2 scheduled)"
git push origin feat/m5-agentic-workflows
# Создать PR через GitHub UI или:
gh pr create --title "M5: n8n Agentic Workflows" --body "WF1 manual trigger + WF2 scheduled monitor + hallucination test"
```

---

## Архитектурные решения (уже приняты)

| Решение | Выбор | Почему |
|---------|-------|--------|
| n8n hosting | Self-host Docker (docker-compose) | Нужен filesystem для logs.json + уже есть docker-compose |
| Frontend env vars | `REACT_APP_*` | Проект на react-scripts 3.4.3, НЕ Vite |
| Logs storage | JSON file (`/data/logs/logs.json`) | Простейший вариант, volume mount в n8n контейнер |
| MCP connection | MCP сервер уже на хосте (FastMCP, `ai/mcp-feature-flags/server.py`) | Из n8n Docker → `host.docker.internal` |

## Gotchas

1. **react-scripts 3.x** — env vars = `REACT_APP_*`, не `VITE_*`
2. **MCP сервер** уже имеет валидацию `0 <= percentage <= 100` (строка 178)
3. **n8n в Docker** обращается к MCP на хосте через `host.docker.internal`
4. **logs.json** — volume mount `./docs/m5/data:/data/logs` в n8n контейнере
5. **Window Buffer Memory sessionKey** — обязательно `{{ $json.body.feature_id }}` (НЕ `$json.feature_id`!)
6. **WF2 без Memory** — cron stateless
7. **Telegram нода** только от AI Agent, не от NoOp
8. **Webhook $json** — в режиме responseNode: `$json = {headers, params, query, body, ...}`. Тело запроса в `$json.body.*`!
9. **n8n expressions** — `[].includes()` с литеральным массивом НЕ работает. Используй строковый `.includes()`
10. **Gemini schema** — `"type": ["object","null"]` ломает Gemini. Только простые типы.
11. **Gemini free tier** — ~15 RPM, при активной отладке быстро кончается

---

## ⚡ CHECKPOINT ДЛЯ СЛЕДУЮЩЕГО АГЕНТА (2026-05-24)

### Что СДЕЛАНО (всё работает):
1. ✅ n8n запущен в Docker (port 5678, container `proshop-n8n`)
2. ✅ WF1 (`jCiU37drHMGylcS3`) — импортирован, credentials привязаны, активирован
3. ✅ WF2 (`ZdsYUJjX5SdPtawd`) — импортирован, credentials привязаны, активирован
4. ✅ 3 credentials созданы через API: Header Auth, Telegram, Google Gemini
5. ✅ Chat Model заменён с Anthropic → Google Gemini (`gemini-2.0-flash`)
6. ✅ MCP Tool заменён на HTTP Request Tools (3 в WF1, 2 в WF2)
7. ✅ Switch rules исправлены: `$json.body.*` вместо `$json.*`
8. ✅ Array includes() заменён на строковый includes()
9. ✅ Structured Output Parser schema исправлена для Gemini
10. ✅ Switch-валидация работает: 403 без ключа, 400 невалидные данные, 400 hallucination (-50)
11. ✅ Frontend: AutoPilotControls.js, FeatureDashboardScreen.js обновлён
12. ✅ Симуляторы: simulate_wf1.py, simulate_wf2.py, logs.json
13. ✅ Документация: README.md, lessons.md, test_results.md

### Что СДЕЛАНО (позже, после Gemini → Anthropic миграции):
14. ✅ Chat Model заменён с Gemini → **Anthropic Claude** (`claude-haiku-4-5-20251001`)
15. ✅ WF1 — все 8 тестов проходят (check, test, rollout, rollback, hallucination -50, missing fields, etc.)
16. ✅ WF2 — end-to-end подтверждён: simulate_wf2.py → WF2 cron → AI Agent toggle → Telegram alert
17. ✅ Скриншоты: `homework/M5/trace-wf1.png`, `homework/M5/trace-wf2-toggle.png`
18. ✅ lessons 1-30, test_results.md, README.md закоммичены и запушены
19. ✅ PR #33 создан на ветке `feat/m5-agentic-workflows`
20. ✅ Начальный screencast: `homework/M5/video-recording/screencast.webm` (~35с, только браузер)
21. ✅ 4 примера видео проанализированы, заметки сохранены в `homework/M5/video-recording/examples/*.notes.md`

### Что ОСТАЛОСЬ сделать:

#### 🔴 P0 — Блокеры сдачи

1. ⬜ **Экспорт актуальных workflow JSON** из n8n
   - Текущие `homework/M5/workflows/wf1-manual-trigger.json` и `wf2-scheduled-monitor.json` устарели (правки были через n8n API)
   - Нужно: `GET /rest/workflows/{id}` → сохранить актуальные JSON
   - WF1 ID: `jCiU37drHMGylcS3`, WF2 ID: `ZdsYUJjX5SdPtawd`

2. ⬜ **Стресс-тест WF1** (из HOMEWORK A.6: "Стресс-теста: что если 10 команд подряд")
   - Прогнать `simulate_wf1.py` с коротким `--interval 2 --duration 30`
   - Убедиться что все запросы обработаны без 500 ошибок
   - Задокументировать результат
   - Показать в screencast (как в примере `wf1-stress-test-reload-UI-after-n8n-changed.mov`)

3. ⬜ **Screencast (3-5 мин)** — основной артефакт сдачи
   - Должен показать 6 обязательных сцен (HOMEWORK "Screencast"):
     1. Dashboard → клик «Откатить фичу» → статус меняется
     2. `simulate_wf1.py --include-invalid` → видно отказы на -50
     3. `simulate_wf2.py` запущен фоном
     4. n8n Executions → видно срабатывание WF2 cron
     5. Telegram → алерты deactivate → re-enable (полный цикл)
     6. Dashboard → статус фичи обновился автоматически
   - Дополнительно (из примеров видео):
     7. Стресс-тест (быстрые запросы + UI reload)
     8. AI Agent autopilot sub-nodes (Canvas view)
   - Формат: MP4 или WebM, <100MB для GitHub / или ссылка на Loom/YouTube

4. ⬜ **Финальный коммит + push** после всех артефактов

#### 🟡 P1 — Важное (чеклист задания)

5. ⬜ **CC-агенты установка** (HOMEWORK D.2, чеклист)
   - Установить `n8n-requirements-orchestrator.md` и `n8n-workflow-builder.md` в `~/.claude/agents/`
   - Проверка: `ls ~/.claude/agents | grep n8n` → 2 файла
   - Источник: `aidev-course-materials/M5/agents/` (нужно найти эти файлы)

6. ⬜ **README.md — проверить на соответствие шаблону** (HOMEWORK "Шаблон README.md")
   - Обязательные секции: Архитектура, Стек, WF1, WF2, Тест на галлюцинации, Как запустить, Что было сложно, Бонусы, Screencast
   - Сравнить наш `homework/M5/README.md` с шаблоном и дополнить

#### 🟢 P2 — Бонусы (не влияют на оценку)

7. ⬜ HITL Wait-нода
8. ⬜ Langfuse / LangSmith трейсинг
9. ⬜ Multi-agent supervisor + worker
10. ⬜ Deploy через n8n MCP
11. ⬜ Postgres Chat Memory

---

## Phase 6: Видео — Screencast (НОВАЯ ФАЗА)

### Подход к записи

**Варианты:**
- **A) Ручная запись** (OBS / QuickTime / Loom) — самый простой, 15-20 мин
- **B) Playwright-автоматизация** — headless browser recording → WebM → конвертация в MP4
- **C) Гибрид** — Playwright для browser-сцен + ручная запись терминала + склейка

### Сценарий screencast (план по минутам)

| Мин | Сцена | Что показать |
|-----|-------|-------------|
| 0:00-0:30 | Intro | Dashboard в браузере, список feature flags, объяснение архитектуры |
| 0:30-1:15 | WF1 Manual | Клик «Откатить фичу» → ожидание → статус меняется → alert от агента |
| 1:15-2:00 | WF1 Simulator | Терминал: `simulate_wf1.py --include-invalid` → видно отказы на -50 + успешные операции |
| 2:00-2:30 | Стресс-тест | Быстрые запросы (interval=2s) → все обработаны → UI reload |
| 2:30-3:15 | WF2 Monitor | n8n Executions → WF2 cron срабатывает → toggle видно в trace |
| 3:15-3:45 | Telegram | Алерты: 🚨 деактивация → ✅ re-enable (полный цикл) |
| 3:45-4:15 | Dashboard | Статус обновился автоматически после WF2 |
| 4:15-4:30 | n8n Canvas | AI Agent sub-nodes: LLM, Tools, Output Parser |

**Итого: ~4:30** — в рамках 3-5 мин.

### Заметки из анализа примеров видео

См. файлы `homework/M5/video-recording/examples/*.notes.md`:
- `screencast.mp4.notes.md` — полный demo (золотой стандарт, ~3 мин)
- `wf1-autopilots-components.notes.md` — AI Agent sub-nodes (1.5 мин)
- `wf1-halucinations.notes.md` — защита от -50 (1.5 мин)
- `wf1-stress-test-reload-UI-after-n8n-changed.notes.md` — стресс + UI reload (54с)

### Критические ID и ключи:
- n8n URL: http://localhost:5678
- n8n session cookie: `/tmp/n8n-cookies.txt` (может быть expired — перелогиниться через `POST /rest/login`)
- n8n login credentials: `docs/m5/credentials/n8n_creds.txt`
- WF1 workflow ID: `jCiU37drHMGylcS3`
- WF2 workflow ID: `ZdsYUJjX5SdPtawd`
- Webhook API key: `532b6cc84bc4f2c4ff54b676baa3b209ab6eccb12c539a5dc25130d15e0d751c`
- Webhook endpoint: `POST http://localhost:5678/webhook/feature-control`
- Backend API: `http://localhost:5001/api/feature-flags` (200 confirmed)
- Telegram chatId: `854243765`
- Telegram bot token: в `docs/m5/credentials/telegram_bot_keys.txt`
- Gemini API key: в `docs/m5/credentials/google_gemini_api_key.txt`

### Как перелогиниться в n8n API:
```bash
# Прочитать креды
EMAIL=$(head -1 docs/m5/credentials/n8n_creds.txt | cut -d: -f2 | tr -d ' ')
PASS=$(tail -1 docs/m5/credentials/n8n_creds.txt | cut -d: -f2 | tr -d ' ')
curl -s -X POST http://localhost:5678/rest/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  -c /tmp/n8n-cookies.txt
```

### Как проверить Gemini quota:
```bash
# Отправить тестовый запрос через webhook
curl -s -w "\nHTTP: %{http_code}" -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 532b6cc84bc4f2c4ff54b676baa3b209ab6eccb12c539a5dc25130d15e0d751c" \
  -d '{"feature_id":"search_v2","action":"check"}' --max-time 60
# Если 200 с JSON body → квота восстановилась
# Если 200 с пустым body → ещё rate limited (проверить execution в n8n)
```

### Рекомендуемый порядок для следующего агента:
1. Проверить что контейнеры запущены (`docker ps`)
2. Перелогиниться в n8n API
3. Проверить Gemini quota (тестовый запрос)
4. Если quota есть → прогнать WF1 check, зафиксировать успех
5. Прогнать WF2 с simulate_wf2.py
6. Сделать скриншоты через Playwright MCP
7. Экспортировать финальные workflow JSON
8. Коммит + PR

### Подробные уроки и ошибки:
- `docs/m5/lessons.md` — 16 уроков
- `docs/m5/test_results.md` — все тесты с результатами
