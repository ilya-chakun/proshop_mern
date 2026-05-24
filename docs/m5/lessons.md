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
