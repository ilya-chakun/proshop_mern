# Модуль 5 — Домашнее задание

**Тема:** Агенты и n8n. Замыкаем full-stack: M3 (руки / MCP) + M4 (глаза / Dashboard) + M5 (мозг / Agent).

**Сложность:** Middle+ (n8n визуально + базовые правки фронта) / Senior+ (полный стек с self-host n8n + Telegram + auth).

**Время:** ~4-6 часов (WF1 manual: 2 ч, WF2 scheduled: 1.5-2 ч, тест на галлюцинации: 30 мин, README + screencast: 30 мин).

**Дедлайн:** объявляется отдельно перед стартом M6.

**Куда сдавать:** PR в ваш форк proshop_mern — папка `docs/m5/` + правки во `frontend/`. Ссылка в LMS / чат курса.

---

## TL;DR — что нужно сделать

Построить два n8n-workflow на сквозном проекте proshop_mern:

1. **WF1. Manual trigger из Dashboard.** Расширяете Feature Dashboard из M4: добавляете кнопки управления → клик отправляет POST на webhook n8n (с auth-header) → AI Agent через MCP-сервер из M3 принимает решение и крутит ручки → UI обновляется и показывает сообщение от агента («Готово, фича в Testing» / «Не могу отключить, фича уже Disabled» / «Получены некорректные параметры»).

2. **WF2. Scheduled defensive monitor.** Cron каждую минуту проверяет имитацию логов трафика (logs.json). Симулятор пишет туда события success / error с синусоидальным error rate. Когда error_rate > threshold — агент деактивирует фичу через MCP + шлёт алерт в Telegram. Когда error_rate уходит ниже threshold — re-enable. Студент видит полный цикл auto-toggling включается/отключается/включается/отключается.

**Плюс тест на галлюцинации** — POST с `traffic_percentage: -50` отвергается на Switch-ноде и JSON Schema, а не «на здравом смысле LLM». Это и есть Algorithm-before-AI.

**Плюс два Python-симулятора** — оба используют синусоиду для генерации параметров. Это позволяет видеть переход через threshold, реальную динамику нагрузки и валидацию защит.

**Плюс 2-3 промпта для Claude Code** — как воспользоваться n8n-requirements-orchestrator (превращает идею в спек) и n8n-workflow-builder (превращает спек в JSON). Опционально третий — деплой через n8n MCP без копи-пасты в UI.

Без advanced со звёздочкой. Все делают одну и ту же базу. Бонусы (HITL, Langfuse, multi-agent) — для портфолио, не для оценки.

---

## Чему учимся

- Анатомии production-агента: GCAO в system prompt + Structured Output на каждом шаге + Algorithm-before-AI (4 слоя guards).
- Связке UI ↔ Agent ↔ MCP — full-stack замкнутый цикл на собственном проекте.
- Двум production-сценариям сразу: manual (синхронный, человек инициирует) + scheduled (асинхронный, агент инициирует сам).
- Использовать Claude Code не только для написания кода, но и для построения workflow — два специализированных субагента на этом курсе.
- Защищать webhook (auth) и понимать почему «промт «не делай X» — не защита».

---

## Что должно работать ДО старта (pre-requisites)

| Компонент | Что должно быть готово | Как проверить |
|-----------|----------------------|---------------|
| MCP-сервер из M3 | 3 tools: `get_feature_info`, `set_feature_state`, `adjust_traffic_rollout`. JSON Schema с enum / min / max / required на параметрах | `curl https://your-mcp.com/health` → 200 OK. `mcp-inspector list` → 3 tools |
| Feature Dashboard из M4 | Список фич, status badges, toggle / slider. Хотя бы одна тестовая фича типа `search_v2` | Открыть Dashboard в браузере → видны фичи |
| n8n инстанс | Cloud free tier (https://app.n8n.io), self-host docker, или n8n-install (https://github.com/kossakovsky/n8n-install) | Открыть `http://localhost:5678` или cloud URL → видно UI редактора |
| Telegram-бот | Создан через @BotFather, токен сохранён в n8n credentials, chat_id найден | Webhook `curl getMe` → `{"ok": true, "result": {...}}` |
| Python 3.10+ | Для запуска симуляторов (используется requests, numpy, math) | `python3 --version` → 3.10+ |
| Claude Code | Для использования двух M5-субагентов: n8n-requirements-orchestrator + n8n-workflow-builder | `ls ~/.claude/agents | grep n8n` → 2 файла (.md) |

### Если у вас в M3 нет JSON Schema валидации диапазонов

Добавьте сейчас. Без неё тест на галлюцинации (`traffic_percentage: -50`) пройдёт по второму слою защиты только через Switch-ноду, а не через MCP. Для production-уровня домашки нужны оба слоя (defense in depth).

Пример FastMCP:

```python
from typing import Annotated
from pydantic import Field

@mcp.tool()
def adjust_traffic_rollout(
    feature_id: str,
    traffic_percentage: Annotated[int, Field(ge=0, le=100)],  # min/max в схеме
) -> dict:
    """Устанавливает процент трафика для feature flag."""
    ...
```

---

## Карта папки сдачи

После прохождения домашки в форке proshop_mern должно быть:

```
proshop_mern/
├── frontend/src/
│   ├── screens/FeatureDashboardScreen.js   ← расширен блоком «Auto-Pilot Controls»
│   └── components/AutoPilotControls.jsx    ← новый компонент (или inline в screen)
└── docs/m5/
    ├── README.md                       ← краткий отчёт + архитектура + что выбрали
    ├── wf1-manual-trigger.json         ← n8n workflow JSON export
    ├── wf2-scheduled-monitor.json      ← n8n workflow JSON export
    ├── simulate_wf1.py                 ← клиент-симулятор для тестов WF1 (sine traffic %)
    ├── simulate_wf2.py                 ← log-генератор для WF2 (sine error rate)
    ├── logs.json                       ← пример накопленных событий (после прогона simulate_wf2)
    ├── trace-wf1.png                   ← скриншот n8n executions WF1 (видно reasoning агента)
    ├── trace-wf2-toggle.png            ← скриншот WF2 (срабатывание + re-enable)
    └── screencast.mp4 (или ссылка)     ← 3-5 минут демо полного цикла
```

---

## Часть A. WF1 — Manual trigger из Dashboard

~2 часа. Расширение фронта + n8n workflow + auth + GCAO промт + симулятор-dispatcher.

### A.1 Что должно получиться (ASCII схема)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND: Feature Dashboard (proshop_mern, M4)                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Auto-Pilot Controls для search_v2                                     │  │
│  │   [Запустить проверку]  [Тестовый режим]  [Откатить фичу]              │  │
│  │   loading: false        error: null       result: "Готово, в Testing"  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────────────────────────────────────┘
           │  POST {{VITE_N8N_WEBHOOK_URL}}/feature-control
           │  Headers: { "Content-Type": "application/json",
           │             "X-API-Key": {{VITE_N8N_API_KEY}} }
           │  Body: { "feature_id": "search_v2",
           │          "action": "test",
           │          "target_state": "Testing" }
           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  N8N WORKFLOW: wf1-manual-trigger                                            │
│                                                                              │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐ │
│  │ Webhook      │───▶│ Switch           │───▶│ AI Agent (Tools Agent)      │ │
│  │ Trigger      │    │ - tp < 0  > 100  │    │ ┌─────────────────────────┐ │ │
│  │ POST         │    │ - feature_id?    │    │ │ Chat Model              │ │ │
│  │ /feature-    │    │ - target_state?  │    │ │ (Claude / GPT / Gemini) │ │ │
│  │  control     │    │ - action?        │    │ └─────────────────────────┘ │ │
│  │              │    │ - else → AI      │    │ ┌─────────────────────────┐ │ │
│  │ Auth:        │    │                  │    │ │ Memory                  │ │ │
│  │ Header       │    │ → если bad →     │    │ │ Window Buffer length=5  │ │ │
│  │ X-API-Key    │    │   Respond 400    │    │ └─────────────────────────┘ │ │
│  └──────────────┘    └──────────────────┘    │ ┌─────────────────────────┐ │ │
│                                              │ │ Tools: MCP Client Tool  │ │ │
│                                              │ │ (M3 MCP: 3 tools)       │ │ │
│                                              │ └─────────────────────────┘ │ │
│                                              │ ┌─────────────────────────┐ │ │
│                                              │ │ System Prompt: GCAO     │ │ │
│                                              │ │ (см. A.5)               │ │ │
│                                              │ └─────────────────────────┘ │ │
│                                              │ ┌─────────────────────────┐ │ │
│                                              │ │ Structured Output Parser│ │ │
│                                              │ │ JSON schema             │ │ │
│                                              │ └─────────────────────────┘ │ │
│                                              └──────────────┬──────────────┘ │
│                                                             │                │
│                                              ┌──────────────▼──────────────┐ │
│                                              │ Respond to Webhook          │ │
│                                              │ JSON: { success, message,   │ │
│                                              │   current_state }           │ │
│                                              └──────────────┬──────────────┘ │
└────────────────────────────────────────────────────────────┼─────────────────┘
                                                             │
                                                             ▼
       ┌──────────────────────────────────────────────────────────────────────┐
       │  FRONTEND обновляет UI:                                              │
       │  - status badge: Enabled → Testing (зелёный → синий)                 │
       │  - traffic slider: 0% → 0%                                           │
       │  - alert: «Готово, фича в Testing»                                   │
       │  - на success=false: красный alert с message от агента               │
       └──────────────────────────────────────────────────────────────────────┘
```

### A.2 Шаг 1 — расширить Feature Dashboard из M4

В `FeatureDashboardScreen.js` (или ваш аналог) добавьте блок «Auto-Pilot Controls» — отдельная карточка с 3 кнопками для выбранной фичи.

#### env-переменные

В `.env` фронтенда:

```
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
VITE_N8N_API_KEY=replace-me-with-strong-random-string
```

> Для production `VITE_N8N_API_KEY` не должен оказываться в build (фронт открыт). Это ОК для домашки, но в реальной системе frontend дёргает свой собственный backend, а тот уже шлёт authenticated request на n8n. На M5 упрощаем — auth остаётся на фронте.

#### React snippet (под proshop_mern stack)

```jsx
// frontend/src/components/AutoPilotControls.jsx

import { useState } from 'react';

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY;

export default function AutoPilotControls({ feature, onUpdate }) {
  const [loading, setLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function callAutoPilot(action, extras = {}) {
    setLoading(action);
    setFeedback(null);

    try {
      const response = await fetch(`${N8N_URL}/feature-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': N8N_API_KEY,
        },
        body: JSON.stringify({
          feature_id: feature.id,
          action,
          ...extras,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        setFeedback({ type: 'error', message: result.message || `HTTP ${response.status}` });
        return;
      }

      setFeedback({ type: 'success', message: result.message });
      onUpdate(result.current_state);
    } catch (e) {
      setFeedback({ type: 'error', message: `Сеть: ${e.message}` });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card auto-pilot-controls" aria-label="Auto-Pilot Controls">
      <h3>Auto-Pilot для {feature.name}</h3>

      <div className="button-row">
        <button onClick={() => callAutoPilot('check')} disabled={loading !== null}>
          {loading === 'check' ? 'Проверяем…' : 'Запустить проверку'}
        </button>

        <button onClick={() => callAutoPilot('test', { target_state: 'Testing' })} disabled={loading !== null}>
          {loading === 'test' ? 'Включаем…' : 'Тестовый режим'}
        </button>

        <button onClick={() => callAutoPilot('rollback', { target_state: 'Disabled' })} disabled={loading !== null} className="btn-danger">
          {loading === 'rollback' ? 'Откатываем…' : 'Откатить фичу'}
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`} role="alert">
          {feedback.type === 'success' ? '✅' : '⚠️'} {feedback.message}
        </div>
      )}
    </div>
  );
}
```

### A.3 Шаг 2 — настроить auth на webhook (X-API-Key)

В n8n webhook должен принимать только запросы с правильным header'ом.

**В n8n UI:**
1. Settings → Credentials → New → Header Auth
2. Name: `n8n-feature-control-api-key`
3. Header Name: `X-API-Key`
4. Header Value: сгенерируйте длинный random string (`openssl rand -hex 32`)
5. Save

**Привязать к Webhook-ноде:**
1. В вашем WF1 откройте Webhook Trigger ноду
2. Authentication: Header Auth
3. Credential to Use: выбрать созданный `n8n-feature-control-api-key`
4. Save

**Проверка:**
```bash
# Без header — должно отказать
curl -X POST https://your-n8n.com/webhook/feature-control \
  -H "Content-Type: application/json" \
  -d '{"feature_id":"search_v2","action":"check"}'
# Ожидаемый ответ: 403 Forbidden

# С header — должно пройти
curl -X POST https://your-n8n.com/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key-here" \
  -d '{"feature_id":"search_v2","action":"check"}'
# Ожидаемый ответ: 200 OK с JSON от агента
```

> **Production caveat:** В реальной системе X-API-Key лежит не на фронте, а в backend'е, который дёргает n8n за пользователя. Фронт никогда не видит ключ. Для M5 это упрощение — сделайте отметку об этом в README.

### A.4 Шаг 3 — собрать workflow в n8n

> 📌 **Важно про AI Agent + sub-nodes.** В n8n AI Agent — это одна нода с подключёнными sub-nodes (Memory, Tools, Output Parser, Chat Model), не линейная цепочка. Sub-nodes подключаются к AI Agent через разные типы connections:

```
┌─────────────────────┐
│ Chat Model          │ ──ai_languageModel──┐
└─────────────────────┘                     │
┌─────────────────────┐                     │
│ Window Buffer       │ ──ai_memory─────────┤
│ Memory              │                     │
└─────────────────────┘                     ├──▶ [ AI Agent ] ──main──▶ Respond
┌─────────────────────┐                     │
│ MCP Tool / HTTP Tool│ ──ai_tool───────────┤
└─────────────────────┘                     │
┌─────────────────────┐                     │
│ Output Parser       │ ──ai_outputParser───┘
└─────────────────────┘
```

#### Главные ноды в основной цепочке

**Webhook Trigger** (`n8n-nodes-base.webhook`)
- HTTP Method: POST
- Path: `feature-control`
- Authentication: Header Auth → ваш credential `n8n-feature-control-api-key`
- Response Mode: Using 'Respond to Webhook' Node (важно!)

**Switch — Input Validation** (`n8n-nodes-base.switch`, n8n 2.x)

> ⚠️ В n8n 2.x Switch работает в режиме rules (не expression-mode из старых версий). Каждое правило — набор conditions с leftValue / operator / rightValue.

- Mode: rules
- Add fallback output: включить (Options → Fallback Output → Extra output)
- 4 правила (каждое → output 0/1/2/3, fallback → output 4 → AI Agent):

| # | outputKey | leftValue | operator | rightValue |
|---|-----------|-----------|----------|------------|
| 0 | missing_feature_id | `={{ $json.feature_id }}` | string · isEmpty | — |
| 1 | missing_action | `={{ $json.action }}` | string · isEmpty | — |
| 2 | invalid_action | `={{ ['check','test','rollback','rollout'].includes($json.action) }}` | boolean · equals | false |
| 3 | invalid_traffic | `={{ $json.traffic_percentage !== undefined && ($json.traffic_percentage < 0 \|\| $json.traffic_percentage > 100) }}` | boolean · equals | true |

Каждый reject-output (0-3) подключите к общему Respond to Webhook (400) с body:
```json
{"success": false, "message": "Validation error", "rejected_at": "input-validation"}
```

**AI Agent — Tools Agent** (`@n8n/n8n-nodes-langchain.agent`, typeVersion 3)
- Подключён к fallback output Switch (main[4])
- В UI Options блок:
  - System Message: `=` + ваш GCAO из A.5
  - Max Iterations: 5

**Sub-nodes к AI Agent:**

a) **Chat Model** (любой, ваш выбор) — Claude / GPT / Gemini / OpenRouter
   - Connection: `ai_languageModel` → AI Agent

b) **Window Buffer Memory** (`@n8n/n8n-nodes-langchain.memoryBufferWindow`)
   - contextWindowLength: 5
   - sessionIdType: customKey (важно!)
   - sessionKey: `={{ $json.feature_id }}`
   - Connection: `ai_memory` → AI Agent

c) **Tools** — два варианта:
   - **Вариант 1 (рекомендуемый):** MCP Client Tool (`@n8n/n8n-nodes-langchain.toolMcp`)
   - **Вариант 2:** 3× HTTP Request Tool (`n8n-nodes-base.httpRequestTool`)
   - Connection: `ai_tool` → AI Agent

d) **Structured Output Parser** (`@n8n/n8n-nodes-langchain.outputParserStructured`)
   - schemaType: manual
   - inputSchema:
   ```json
   {
     "type": "object",
     "required": ["success", "message"],
     "properties": {
       "success": {"type": "boolean"},
       "message": {"type": "string"},
       "current_state": {
         "type": ["object", "null"],
         "properties": {
           "id": {"type": "string"},
           "name": {"type": "string"},
           "status": {"type": "string", "enum": ["Enabled", "Disabled", "Testing"]},
           "traffic_percentage": {"type": "number"},
           "last_modified": {"type": "string"}
         }
       },
       "rejected_at": {"type": ["string", "null"]}
     }
   }
   ```
   - Connection: `ai_outputParser` → AI Agent

**Respond to Webhook (200)** (`n8n-nodes-base.respondToWebhook`)
- Подключён к main[0] AI Agent
- Respond With: json
- Response Body: `={{ $json }}`
- Response Code: 200

### A.5 Шаг 4 — GCAO system prompt для WF1

GCAO — production-стандарт для system prompt: Goal / Context / Action / Output (+ опционально Constraints).

```
Goal:
Выполни запрос пользователя по управлению feature flag {{$json.feature_id}}.

Context:
- Текущее состояние feature flag получи через get_feature_info ПЕРЕД любыми изменениями.
- Команда от UI: action={{$json.action}}, target_state={{$json.target_state}}, traffic_percentage={{$json.traffic_percentage}}.
- Доступные actions: "check" (только чтение), "test" (перевести в Testing), "rollback" (Disabled), "rollout" (изменить traffic_percentage).
- Available tools: get_feature_info, set_feature_state, adjust_traffic_rollout.

Action:
1. Если action="check" — вызови get_feature_info и верни результат.
2. Если action="test" — get_feature_info → проверь что фича не Enabled → set_feature_state(Testing) → get_feature_info для верификации.
3. Если action="rollback" — get_feature_info → если уже Disabled, верни no_op → иначе set_feature_state(Disabled) → get_feature_info.
4. Если action="rollout" — get_feature_info → adjust_traffic_rollout(traffic_percentage) → get_feature_info.
5. На любом шаге если invalid params — верни ошибку без вызова инструментов.

Output:
JSON строго по схеме:
{
  "success": boolean,
  "message": string (краткое описание результата на русском, 1 предложение),
  "current_state": {
    "id": string,
    "name": string,
    "status": "Enabled" | "Disabled" | "Testing",
    "traffic_percentage": number,
    "last_modified": string (ISO 8601)
  } | null,
  "rejected_at": "input-validation" | "tool-execution" | null
}

Constraints:
- traffic_percentage в диапазоне [0, 100]. Если получен -50 или 150 — отказ с message объяснения.
- target_state из enum [Enabled, Disabled, Testing]. Если другое — отказ.
- НЕ вызывай set_feature_state повторно если current_state.status уже соответствует целевому.
- Если ошибка от MCP-инструмента — верни success=false с message от инструмента.
```

> ⚠️ Помните: Constraints в промте — рекомендация, не закон. Реальная защита от -50 живёт в Switch-ноде + JSON Schema на MCP. Промт — это дополнительный слой, не основной.

### A.6 Шаг 5 — симулятор WF1 dispatcher (simulate_wf1.py)

Скрипт автоматически дёргает ваш webhook WF1 с разными командами по таймеру. `traffic_percentage` меняется по синусоиде — `50 + 40 * sin(t)`.

```python
#!/usr/bin/env python3
"""
simulate_wf1.py — dispatcher для WF1 manual trigger workflow.

Usage:
    python3 simulate_wf1.py --webhook-url https://your-n8n.com/webhook --api-key XXX
    python3 simulate_wf1.py ... --duration 120 --interval 10
    python3 simulate_wf1.py ... --include-invalid
"""

import argparse, json, math, os, sys, time
from datetime import datetime
import requests

def run(webhook_url, api_key, feature_id, duration, interval, include_invalid):
    start = time.time()
    headers = {"Content-Type": "application/json", "X-API-Key": api_key}
    actions_cycle = ["check", "test", "rollout", "check", "rollback", "check"]
    iteration = 0

    while time.time() - start < duration:
        t = time.time() - start
        traffic_percentage = int(50 + 40 * math.sin(2 * math.pi * t / 60))
        action = actions_cycle[iteration % len(actions_cycle)]

        payload = {"feature_id": feature_id, "action": action}
        if action == "rollout":
            payload["traffic_percentage"] = traffic_percentage
        elif action in ("test", "rollback"):
            payload["target_state"] = "Testing" if action == "test" else "Disabled"

        if include_invalid and iteration > 0 and iteration % 7 == 0:
            payload["traffic_percentage"] = -50
            payload["action"] = "rollout"
            print(f"[{datetime.now().isoformat()}] [INVALID test] payload={payload}")
        else:
            print(f"[{datetime.now().isoformat()}] action={action} payload={payload}")

        try:
            r = requests.post(webhook_url, headers=headers, json=payload, timeout=30)
            data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text}
            print(f"  → status={r.status_code} success={data.get('success')} message={data.get('message')}")
        except requests.exceptions.RequestException as e:
            print(f"  → network error: {e}", file=sys.stderr)

        iteration += 1
        time.sleep(interval)

def main():
    p = argparse.ArgumentParser(description="WF1 dispatcher simulator")
    p.add_argument("--webhook-url", required=True)
    p.add_argument("--api-key", default=os.environ.get("N8N_API_KEY", ""))
    p.add_argument("--feature-id", default="search_v2")
    p.add_argument("--duration", type=float, default=120)
    p.add_argument("--interval", type=float, default=10)
    p.add_argument("--include-invalid", action="store_true")
    args = p.parse_args()

    if not args.api_key:
        sys.exit("X-API-Key не задан: --api-key или env N8N_API_KEY")

    print(f"Запуск simulate_wf1.py — duration={args.duration}s, interval={args.interval}s")
    run(args.webhook_url, args.api_key, args.feature_id, args.duration, args.interval, args.include_invalid)
    print("---\nЗавершено.")

if __name__ == "__main__":
    main()
```

### A.7 Проверка WF1

- [ ] В Dashboard виден блок «Auto-Pilot Controls» с 3 кнопками
- [ ] Клик «Тестовый режим» → бордюр статус-бейджа меняется через 2-3 секунды
- [ ] При успешной операции — alert «Готово, фича в Testing»
- [ ] При попытке rollback уже-disabled фичи — agent возвращает success: true, message: "Фича уже Disabled"
- [ ] `curl` без X-API-Key → 403
- [ ] `curl` с правильным X-API-Key + валидный payload → 200 + JSON
- [ ] `simulate_wf1.py --include-invalid` — видно отказы на -50, успешные операции на валидных
- [ ] В n8n executions trace видно цепочку: Webhook → Switch → AI Agent (с reasoning) → Respond
- [ ] Switch настроен в режиме rules (не expression), 4 правила + fallback output
- [ ] Sub-nodes AI Agent подключены через правильные types: `ai_languageModel`, `ai_memory`, `ai_tool`, `ai_outputParser`
- [ ] Window Buffer Memory имеет `sessionKey = $json.feature_id`
- [ ] AI Agent ноде включены Verbose и Return Intermediate Steps

---

## Часть B. WF2 — Scheduled defensive monitor

~1.5-2 часа. Симулятор-генератор логов с синусоидой + n8n cron workflow + Telegram alert + GCAO + re-enable.

### B.1 Что должно получиться (ASCII схема)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PYTHON: simulate_wf2.py (запущен фоном)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Sine error rate: amplitude 0.10, baseline 0.05, period 5 минут      │    │
│  │ → error_rate(t) = max(0, 0.05 + 0.10 * sin(2π·t/300))               │    │
│  │ → каждую секунду пишет N событий success/error в logs.json          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└────────────┬────────────────────────────────────────────────────────────────┘
             │ append
             ▼
       ┌────────────────────┐
       │ logs.json          │
       │ [{ts, fid, status}]│
       └────────┬───────────┘
                │ read
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  N8N WORKFLOW: wf2-scheduled-monitor (cron каждую минуту)                   │
│                                                                             │
│  Schedule Trigger ──▶ Code Node (read logs) ──▶ HTTP Request (get status)   │
│       ──▶ Merge Data ──▶ Switch (deactivate / reenable / noop)              │
│            ├── Set "deactivate" ──▶ AI Agent ──▶ Telegram                   │
│            ├── Set "reenable"   ──▶ AI Agent ──▶ Telegram                   │
│            └── NoOp (fallback)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### B.2 Шаг 1 — симулятор-генератор логов (simulate_wf2.py)

Пишет события success / error в `logs.json` с error_rate, который меняется по синусоиде.

- Период — 5 минут. amplitude 10%, baseline 5%.
- В минимуме синусоиды error_rate ≈ 0%
- В максимуме error_rate ≈ 15%
- Threshold WF2 = 5% — каждые ~5 минут error_rate проходит через threshold вверх и вниз

```python
#!/usr/bin/env python3
"""
simulate_wf2.py — log generator with sine-wave error rate.

Usage:
    python3 simulate_wf2.py --output logs.json --duration 1800 --period 300
    python3 simulate_wf2.py ... --rps 5 --amplitude 0.10 --baseline 0.05
"""

import argparse, json, math, random, sys, time
from datetime import datetime, timezone
from pathlib import Path

def sine_error_rate(t, period, amplitude, baseline):
    raw = baseline + amplitude * math.sin(2 * math.pi * t / period)
    return max(0.0, min(1.0, raw))

def run(output_path, feature_id, duration, rps, period, amplitude, baseline):
    if not output_path.exists():
        output_path.write_text("[]")
    start = time.time()
    interval = 1.0 / rps

    while time.time() - start < duration:
        t = time.time() - start
        rate = sine_error_rate(t, period, amplitude, baseline)
        status = "error" if random.random() < rate else "success"

        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "feature_id": feature_id,
            "status": status,
            "error_rate_now": round(rate, 3),
        }

        try:
            existing = json.loads(output_path.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            existing = []
        existing.append(event)
        if len(existing) > 10_000:
            existing = existing[-10_000:]
        output_path.write_text(json.dumps(existing, ensure_ascii=False, indent=None))

        if int(t) % 5 == 0 and int(t * rps) % int(rps * 5) == 0:
            print(f"t={int(t)}s rate={rate:.1%} status={status} total_events={len(existing)}")
        time.sleep(interval)

def main():
    p = argparse.ArgumentParser(description="WF2 log generator (sine error rate)")
    p.add_argument("--output", default="logs.json")
    p.add_argument("--feature-id", default="search_v2")
    p.add_argument("--duration", type=float, default=1800)
    p.add_argument("--rps", type=float, default=5)
    p.add_argument("--period", type=float, default=300)
    p.add_argument("--amplitude", type=float, default=0.10)
    p.add_argument("--baseline", type=float, default=0.05)
    args = p.parse_args()

    print(f"simulate_wf2.py — duration={args.duration}s, rps={args.rps}, period={args.period}s")
    print(f"sine: baseline={args.baseline:.1%}, amplitude={args.amplitude:.1%}")
    print(f"Threshold WF2 = 5% → фича toggle'ится примерно каждые {args.period/2:.0f}s")
    run(Path(args.output), args.feature_id, args.duration, args.rps, args.period, args.amplitude, args.baseline)

if __name__ == "__main__":
    main()
```

### B.3 Шаг 2 — собрать workflow в n8n

**Ноды (по порядку):**

1. **Schedule Trigger** (`n8n-nodes-base.scheduleTrigger`) — every 1 minute
2. **Code Node** — читает `logs.json`, считает error_rate за последнюю минуту
3. **HTTP Request** — Get Feature Status через MCP M3
4. **Code Node "Merge Data"** — объединяет данные в один `$json`
5. **Switch "Decision"** (rules mode):
   - Output 0 `deactivate`: `error_rate > 0.05 AND current_status != "Disabled"`
   - Output 1 `reenable`: `error_rate < 0.01 AND current_status == "Disabled"`
   - Fallback → NoOp
6. **2× Set Node** — "Set Decision deactivate" / "Set Decision reenable"
7. **AI Agent** (ОДИН агент, обе ветки) — maxIterations: 3, БЕЗ Memory
8. **Telegram Send Message** — только от AI Agent main
9. **NoOp** — fallback

### B.4 Шаг 3 — GCAO system prompt для WF2

```
Goal:
Зарегистрировать инцидент или recovery для feature {{$json.feature_id}}.
Decision из upstream: {{$json.decision}} (deactivate | reenable).

Context:
- Decision уже посчитан upstream (в Switch-ноде) — твоя задача выполнить решение через MCP.
- Available tools: get_feature_info, set_feature_state.
- НЕ принимай решение самостоятельно: следуй decision из payload.

Action:
1. Вызови get_feature_info для актуального state.
2. Если decision="deactivate": проверь что status != "Disabled" → set_feature_state("Disabled") → verify.
3. Если decision="reenable": проверь что status == "Disabled" → set_feature_state("Enabled") → verify.
4. Сформируй alert_message для Telegram.

Output:
JSON: { action_taken, previous_state, new_state, alert_message, error_rate_percent, threshold_used, reason }

Constraints:
- НЕ вызывай set_feature_state если state уже соответствует целевому.
- alert_message на русском: 🚨 для deactivate, ✅ для reenable.
```

### B.5 Шаг 4 — Telegram бот для алертов

1. Открыть @BotFather в Telegram → `/newbot`
2. Скопировать bot token
3. Написать боту `/start`, затем:
   ```bash
   curl "https://api.telegram.org/bot{YOUR_TOKEN}/getUpdates"
   ```
4. Найти `chat.id` в ответе
5. В n8n: Credentials → New → Telegram API → bot token

### B.6 Проверка WF2

- [ ] `simulate_wf2.py` пишет в `logs.json` события
- [ ] Schedule Trigger срабатывает каждую минуту (нода — `scheduleTrigger`, не cron)
- [ ] Merge Data Code-нода стоит между HTTP Request и Switch
- [ ] Switch (rules mode) корректно ветвит deactivate / reenable / fallback noop
- [ ] Fallback output Switch → NoOp нода
- [ ] AI Agent НЕ вызывает `set_feature_state` повторно если state уже целевой
- [ ] AI Agent без Memory ноды (cron stateless)
- [ ] Telegram подключён ТОЛЬКО к AI Agent main (не к NoOp)
- [ ] За 10 минут (period=120s) видно ~2 цикла toggle

---

## Часть C. Тест на галлюцинации (ОБЯЗАТЕЛЬНО)

POST на webhook WF1:
```bash
curl -X POST https://your-n8n.com/webhook/feature-control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key-here" \
  -d '{"feature_id": "search_v2", "action": "rollout", "traffic_percentage": -50}'
```

Ожидаемый ответ:
```json
{"success": false, "message": "Процент трафика должен быть в диапазоне 0-100. Получено: -50", "rejected_at": "input-validation"}
```

**Где стоит защита (defense in depth):**
1. **Switch-нода ДО AI Agent** — Algorithm-before-AI
2. **JSON Schema в MCP-сервере M3** — `min: 0, max: 100`

> **Constraint в коде — закон. Constraint в промте — рекомендация.**

---

## Часть D. Как использовать Claude Code-агентов

### D.1 Установка субагентов

```bash
mkdir -p ~/.claude/agents
cp aidev-course-materials/M5/agents/n8n-workflow-builder.md ~/.claude/agents/
cp aidev-course-materials/M5/agents/n8n-requirements-orchestrator.md ~/.claude/agents/
```

### D.2 Промпт 1 — Requirements Orchestrator

```
Запусти субагента n8n-requirements-orchestrator.
Войди в режим брейншторма. Я расскажу user story, ты задавай уточняющие
вопросы пока не получишь полный spec.

User story: [ваша задача]
```

### D.3 Промпт 2 — Workflow Builder (spec → JSON)

Готовые промпты для WF1 и WF2 со всеми нодами, typeVersion и connection types — см. полную спецификацию задания.

---

## Сдача — что в PR

```
proshop_mern/
├── frontend/src/
│   └── (расширенный Dashboard + AutoPilotControls.jsx)
└── docs/m5/
    ├── README.md
    ├── wf1-manual-trigger.json
    ├── wf2-scheduled-monitor.json
    ├── simulate_wf1.py
    ├── simulate_wf2.py
    ├── logs.json
    ├── trace-wf1.png
    ├── trace-wf2-toggle.png
    └── screencast.mp4 (или ссылка)
```

---

## Чеклист перед PR

### WF1 — Manual trigger
- [ ] Feature Dashboard расширен блоком «Auto-Pilot Controls» с 3 кнопками
- [ ] Webhook trigger принимает POST `/feature-control` с auth X-API-Key
- [ ] Без правильного header — 403
- [ ] Switch (rules mode) валидирует параметры до AI Agent (4 правила + fallback)
- [ ] AI Agent sub-nodes: `ai_languageModel`, `ai_memory`, `ai_tool`, `ai_outputParser`
- [ ] `maxIterations=5`, System Message с `=` prefix
- [ ] Respond to Webhook возвращает JSON `{success, message, current_state}`

### WF2 — Scheduled monitor
- [ ] `simulate_wf2.py` работает с синусоидальным error rate
- [ ] Schedule Trigger каждую минуту (`scheduleTrigger`)
- [ ] Merge Data Code-нода перед Switch
- [ ] Switch: deactivate / re-enable + fallback → NoOp
- [ ] AI Agent без Memory, не спамит повторными вызовами
- [ ] Telegram только от AI Agent (не от NoOp)

### Тест на галлюцинации
- [ ] `traffic_percentage: -50` отвергается до AI Agent (Switch)
- [ ] JSON Schema в MCP M3 имеет `min: 0, max: 100`
- [ ] `simulate_wf1.py --include-invalid` показывает отказы

### Сдача
- [ ] PR создан, `docs/m5/` содержит все артефакты
- [ ] Screencast 3-5 мин
- [ ] README отвечает на все секции шаблона

---

## Бонусы (опционально)

- HITL Wait-нода на критическое действие
- Langfuse / LangSmith трейсинг
- Multi-agent supervisor + worker
- Deploy через n8n MCP
- Postgres Chat Memory вместо Window Buffer
- Replay-логика (re-enable через N минут)

---

## Полезные ресурсы

| Что | Где |
|-----|-----|
| n8n документация | https://docs.n8n.io |
| AI Agent node | https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent |
| MCP Client Tool | https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.mcpclienttool |
| Anthropic «Building Effective Agents» | https://www.anthropic.com/research/building-effective-agents |
| Anthropic «Writing Effective Tools» | https://www.anthropic.com/engineering/writing-tools-for-agents |
| n8n templates | https://n8n.io/workflows |
| Telegram Bot API | https://core.telegram.org/bots/api |
