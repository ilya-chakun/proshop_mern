# M4 — Design System & UI Redesign

## Инструменты

- **OpenCode CLI** (claude-opus-4.6) — основной AI-агент, оркестрация через AGENTS.md
- **GitHub Copilot** — inline suggestions в WebStorm
- **React 16.13 + react-bootstrap 1.3** (Bootstrap 4) — без новых зависимостей
- **CSS Custom Properties** (`--ps-*`) — дизайн-токены, без CSS modules / styled-components

## Component Decisions

| Решение | Что выбрали | Почему |
|---------|------------|--------|
| Шрифт | DM Sans (Google Fonts) | Геометричный, современный, не Inter |
| Бейджи статусов | Кастомные `.ps-badge-*` с `rgba()` фоном | Тонированные, не сплошные Bootstrap |
| Таблицы | Кастомный `.ps-table` поверх Bootstrap Table | Uppercase заголовки, zebra, hover |
| Формы | Bootstrap Form.Control + inline style tokens | Минимальные изменения, `--ps-radius-sm` |
| Загрузка | Кастомный skeleton shimmer (`.ps-skeleton`) | Не спиннер — скелетон-строки |
| Статус-контрол | `<Form.Control as="select">` (3 варианта) | `switch` бинарный, а нужны 3 состояния |
| Трафик-контрол | `<input type="range">` нативный | Кроссбраузерный, стилизован через `::-webkit-slider-thumb` |
| Стат-панель | Inline текст (`Enabled: N · Testing: N`) | Не цветные карточки — анти-AI-слоп |

## Редизайненные страницы

| # | Страница | Редизайн |
|---|----------|----------|
| 1 | FeatureDashboardScreen (обязательно) | ✅ |
| 2 | HomeScreen | ✅ |
| 3 | LoginScreen | ✅ |
| 4 | RegisterScreen | ✅ |
| 5 | ProductScreen | ✅ |
| 6 | CartScreen | ✅ |
| 7 | ShippingScreen | ✅ |
| 8 | PaymentScreen | ✅ |
| 9 | PlaceOrderScreen | ✅ |
| 10 | OrderScreen | ✅ |
| 11 | ProfileScreen | ✅ |
| 12 | UserListScreen | ✅ |
| 13 | UserEditScreen | ✅ |
| 14 | ProductListScreen | ✅ |
| 15 | ProductEditScreen | ✅ |
| 16 | OrderListScreen | ✅ |

Дополнительно редизайнены компоненты: Product.js, Loader.js, FormContainer.js, CheckoutSteps.js

## Pull Requests

| PR | Описание |
|----|----------|
| #24 | DESIGN.md + PLAN_M4.md + AGENTS.md ссылка |
| #25 | CSS дизайн-токены в index.css |
| #26 | FeatureDashboardScreen + роут + Header |
| #27 | Редизайн 5 публичных экранов + 3 компонента |
| #28 | Редизайн остальных 10 экранов + CheckoutSteps |
| #29 | Отчёт M4 в report.md + docs/m4/ архив |
| #30 | Фикс недостающего --ps-space-0 |
| #31 | Удаление PLAN_M4.md из корня (архив в docs/m4/) |

## Чеклист

### Feature Dashboard (обязательно)
- [x] Страница в admin: роут `/admin/featuredashboard`, проверка isAdmin, ссылка в admin-dropdown в Header
- [x] Список фич из features.json отображается
- [x] Статус-бейджи трёх цветов: Enabled / Testing / Disabled
- [x] Toggle меняет цвет бейджа при клике
- [x] Slider 0–100 обновляет процент traffic_percentage
- [x] Поиск по имени фичи работает
- [x] Фильтр по статусу работает
- [x] Loading skeleton, Empty state, Error state — присутствуют
- [x] ARIA labels + Keyboard navigation

### Редизайн остальных страниц
- [x] Минимум 1 страница (помимо Feature Dashboard) редизайнена — все 15 редизайнены
- [x] В README указан список редизайненных страниц

### DESIGN.md
- [x] DESIGN.md в корне репо рядом с AGENTS.md
- [x] Минимум 7 секций (color / typography / spacing / radius / elevation / components / states) — 8 секций
- [x] Шрифт — не Inter (DM Sans)
- [x] Spacing scale — только числа кратные 8
- [x] Anti-AI-slop guards секция добавлена
- [x] В rules-файле IDE добавлена ссылка `## Design rules: see ./DESIGN.md`

### Anti-AI-slop визуальный аудит
- [x] Нет cringe-градиентов
- [x] Нет 2-column comparison blocks
- [x] Нет heavy borders на карточках
- [x] Hover state есть на кнопках
- [x] Focus state виден при keyboard navigation
- [x] Loading state — skeleton, не просто спиннер
- [x] Все отступы кратны 8
- [x] Бейджи тонированные (rgba), не сплошные Bootstrap
