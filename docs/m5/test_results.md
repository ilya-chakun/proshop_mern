# M5 Test Results

**Date:** 2026-05-24
**Environment:** n8n self-hosted Docker, backend on localhost:5001
**LLM:** Anthropic Claude (`claude-haiku-4-5-20251001`) via API key

---

## WF1 — Manual Trigger Tests

### TEST 1: No API Key → 403 ✅
```
curl -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"check"}'

→ HTTP 403 (Forbidden)
```
**Результат:** Header Auth работает — без X-API-Key отказ.

### TEST 2: Valid check request → 200 + JSON ✅
```
curl -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <key>" \
  -d '{"feature_id":"search_v2","action":"check"}'

→ HTTP 200
→ {"output":"```json\n{\"success\":true,\"message\":\"Feature search_v2 is currently in Testing state...\"}"}
```
**Результат:** AI Agent вызвал `get_feature_info` → вернул текущий статус фичи.

### TEST 3: Hallucination guard (traffic_percentage: -50) → 400 ✅
```
curl -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <key>" \
  -d '{"feature_id":"search_v2","action":"rollout","traffic_percentage":-50}'

→ HTTP 400
→ {"success":false,"message":"Validation error","rejected_at":"input-validation"}
```
**Результат:** Switch отловил невалидный traffic_percentage ДО AI Agent. Algorithm-before-AI работает.

### TEST 4: Rollback → Disabled ✅
```
curl -X POST http://localhost:5678/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <key>" \
  -d '{"feature_id":"search_v2","action":"rollback"}'

→ HTTP 200
→ {"output":"...\"success\":true,\"message\":\"Feature search_v2 successfully rolled back to Disabled state\",
   \"current_state\":{\"status\":\"Disabled\",\"traffic_percentage\":0}..."}
```
**Результат:** Claude вызвал `get_feature_info` → `set_feature_state("search_v2","Disabled")` → подтвердил.

### TEST 5: Set to Testing ✅
```
curl -X POST ... -d '{"feature_id":"search_v2","action":"test"}'

→ HTTP 200
→ {"output":"...\"success\":true,\"message\":\"Feature search_v2 successfully transitioned to Testing state\"..."}
```

### TEST 6: Rollout to 50% ✅
```
curl -X POST ... -d '{"feature_id":"search_v2","action":"rollout","traffic_percentage":50}'

→ HTTP 200
→ {"output":"...\"success\":true,\"message\":\"Feature search_v2 traffic successfully adjusted to 50%\",
   \"current_state\":{\"status\":\"Testing\",\"traffic_percentage\":50}..."}
```
**Результат:** Claude вызвал `adjust_traffic_rollout("search_v2", 50)` → подтвердил.

### TEST 7: Missing feature_id → 400 ✅
```
curl -X POST ... -d '{"action":"check"}'
→ HTTP 400 → {"success":false,"message":"Validation error","rejected_at":"input-validation"}
```

### TEST 8: Invalid action "destroy" → 400 ✅
```
curl -X POST ... -d '{"feature_id":"search_v2","action":"destroy"}'
→ HTTP 400 → {"success":false,"message":"Validation error","rejected_at":"input-validation"}
```

---

## WF2 — Scheduled Monitor

WF2 активирован (active=true), Schedule Trigger каждую минуту.

### TEST 9: High error rate → AI Agent → Telegram ✅
```
Simulator: --baseline 0.06 --amplitude 0.12 --period 120 --rps 10
5-min window: 2474 events, error_rate=0.065 (6.5%)

Execution 121: success
Path: Schedule Trigger → Read & Analyze Logs (HTTP) → Get Feature Status → Merge Data
     → Decision (deactivate branch) → Set Decision Deactivate → AI Agent → Telegram Send Message

AI Agent вызвал инструменты, сформировал отчёт и отправил в Telegram.
```
**Результат:** При error_rate > 5% WF2 корректно маршрутизирует через deactivate → AI Agent → Telegram.

### TEST 10: Low error rate → Fallback (NoOp) ✅
```
Simulator stopped, error_rate=0, total_events=0

Path: Schedule Trigger → Read & Analyze Logs → Decision → NoOp (Fallback)
```
**Результат:** При нулевом error rate WF2 корректно идёт в Fallback, не отправляя ложные алерты.

---

## Баги найденные и исправленные в процессе

### BUG 1: MCP Client Tool не поддерживается
- **Симптом:** `Unrecognized node type: @n8n/n8n-nodes-langchain.toolMcp`
- **Причина:** MCP нода отсутствует в базовом Docker-образе n8n
- **Fix:** Заменил на `toolHttpRequest` (3 штуки в WF1, 2 в WF2)

### BUG 2: $json.action вместо $json.body.action
- **Симптом:** Все запросы падали в Switch как validation error
- **Причина:** Webhook Trigger в режиме `responseNode` оборачивает тело в `$json.body`
- **Fix:** Заменил все `$json.X` на `$json.body.X` в Switch rules и AI Agent prompt

### BUG 3: includes() expression не работает
- **Симптом:** Правило `['check','test','rollback','rollout'].includes($json.action)` всегда false
- **Причина:** n8n expression engine не поддерживает array literal в `={{ }}`
- **Fix:** Заменил на `",check,test,rollback,rollout,".includes("," + $json.body.action + ",")`

### BUG 4: Structured Output Parser несовместим с Claude
- **Симптом:** `Model output doesn't fit required format`
- **Причина:** Claude не всегда следует строгой JSON schema с nullable типами
- **Fix:** Удалил Structured Output Parser; Claude возвращает JSON в markdown code block

### BUG 5: Gemini Free Tier rate limit → перешли на Anthropic Claude
- **Симптом:** 429 Too Many Requests после нескольких тестов
- **Fix:** Создали Anthropic credential, заменили Chat Model на `claude-haiku-4-5-20251001`

### BUG 6: toolHttpRequest отправляет пустой body `{}`
- **Симптом:** POST /api/feature-flags/state получает `{}`, возвращает 400
- **Причина:** `specifyBody: "json"` с `$fromAI` placeholders не резолвит выражения в `jsonBody`
- **Fix:** Переключили на `specifyBody: "keypair"` с `parametersBody.values`

### BUG 7: Отсутствовали POST-эндпоинты для feature flags
- **Симптом:** 404 на POST /api/feature-flags/state
- **Причина:** Бэкенд имел только GET-маршруты через MCP-сервер
- **Fix:** Добавили POST `/api/feature-flags/state` и `/api/feature-flags/traffic` в `featureFlagsRoutes.js`

### BUG 8: Code node не имеет доступа к filesystem (task runner sandbox)
- **Симптом:** `require('node:fs').readFileSync('/data/logs/logs.json')` возвращал 0 events
- **Причина:** n8n 2.21+ запускает Code ноды в изолированном sandbox (task runner), без доступа к filesystem контейнера
- **Fix:** Заменили чтение файла на HTTP-запрос `this.helpers.httpRequest()` + добавили `GET /api/feature-flags/logs` эндпоинт

### BUG 9: `fetch()` не определён в sandbox
- **Симптом:** `fetch is not defined` в Code node
- **Fix:** Использовали `this.helpers.httpRequest()` вместо `fetch()`

### BUG 10: nodemon restart loop из-за bind mount
- **Симптом:** 245 рестартов backend при монтировании логов в `/app/m5-logs`
- **Причина:** Симулятор пишет 10 раз/сек → nodemon детектирует изменения → рестарт
- **Fix:** Перенесли mount в `/opt/m5-logs:ro` (вне зоны наблюдения nodemon)

### BUG 11: Merge Data получала features вместо log data
- **Симптом:** error_rate всегда 0 в Decision, хотя API возвращал >5%
- **Причина:** `$input.first().json` ссылался на Get Feature Status (features JSON), а не Read & Analyze Logs
- **Fix:** Заменили на `$('Read & Analyze Logs').first().json`

---

## Резюме

| Тест | Ожидание | Результат |
|------|----------|-----------|
| Без API key | 403 | ✅ 403 |
| Valid check | 200 + JSON | ✅ 200 + feature info |
| traffic: -50 | 400 reject | ✅ 400 rejected_at: input-validation |
| Rollback | Disabled, traffic=0 | ✅ status=Disabled, traffic=0 |
| Test | Testing | ✅ status=Testing |
| Rollout 50% | traffic=50 | ✅ traffic_percentage=50 |
| Missing feature_id | 400 reject | ✅ 400 |
| Invalid action | 400 reject | ✅ 400 |
| WF2 scheduled (high error) | AI Agent + Telegram | ✅ Decision→Deactivate→AI→Telegram |
| WF2 scheduled (low error) | Fallback NoOp | ✅ No false alerts |

**Все тесты проходят.** LLM: Anthropic Claude Haiku 4.5. Все Switch-валидации, AI Agent tool calls и Telegram алерты работают корректно.
