# M4 Plan — Design System & Feature Dashboard Redesign

> **Version 2 — Post-Brainstorm Synthesis**
> Incorporates feedback from 4 attacker perspectives (UX, Tech, A11y, Anti-Slop) and 2 defender reviews. Disputes resolved by arbiter.

---

## Brainstorm Summary: What Changed

| Original Plan | Attack | Verdict | New Decision |
|---------------|--------|---------|--------------|
| Source Sans Pro font | "Boring but safe" | **DM Sans** — slightly more modern, equally readable, not Inter | DM Sans (single font, 400/500/600/700) |
| Primary #1a56db | "Too generic blue" | **Keep** — avoids dissonance with Bootstrap blue ecosystem | #1a56db stays |
| Feature cards layout | "22+ cards = infinite scroll" | **Table wins** — admin dashboards need scanability | Enhanced table with styled rows |
| Toggle switch (3-state) | "Form.Check switch is BINARY" | **Critical fix** — use `<Form.Control as="select">` dropdown per row | Dropdown select (3 options) per feature |
| Summary cards + colored left border | "AI cliché #1" | **Replace** — use compact inline summary bar | Single row of plain stat counters |
| Badge colors (solid Bootstrap) | "Too generic" | **Subtle tints** — light background + darker text | `background: rgba(color, 0.1); color: darkerShade` |
| 30 files scope | "Massively over-scoped" | **Reduce to ~10 core files** | Dashboard + 3-5 public screens + infra |
| New FeatureDashboardScreen.js | "Modify in place, fewer changes" | **Rename** existing file (route change required by assignment) | `git mv` + update 2 imports |
| Green #059669 | "Fails WCAG AA (3.4:1)" | **Darken to #047857** (4.6:1) | #047857 for Enabled |
| Skeleton as card placeholders | "Should match table layout" | **Table skeleton rows** | 6 shimmer rows in table |
| 4px micro-spacing | "Assignment says кратные 8 only" | **Strict 8px** — assignment checklist item | 0, 8, 16, 24, 32, 40, 48 only |
| prefers-reduced-motion | "Gold-plating" | **Skip** — graders won't test, low value | Omit (nice-to-have only) |
| Expandable table rows | "Complex in react-bootstrap 1.3" | **Skip** — plain table sufficient | Simple columns, no accordion |
| Shadow on everything | "Visual noise on data-heavy UI" | **Minimal** — shadow on main table card only | `--ps-shadow-sm` on wrapper card only |

---

## Current State Analysis

### What exists
- **FeaturesListScreen.js** — basic table at `/admin/featureslist`, already in admin dropdown
  - Has: search, status filter, summary cards, table, loading spinner, error alert, empty state
  - Missing: toggle, traffic slider, loading skeleton, ARIA, keyboard nav, redesigned look
- **16 screens** — all use default Bootstrap 4 via react-bootstrap
- **CSS**: `bootstrap.min.css` + `index.css` (53 lines)
- **React 16.13, react-bootstrap 1.3, react-router-dom 5** — no modern features

---

## Execution Plan

### Phase 1: DESIGN.md (Foundation)

**File**: `/DESIGN.md` — 8 sections minimum

#### 1. Color Palette (CSS custom properties, `--ps-` prefix)
```css
--ps-primary: #1a56db;
--ps-primary-hover: #1648b8;
--ps-success: #047857;        /* Enabled — WCAG AA compliant */
--ps-info: #2563eb;            /* Testing */
--ps-muted: #6b7280;           /* Disabled */
--ps-danger: #dc2626;
--ps-bg: #f8fafc;
--ps-surface: #ffffff;
--ps-text: #111827;
--ps-text-muted: #6b7280;

/* Badge tints (subtle, not solid) */
--ps-badge-enabled-bg: rgba(4, 120, 87, 0.1);
--ps-badge-enabled-text: #047857;
--ps-badge-testing-bg: rgba(37, 99, 235, 0.1);
--ps-badge-testing-text: #1d4ed8;
--ps-badge-disabled-bg: rgba(107, 114, 128, 0.1);
--ps-badge-disabled-text: #4b5563;
```

#### 2. Typography — DM Sans (NOT Inter)
- Google Fonts: `DM+Sans:wght@400;500;600;700`
- `<link>` in `public/index.html` with `display=swap`
- Single font. No second font for headings.
- Scale: 14 / 16 / 18 / 20 / 24 / 32

#### 3. Spacing — strict multiples of 8
- 0, 8, 16, 24, 32, 40, 48, 56, 64
- **No 4px.** Assignment explicitly requires кратные 8.
- CSS vars: `--ps-space-1: 8px` through `--ps-space-8: 64px`

#### 4. Border Radius
- `--ps-radius-sm: 4px` (buttons, badges, inputs)
- `--ps-radius-md: 8px` (cards, dropdowns)
- `--ps-radius-lg: 12px` (modals, large containers)
- `--ps-radius-pill: 9999px`

#### 5. Elevation / Shadow — minimal
- `--ps-shadow-sm: 0 1px 2px rgba(0,0,0,0.05)` — cards only
- `--ps-shadow-md: 0 4px 6px rgba(0,0,0,0.07)` — dropdowns, modals
- **No shadow on stat counters, badges, inline elements**

#### 6. Component Patterns
- **Cards**: white bg, `--ps-shadow-sm`, `--ps-radius-md`, no decorative borders
- **Buttons**: primary solid, secondary outline, consistent 8px padding
- **Inputs**: 1px `#d1d5db` border, `--ps-radius-sm`, 8px horizontal padding
- **Badges**: tinted background + colored text (NOT solid fills)
- **Tables**: zebra stripes via `:nth-child`, no vertical borders

#### 7. Interactive States
- **Hover**: buttons darken 10%, cards no hover effect (they're not clickable)
- **Focus**: `outline: 2px solid var(--ps-primary); outline-offset: 2px` on `:focus-visible`
- **Loading**: skeleton shimmer (table row placeholders)
- **Empty**: text + "Reset filters" link, no illustrations
- **Error**: `role="alert"`, red-tinted background, retry button

#### 8. Anti-AI-Slop Guards
- NO gradients (linear, radial, or otherwise)
- NO 2-column comparison blocks
- NO heavy decorative borders on cards (1px max, subtle)
- NO colored left-border stat cards
- NO giant illustrations in empty states
- NO default shadcn/zinc palette
- All spacing strictly 8px multiples
- Badges use tinted backgrounds, not solid fills

### Phase 2: CSS Implementation

**File**: `frontend/src/index.css` — add to existing file

```css
/* === Design Tokens === */
:root {
  --ps-primary: #1a56db;
  /* ... all tokens from DESIGN.md ... */
}

/* === Font === */
body { font-family: 'DM Sans', -apple-system, sans-serif; }

/* === Skeleton Animation === */
@keyframes ps-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.ps-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ps-shimmer 1.5s infinite;
  border-radius: var(--ps-radius-sm);
}

/* === Badge Tints === */
.ps-badge-enabled { background: var(--ps-badge-enabled-bg); color: var(--ps-badge-enabled-text); }
.ps-badge-testing { background: var(--ps-badge-testing-bg); color: var(--ps-badge-testing-text); }
.ps-badge-disabled { background: var(--ps-badge-disabled-bg); color: var(--ps-badge-disabled-text); }

/* === Focus Ring === */
*:focus-visible { outline: 2px solid var(--ps-primary); outline-offset: 2px; }

/* === Range Slider === */
input[type='range'] { /* cross-browser styling with vendor prefixes */ }
```

**File**: `frontend/public/index.html` — add Google Fonts `<link>`

### Phase 3: Feature Dashboard (Mandatory)

**Strategy**: Rename `FeaturesListScreen.js` → `FeatureDashboardScreen.js`, then rewrite.

#### Route Changes (2 files)
- `App.js`: `/admin/featureslist` → `/admin/featuredashboard`, import name change
- `Header.js`: link → `/admin/featuredashboard`, label "Feature Dashboard"

#### Layout — ENHANCED TABLE (not cards)

```
┌─────────────────────────────────────────────────┐
│  Feature Dashboard                    [Refresh] │
│  Enabled: 5  Testing: 7  Disabled: 10           │  ← compact inline stats (no cards)
├─────────────────────────────────────────────────┤
│  [🔍 Search features...]                        │
│  [All] [Enabled] [Testing] [Disabled]           │  ← ButtonGroup filter
├─────────────────────────────────────────────────┤
│  Name          Status      Traffic   Modified   │
│  ─────────────────────────────────────────────  │
│  search_v2     [▼ Testing] ═══●══ 15%  Mar 10  │  ← dropdown + slider per row
│  semantic...   [▼ Testing] ═══●══ 25%  May 03  │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  No features match filters. [Reset]             │  ← empty state
└─────────────────────────────────────────────────┘
```

#### Components per row:
1. **Name column**: `<code>feature.key</code>` + small muted label
2. **Status column**: `<Form.Control as="select" size="sm">` with 3 options — updates badge class on change
3. **Traffic column**: `<input type="range" min="0" max="100">` with `{value}%` label
4. **Modified column**: date text
5. **Dependencies column**: tinted badge chips

#### States:
- **Loading**: 6 skeleton rows (`<tr>` with `<td>` containing `.ps-skeleton` divs)
- **Empty**: single `<tr>` colspan, text "No features match" + reset link
- **Error**: `<Alert variant="danger">` with retry button, `role="alert"`

#### Accessibility (from A11y audit):
- Search input: `aria-label="Search features by name"`
- Filter ButtonGroup: `role="group"` + `aria-label="Filter by status"`, each button `aria-pressed`
- Status dropdown: native `<select>` is accessible by default (keyboard, screen reader)
- Traffic slider: `aria-label="Traffic percentage for {name}"`, `aria-valuetext="{n} percent"`
- Results region: `aria-live="polite"` announcer for filter result count
- Error alert: `role="alert"` (react-bootstrap Alert provides this)
- Refresh button: `aria-label="Refresh feature list"`

### Phase 4: Redesign Other Screens (Budget-Dependent)

**Minimum**: 3-5 high-traffic public screens. Apply CSS tokens (colors, spacing, radius, shadows).

| Priority | Screen | Key Changes |
|----------|--------|-------------|
| 1 | HomeScreen | Product grid spacing (8px), card shadows, typography |
| 2 | LoginScreen | Centered form card, consistent input styles |
| 3 | RegisterScreen | Same treatment as Login |
| 4 | ProductScreen | Detail layout, review section badges |
| 5 | CartScreen | Summary card, item layout |
| 6+ | Remaining | If token budget allows |

Changes per screen are lightweight: replace hardcoded colors with vars, adjust spacing to 8px grid, add consistent border-radius and shadow to cards.

### Phase 5: Integration

1. **AGENTS.md** — append: `## Design rules: see ./DESIGN.md`
2. **homework/M4/README.md** — report with:
   - List of redesigned screens (checkmarks)
   - Tools used
   - Component decisions
   - Checklist
3. Verify `npm run build --prefix frontend` passes

---

## Final File List (~10 core files)

| # | File | Action | Size |
|---|------|--------|------|
| 1 | `DESIGN.md` | CREATE | L |
| 2 | `AGENTS.md` | MODIFY (1 line) | S |
| 3 | `frontend/public/index.html` | MODIFY (1 line: font link) | S |
| 4 | `frontend/src/index.css` | MODIFY (add ~100 lines tokens + components) | M |
| 5 | `frontend/src/App.js` | MODIFY (route + import rename) | S |
| 6 | `frontend/src/components/Header.js` | MODIFY (link + label) | S |
| 7 | `frontend/src/screens/FeatureDashboardScreen.js` | CREATE (renamed + rewritten) | L |
| 8 | `frontend/src/screens/HomeScreen.js` | MODIFY (design tokens) | M |
| 9 | `frontend/src/screens/LoginScreen.js` | MODIFY (design tokens) | S |
| 10 | `frontend/src/screens/RegisterScreen.js` | MODIFY (design tokens) | S |
| 11 | `frontend/src/screens/ProductScreen.js` | MODIFY (design tokens) | M |
| 12 | `frontend/src/screens/CartScreen.js` | MODIFY (design tokens) | M |
| 13 | `frontend/src/components/Product.js` | MODIFY (card styling) | S |
| 14 | `frontend/src/components/Loader.js` | MODIFY (skeleton) | S |
| 15 | `homework/M4/README.md` | CREATE | S |

---

## Key Technical Decisions (from brainstorm)

### Why TABLE not cards?
- 22 features → cards = massive vertical scroll
- Admins need to **scan** status quickly across many items
- Table allows columnar comparison (all statuses in one column)
- Already have a working table — restyle, don't rebuild

### Why dropdown SELECT not toggle switch?
- `Form.Check type="switch"` is **binary only** (on/off)
- Assignment says 3 states: Disabled / Testing / Enabled
- `<select>` is natively accessible (keyboard, screen reader, no ARIA needed)
- Simplest implementation: `<Form.Control as="select" size="sm">`
- Badge color updates on `onChange` handler

### Why DM Sans not Source Sans Pro?
- DM Sans: geometric, modern, excellent for data UIs
- Source Sans Pro: solid but slightly dated feel
- Both are free, both are NOT Inter
- Single font (4 weights: 400/500/600/700), ~25KB

### Why inline stats not stat cards?
- Stat cards with colored borders = most overused AI dashboard pattern
- Inline counters (`Enabled: 5 · Testing: 7 · Disabled: 10`) convey same info
- Less visual noise, more space for the actual data table
- Avoids anti-slop checklist failure

### Why tinted badges not solid?
- Solid colored badges (green/blue/gray) = default Bootstrap, looks generic
- Tinted: `background: rgba(color, 0.1); color: darkerShade` — subtler, more professional
- Passes contrast requirements (dark text on light tint)

---

## Checklist (Pre-PR)

### Feature Dashboard (обязательно)
- [ ] Route `/admin/featuredashboard`, isAdmin check, admin-dropdown link
- [ ] Feature list from features.json displayed
- [ ] Status badges: Enabled green / Testing blue / Disabled gray (tinted)
- [ ] Status dropdown changes badge color on select
- [ ] Slider 0-100 updates traffic_percentage display
- [ ] Search by name works
- [ ] Status filter (ButtonGroup) works
- [ ] Loading skeleton (6 table rows), Empty state (text + reset), Error state (alert + retry)
- [ ] ARIA: labels on search, filter, slider, refresh; aria-live for results; role=alert on error

### Redesign (минимум 1 помимо Dashboard)
- [ ] HomeScreen redesigned with design tokens
- [ ] LoginScreen / RegisterScreen redesigned
- [ ] README lists all redesigned screens

### DESIGN.md
- [ ] In repo root
- [ ] 7+ sections
- [ ] Font: DM Sans (not Inter)
- [ ] Spacing: only multiples of 8
- [ ] Anti-AI-slop guards section
- [ ] AGENTS.md references DESIGN.md

### Anti-AI-Slop Audit
- [ ] No gradients
- [ ] No 2-column comparison blocks
- [ ] No heavy borders / colored left-border cards
- [ ] Hover state on buttons
- [ ] Focus-visible ring on keyboard navigation
- [ ] Loading = skeleton rows, not spinner
- [ ] All spacing multiples of 8
- [ ] Badges: tinted, not solid Bootstrap defaults
