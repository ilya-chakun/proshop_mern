# M5 Lessons Learned

## 1. n8n Self-Hosted: нет MCP Client Tool
- **Проблема:** Сгенерировал workflow с нодой `@n8n/n8n-nodes-langchain.toolMcp` — при активации n8n вернул `Unrecognized node type`.
- **Причина:** MCP Client Tool — community/enterprise нода, отсутствует в базовом Docker-образе `n8nio/n8n:latest`.
- **Решение:** Заменил на `@n8n/n8n-nodes-langchain.toolHttpRequest` (3 HTTP Request Tool для WF1, 2 для WF2). Работает из коробки.
- **Урок:** Перед генерацией workflow JSON — проверять доступные типы нод в конкретной инсталляции.

## 2. n8n REST API: активация требует versionId
- **Проблема:** `PATCH /rest/workflows/:id` с `{"active": true}` молча возвращал `active: false`.
- **Причина:** n8n 2.x требует `versionId` в теле запроса для любых изменений. Без него — игнорирует.
- **Решение:** `POST /rest/workflows/:id/activate` с `{"versionId": "..."}` — правильный эндпоинт.
- **Урок:** PATCH для данных workflow, POST /activate для активации. Всегда передавать versionId.

## 3. n8n 2.x: Publish вместо Activate в UI
- **Проблема:** Пользователь не нашёл кнопку "Activate" — в UI была только "Publish".
- **Причина:** В n8n 2.x терминология изменилась: "Publish" = активация workflow.
- **Урок:** Не предполагать UI элементы по документации старых версий.

## 4. Credentials можно создавать через REST API
- **Проблема:** Изначально план предполагал ручное создание credentials в n8n UI (~10 мин).
- **Решение:** Всё делается через `POST /rest/credentials` + привязка через `PATCH /rest/workflows/:id`.
- **Урок:** n8n REST API покрывает ~95% UI-операций. Ручная работа нужна только для визуальной проверки canvas.

## 5. Chat Model: Anthropic ≠ подписка Claude
- **Проблема:** Пользователь имел подписку ChatGPT Plus и Claude, но не имел API ключей.
- **Причина:** Подписка на claude.ai / ChatGPT Plus ≠ API доступ. API ключи — отдельные платформы, отдельные балансы.
- **Решение:** Google Gemini — бесплатный API tier через aistudio.google.com, создаётся за 30 секунд.
- **Урок:** Для домашних/учебных проектов рекомендовать Gemini как дефолт — нулевой порог входа.
- **Обновление:** Gemini 429 rate limit → перешли на Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`). Работает стабильно.

## 6. Секреты в плане: не хардкодить
- **Проблема:** При автоматизации Telegram credentials токен и chat_id попали в PLAN_M5.md.
- **Решение:** Заменил на плейсхолдеры `<YOUR_TELEGRAM_BOT_TOKEN>`, `<YOUR_CHAT_ID>`. Файлы с кредами — в .gitignore.
- **Урок:** После любой работы с секретами — grep по всем docs на предмет утечки.

## 7. react-scripts 3.x: REACT_APP_, не VITE_
- **Проблема:** Спецификация домашки содержала `VITE_N8N_*` переменные.
- **Причина:** Проект использует react-scripts 3.4.3, не Vite. Env-переменные должны начинаться с `REACT_APP_`.
- **Урок:** Всегда проверять `package.json` и build tooling перед именованием env-переменных.

## 8. Файлы с кредами: отдельно, не в .env
- **Подход:** Пользователь клал credentials в отдельные .txt файлы (`n8n_creds.txt`, `telegram_bot_keys.txt`, `google_gemini_api_key.txt`), AI читал и применял через API.
- **Урок:** Удобный паттерн для AI-автоматизации — человек кладёт секрет в файл, AI подхватывает. Файлы сразу в .gitignore.

## 9. Webhook body: $json.body, не $json

- **Проблема:** Switch нода маршрутизировала ВСЕ запросы как невалидные, даже с правильным `action:"check"`.
- **Причина:** Когда Webhook Trigger работает в режиме `responseNode` (Respond to Webhook), структура `$json` — это обёртка: `{headers, params, query, body, webhookUrl, executionMode}`. Поля из тела запроса находятся в `$json.body.action`, а не `$json.action`.
- **Диагностика:** Нашёл через execution trace в n8n API — распарсил `resultData` и увидел реальную структуру JSON.
- **Решение:** Заменил все `$json.feature_id` → `$json.body.feature_id`, `$json.action` → `$json.body.action` и т.д. по всем Switch rules и AI Agent system prompt.
- **Урок:** Всегда проверять реальную структуру `$json` через execution trace, а не предполагать из документации. Режим Webhook влияет на вложенность данных.

## 10. n8n expressions: Array.includes() не работает в `={{ }}`

- **Проблема:** Выражение `{{ ['check','test','rollback','rollout'].includes($json.body.action) }}` всегда возвращало `false`.
- **Причина:** n8n expression engine (основан на tournament/tmpl) не поддерживает литералы массивов внутри `={{ }}`.
- **Решение:** Использовал строковый трюк: `{{ ",check,test,rollback,rollout,".includes("," + $json.body.action + ",") }}` — работает стабильно.
- **Урок:** n8n expressions ≠ полный JavaScript. Для сложной логики — использовать Code ноду или строковые методы.

## 11. Gemini API: Structured Output Parser и nullable types

- **Проблема:** AI Agent падал с `[400 Bad Request] Proto field is not repeating, cannot start list`.
- **Причина:** Structured Output Parser генерировал JSON Schema с `"type": ["object", "null"]` (JSON Schema nullable через массив типов). Gemini API (v1beta generateContent) не поддерживает массив в `type` — это расширение JSON Schema, не входящее в OpenAPI 3.0.
- **Решение:** Заменил схему на простые типы без null-вариантов: `"type": "object"` вместо `"type": ["object", "null"]`.
- **Урок:** Google Gemini Function Calling использует подмножество JSON Schema, совместимое с OpenAPI 3.0. Массив типов, `oneOf`, `anyOf` — не поддерживаются. Всегда тестировать schema на конкретном провайдере.

## 12. Gemini Free Tier: жёсткие rate limits

- **Проблема:** После 5-6 тестовых запросов Gemini начал возвращать `429 Too Many Requests`.
- **Причина:** Free tier имеет лимит ~15 RPM (requests per minute) и ~1500 RPD (requests per day) для `gemini-2.0-flash`. При каждом запросе AI Agent делает 2-3 вызова (system prompt + tool calls + final response).
- **Масштаб:** Для домашки хватает, но при активной разработке/отладке — нет.
- **Урок:** Для отладки workflow с AI Agent — минимизировать количество тестовых прогонов. Сначала отладить Switch/валидацию (без LLM), потом тестировать AI Agent 1-2 раза. Или использовать платный tier ($0 до определённого лимита с billing account).

## 13. n8n execution data: сложная индексная структура

- **Проблема:** Нужно было понять, почему AI Agent падает, но execution data в n8n API — это не простой JSON, а индексированный массив.
- **Структура:** `data` — массив, где `data[0]` — корневой индекс с ссылками (`resultData: "5"`, `runData: "8"`), а значения достаются по `data[int(ref)]`. Ошибки хранятся как `data[73].message → data[22] → "actual error text"`.
- **Урок:** Для отладки n8n executions через API — писать Python-скрипт для рекурсивной разыменовки индексов. Или использовать UI (но в headless/CI — только API).

## 14. Respond to Webhook: пустое тело при ошибке AI Agent

- **Проблема:** При ошибке AI Agent webhook возвращал HTTP 200 с пустым телом, а не 500 с ошибкой.
- **Причина:** Нода "Respond to Webhook 200" стоит после AI Agent в цепочке. Если AI Agent падает — Respond нода не выполняется, и n8n возвращает дефолтный 200 без тела (потому что webhook уже «ожидает» ответ от responseNode).
- **Урок:** Для production нужно добавить Error Trigger → Respond to Webhook 500 с телом ошибки. Иначе клиент получит пустой 200 и не поймёт, что произошло.

## 15. Docker networking: host.docker.internal

- **Проблема:** n8n в Docker не мог достучаться до backend на `localhost:5001`.
- **Причина:** `localhost` внутри контейнера — это сам контейнер, а не хост-машина.
- **Решение:** Использовал `http://host.docker.internal:5001` в HTTP Request Tool URLs. На macOS Docker Desktop это работает из коробки.
- **Урок:** На Linux нужно добавлять `--add-host=host.docker.internal:host-gateway` или использовать Docker network с алиасом.

## 16. Workflow JSON: генерация vs. импорт

- **Проблема:** Сгенерированный JSON workflow содержал ноды, которые не существуют в целевой инсталляции n8n.
- **Цепочка ошибок:** toolMcp → не существует → замена на toolHttpRequest → нужна привязка credentials → через API.
- **Урок:** Генерировать workflow JSON нужно с учётом конкретной версии n8n и установленных пакетов. Идеально: сначала получить список доступных нод через API (`GET /rest/node-types`), потом генерировать.

## 17. toolHttpRequest: `parametersBody.values`, не `bodyParameters.values`

- **Проблема:** POST-запросы из AI Agent tool отправляли пустое тело `{}` на бэкенд, хотя параметры были заданы.
- **Причина:** Нода `toolHttpRequest` использует свой маппинг свойств, отличный от обычного `httpRequest`. Свойство тела называется `parametersBody.values` (не `bodyParameters.values` как в httpRequest).
- **Диагностика:** Прочитал исходный код ноды внутри Docker-контейнера: `updateParametersAndOptions({ parametersPropertyName: 'parametersBody.values' })`.
- **Попытки:** `specifyBody: "json"` с `jsonBody` выражением — `$fromAI` placeholders не резолвились. `specifyBody: "string"` с `body` — тоже пустой. Только `specifyBody: "keypair"` с `parametersBody.values` массивом работает.
- **Решение:**
  ```json
  {
    "specifyBody": "keypair",
    "parametersBody": {
      "values": [
        {"name": "feature_name", "value": "={{ $fromAI('feature_name', '...', 'string') }}"},
        {"name": "state", "value": "={{ $fromAI('state', '...', 'string') }}"}
      ]
    }
  }
  ```
- **Урок:** Для `toolHttpRequest` (AI Agent tools) единственный надёжный способ передать тело — keypair формат с `parametersBody.values`. Документации на это нет — только чтение исходников.

## 18. Structured Output Parser несовместим с Claude

- **Проблема:** AI Agent с Claude возвращал `Model output doesn't fit required format`.
- **Причина:** Structured Output Parser ожидает строгое следование JSON Schema, а Claude иногда обрамляет JSON в markdown code block или добавляет пояснения.
- **Решение:** Удалил Structured Output Parser. Claude корректно возвращает JSON в markdown code block `\`\`\`json ... \`\`\``, что n8n парсит из `output` поля.
- **Урок:** Для Claude лучше не использовать Structured Output Parser — достаточно инструкции в system prompt «верни JSON в формате ...». Claude следует инструкциям надёжнее, чем формальной схеме.

## 19. POST-эндпоинты для feature flags: их не было

- **Проблема:** toolHttpRequest отправлял POST на `/api/feature-flags/state` → 404.
- **Причина:** Бэкенд имел только GET-маршруты (через MCP-сервер). POST-эндпоинтов для изменения состояния не было.
- **Решение:** Добавили два маршрута в `backend/routes/featureFlagsRoutes.js`:
  - `POST /api/feature-flags/state` — принимает `{feature_name, state}`, вызывает `set_feature_state`
  - `POST /api/feature-flags/traffic` — принимает `{feature_name, percentage}`, вызывает `adjust_traffic_rollout`
- **Урок:** MCP-сервер ≠ REST API. Для n8n нужны обычные HTTP-эндпоинты. MCP работает через stdio/SSE, а n8n toolHttpRequest — через HTTP.

## 20. WF2: Telegram не отправляет — потому что Decision → Fallback

- **Проблема:** WF2 исполняется каждую минуту (status: success), но ни одного сообщения в Telegram не приходит.
- **Причина (цепочка):**
  1. Симулятор `simulate_wf2.py` прекратил генерировать логи (работал как background job, завершился).
  2. Code нода фильтрует `events.filter(e => (now - new Date(e.timestamp).getTime()) < windowMs)` — окно 60 секунд.
  3. Все записи в `logs.json` старше 2+ часов → `recent = []` → `error_rate = 0, total_events = 0`.
  4. Decision нода: `deactivate` требует `error_rate > 0.05`, `reenable` требует `error_rate < 0.01 AND status == Disabled`.
  5. С `error_rate = 0` и `status = Testing` — ни одно условие не срабатывает → Fallback → NoOp.
  6. AI Agent и Telegram Send Message никогда не выполняются.
- **Решение:** Нужно перезапустить симулятор с error rate > 5% и дождаться, пока WF2 среагирует.
- **Урок:** «Execution success» в n8n ≠ «полезная работа». Workflow может пройти Schedule → Code → Decision → Fallback и считается успешным, хотя бизнес-логика не сработала. Для мониторинга нужно проверять, какой именно output Decision выбрал.

## 21. n8n Code node: `require('node:fs')` и task runner sandbox

- **Проблема:** Code нода читала `/data/logs/logs.json` через `require('node:fs').readFileSync()` — `error_rate: 0, total_events: 0`, хотя файл был на месте.
- **Причина:** n8n 2.21+ использует **task runner** — изолированный sandbox для Code нод. Sandbox не имеет доступа к файловой системе контейнера, даже если `NODE_FUNCTION_ALLOW_BUILTIN=*` установлен. `require('fs')` формально работает, но `/data/logs/logs.json` внутри sandbox — другой (пустой) файл.
- **Диагностика:** `docker exec proshop-n8n node -e "require('fs').readFileSync('/data/logs/logs.json')"` работал (8.9% error rate), но Code нода видела 0 events. Ключевое отличие: `docker exec` работает в контексте контейнера, а Code нода — в sandbox'е task runner'а.
- **Решение:** Заменил чтение файла на HTTP-запрос `this.helpers.httpRequest({ url: 'http://host.docker.internal:5001/api/feature-flags/logs' })`. Для этого добавили `GET /api/feature-flags/logs` эндпоинт в бэкенд.
- **Урок:** В n8n 2.x Code ноды НЕ имеют доступа к filesystem контейнера. Для чтения данных — использовать HTTP запросы или встроенные n8n хелперы. `fetch()` тоже недоступен (не определён в sandbox), нужно `this.helpers.httpRequest()`.

## 22. Code node: `fetch()` не определён в sandbox

- **Проблема:** Заменив `require('fs')` на `await fetch(url)`, получили `fetch is not defined`.
- **Причина:** Task runner sandbox n8n не предоставляет глобальный `fetch()`.
- **Решение:** Использовали `this.helpers.httpRequest()` — встроенный хелпер n8n, доступный в Code нодах.
- **Урок:** В n8n Code node доступны: `this.helpers.httpRequest()`, `$input`, `$('NodeName')`, но НЕ `fetch()`, `axios`, `require('http')`.

## 23. Docker bind mount + nodemon = restart loop

- **Проблема:** После добавления `./docs/m5/data:/app/m5-logs:ro` в backend volumes, nodemon входил в бесконечный цикл перезапуска (245 рестартов).
- **Причина:** Nodemon по умолчанию отслеживает `*.*` в рабочей директории `/app`. Симулятор пишет в `logs.json` 10 раз в секунду → bind mount синхронизирует изменения в `/app/m5-logs/logs.json` → nodemon детектирует изменение и рестартит → цикл.
- **Решение:** Перенесли mount за пределы `/app`: `./docs/m5/data:/opt/m5-logs:ro`. Nodemon не отслеживает `/opt`.
- **Урок:** Никогда не монтировать часто обновляемые файлы в директорию, которую отслеживает nodemon/webpack/file watcher.

## 24. Merge Data: `$input.first()` vs `$('NodeName').first()`

- **Проблема:** Decision нода получала `error_rate: 0` даже при работающем симуляторе и корректном HTTP-эндпоинте.
- **Причина:** Merge Data Code нода использовала `$input.first().json` для получения данных логов, но `$input` ссылается на **непосредственный предыдущий нод** в цепочке (Get Feature Status), а НЕ на Read & Analyze Logs. `logData` содержало объект features (`{search_v2: {...}}`), а не данные анализа логов.
- **Решение:** Заменили `$input.first().json` на `$('Read & Analyze Logs').first().json` — явная ссылка на конкретный нод по имени.
- **Урок:** В n8n Code нодах с несколькими входами: `$input` = последний подключённый нод. Для конкретного нода — всегда использовать `$('NodeName').first().json`. Это критически важно когда к Code ноде подключены данные из разных веток.

## 25. Decision (Switch v3) typeValidation

- **Проблема:** Decision нода с `typeValidation: "strict"` не маршрутизировала данные, хотя условия выглядели корректными.
- **Диагностика:** Даже с `typeValidation: "loose"` и упрощёнными условиями (только `error_rate > 0.05`) — всё равно Fallback. Оказалось, что проблема была не в Decision, а в входных данных (Merge Data передавала features вместо log analysis).
- **Урок:** При отладке Switch/If нод — сначала проверять, что входные данные действительно содержат ожидаемые поля. Execution trace показывает индексированные данные, что затрудняет отладку.
