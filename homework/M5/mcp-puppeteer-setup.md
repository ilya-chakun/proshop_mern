# MCP Puppeteer — Setup & Lessons

## Зачем

AI-агенту (OpenCode) нужен браузер для E2E-тестов, скриншотов и автоматизации.
MCP-сервер Puppeteer даёт агенту инструменты: `navigate`, `screenshot`, `click`, `fill`, `evaluate` — без написания кода.

## Как установили

```bash
# 1. Изолированная папка (не засоряет корневой node_modules)
mkdir -p mcp-servers/puppeteer && cd mcp-servers/puppeteer

# 2. Инициализация + установка
npm init -y
npm install @modelcontextprotocol/server-puppeteer

# 3. Скачать Chromium
npx puppeteer browsers install chrome

# 4. Добавить в .gitignore
echo 'mcp-servers/' >> .gitignore
```

## Конфигурация (`opencode.json`)

```json
"puppeteer": {
  "type": "local",
  "command": [
    "node",
    "<project>/mcp-servers/puppeteer/node_modules/@modelcontextprotocol/server-puppeteer/dist/index.js"
  ],
  "enabled": true
}
```

После добавления — перезапустить OpenCode.

## Уроки

1. **Изоляция**: отдельная папка `mcp-servers/` — не конфликтует с проектом, легко удалить.
2. **Пакет deprecated**: `@modelcontextprotocol/server-puppeteer` помечен deprecated, но работает. Следить за заменой.
3. **Chromium кэшируется** в `~/.cache/puppeteer/` — общий для всех проектов, не дублируется.
4. **Не нужен глобальный install**: локальная установка + абсолютный путь к `dist/index.js` надёжнее.
5. **Playwright vs Puppeteer**: установили оба. Playwright — для ручных скриптов (`node test.js`), Puppeteer MCP — для AI-агента через инструменты.
