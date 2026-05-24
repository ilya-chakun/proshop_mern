# Как было записано демо-видео (screencast.webm)

## Проблема

AI-агент (Claude в opencode) имеет доступ к браузеру через Puppeteer MCP, но стандартный Puppeteer MCP **не умеет записывать видео** — только делать скриншоты. При попытке сохранить скриншот как base64 (`encoded: true`), данные обрезались из-за лимита вывода инструмента (~240 KB).

## Решение: Playwright video recording

[Playwright](https://playwright.dev/python/) — альтернатива Puppeteer от Microsoft — поддерживает **встроенную запись видео** при создании browser context:

```python
context = browser.new_context(
    viewport={"width": 1280, "height": 720},
    record_video_dir="/tmp/pw-demo",
    record_video_size={"width": 1280, "height": 720}
)
```

Видео записывается автоматически в фоне и сохраняется при закрытии контекста (`context.close()`). Формат — **WebM (VP8)**, воспроизводится в любом современном браузере.

## Установка

```bash
pip3 install playwright
python3 -m playwright install chromium
```

Playwright скачивает свой Chromium (~92 MB) в `~/Library/Caches/ms-playwright/`.

## Скрипт записи

```python
from playwright.sync_api import sync_playwright
import time, json, urllib.request

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        record_video_dir="/tmp/pw-demo",
        record_video_size={"width": 1280, "height": 720}
    )
    page = context.new_page()

    # Login to n8n
    page.goto("http://localhost:5678/signin")
    time.sleep(2)
    page.fill('input[autocomplete="email"]', 'test@gmail.com')
    page.fill('input[autocomplete="current-password"]', '***')
    page.locator('button:has-text("Sign in")').click(timeout=5000)
    time.sleep(3)

    # SCENE 1: n8n Overview (3s)
    time.sleep(3)

    # SCENE 2: WF1 Canvas (4s)
    page.goto("http://localhost:5678/workflow/jCiU37drHMGylcS3")
    time.sleep(4)

    # SCENE 3: Fire WF1 test request
    req = urllib.request.Request(
        "http://localhost:5678/webhook/feature-control",
        data=json.dumps({"feature_id": "search_v2", "action": "check"}).encode(),
        headers={
            "Content-Type": "application/json",
            "x-api-key": "***"
        }
    )
    try:
        urllib.request.urlopen(req, timeout=15)
    except:
        pass
    time.sleep(3)

    # SCENE 4: WF1 Execution trace (5s)
    page.goto("http://localhost:5678/workflow/jCiU37drHMGylcS3/executions/143")
    time.sleep(5)

    # SCENE 5: WF2 Canvas (4s)
    page.goto("http://localhost:5678/workflow/ZdsYUJjX5SdPtawd")
    time.sleep(4)

    # SCENE 6: WF2 Execution — deactivate + AI Agent + Telegram (5s)
    page.goto("http://localhost:5678/workflow/ZdsYUJjX5SdPtawd/executions/142")
    time.sleep(5)

    # SCENE 7: Back to overview (3s)
    page.goto("http://localhost:5678")
    time.sleep(3)

    # Закрытие контекста финализирует видео
    context.close()
    browser.close()
```

## Что показано в видео

| Время | Сцена | Описание |
|-------|-------|----------|
| 0-5s | Login | Авторизация в n8n |
| 5-8s | Overview | Dashboard с двумя опубликованными workflows |
| 8-12s | WF1 Canvas | Архитектура WF1: Webhook → Switch → AI Agent → Response |
| 12-15s | WF1 Test | Отправка POST-запроса `action: "check"` |
| 15-20s | WF1 Trace | Execution #143: успешный check через AI Agent |
| 20-24s | WF2 Canvas | Архитектура WF2: Schedule → Logs → Decision → AI Agent → Telegram |
| 24-29s | WF2 Trace | Execution #142: deactivate path → AI Agent → Telegram Send Message |
| 29-32s | Overview | Финал |

## Почему WebM, а не MP4

Playwright записывает в формате WebM (VP8). Для конвертации в MP4 нужен `ffmpeg`:

```bash
# Если ffmpeg установлен:
ffmpeg -i screencast.webm -c:v libx264 -preset fast -crf 23 screencast.mp4

# Установка ffmpeg на macOS:
brew install ffmpeg
```

На момент записи `ffmpeg` не был установлен, поэтому видео сохранено в WebM.

## Ключевые моменты

1. **Headless recording** — браузер не отображается на экране, видео рендерится внутренним движком Chromium. Идеально для CI/CD и AI-агентов.
2. **Автоматические паузы** — `time.sleep()` между сценами дают зрителю время увидеть содержимое.
3. **Реальные данные** — видео снято на работающем n8n с реальными execution traces, а не на моках.
4. **Размер** — ~2.2 MB за 35 секунд (1280×720). Достаточно компактно для git.

## Альтернативные подходы (не использованы)

| Подход | Плюсы | Минусы |
|--------|-------|--------|
| Puppeteer скриншоты → ffmpeg slideshow | Не нужен Playwright | Нет анимаций, нужен ffmpeg |
| macOS `screencapture` | Нативное качество | Нужен headed browser, не автоматизируется |
| OBS Studio | Профессиональное качество | Ручная работа, не для AI-агента |
| Playwright Trace Viewer | Интерактивный trace | Другой формат, не видео |
