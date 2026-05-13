# ProShop Design System

> Single source of truth for the visual language of ProShop MERN.
> All UI work must follow these tokens and patterns.

---

## 1. Color Palette

Semantic CSS custom properties with `--ps-` prefix. Applied via `:root` in `frontend/src/index.css`.

### Core Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--ps-primary` | `#1a56db` | Primary actions, links, active states |
| `--ps-primary-hover` | `#1648b8` | Primary button hover |
| `--ps-success` | `#047857` | Enabled status, positive feedback |
| `--ps-info` | `#2563eb` | Testing status, informational |
| `--ps-muted` | `#6b7280` | Disabled status, secondary text |
| `--ps-danger` | `#dc2626` | Errors, destructive actions |
| `--ps-warning` | `#d97706` | Warnings, caution states |

### Surfaces & Text

| Token | Value | Usage |
|-------|-------|-------|
| `--ps-bg` | `#f8fafc` | Page background |
| `--ps-surface` | `#ffffff` | Cards, panels, inputs |
| `--ps-text` | `#111827` | Primary text |
| `--ps-text-muted` | `#6b7280` | Secondary text, captions |
| `--ps-border` | `#e5e7eb` | Subtle borders |

### Badge Tints (subtle background + colored text)

| Status | Background | Text |
|--------|-----------|------|
| Enabled | `rgba(4, 120, 87, 0.1)` | `#047857` |
| Testing | `rgba(37, 99, 235, 0.1)` | `#1d4ed8` |
| Disabled | `rgba(107, 114, 128, 0.1)` | `#4b5563` |

**Contrast notes**: All text colors pass WCAG AA (>=4.5:1) on their respective tint backgrounds and on white.

---

## 2. Typography

**Font**: [DM Sans](https://fonts.google.com/specimen/DM+Sans) — geometric sans-serif, modern, excellent for data-heavy interfaces. **Not Inter** — DM Sans has slightly rounder terminals and better optical balance at small sizes in tables.

**Loading**: `<link>` in `public/index.html` with `display=swap` to prevent FOIT.

**Weights**: 400 (body), 500 (labels), 600 (headings), 700 (emphasis)

**Scale**:

| Token | Size | Usage |
|-------|------|-------|
| `--ps-text-xs` | `14px` | Captions, badges, help text |
| `--ps-text-sm` | `16px` | Body text (base) |
| `--ps-text-md` | `18px` | Section subheadings |
| `--ps-text-lg` | `20px` | Card titles |
| `--ps-text-xl` | `24px` | Page section titles |
| `--ps-text-2xl` | `32px` | Page headings (h1) |

**Line height**: 1.5 for body, 1.2 for headings.

---

## 3. Spacing Scale

**Rule: ALL spacing (margin, padding, gap) must be a multiple of 8.**

| Token | Value |
|-------|-------|
| `--ps-space-0` | `0` |
| `--ps-space-1` | `8px` |
| `--ps-space-2` | `16px` |
| `--ps-space-3` | `24px` |
| `--ps-space-4` | `32px` |
| `--ps-space-5` | `40px` |
| `--ps-space-6` | `48px` |
| `--ps-space-7` | `56px` |
| `--ps-space-8` | `64px` |

No 4px values. No 12px values. If something "needs 4px", use 0 or 8.

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--ps-radius-sm` | `4px` | Buttons, badges, inputs |
| `--ps-radius-md` | `8px` | Cards, dropdowns |
| `--ps-radius-lg` | `12px` | Modals, large containers |
| `--ps-radius-pill` | `9999px` | Pills, tags |

Note: radius values are not spacing — they follow their own scale.

---

## 5. Elevation / Shadows

Minimal shadows. Only on containers that float above the page surface.

| Token | Value | Usage |
|-------|-------|-------|
| `--ps-shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, table wrappers |
| `--ps-shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Dropdowns, popovers |
| `--ps-shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals |

**Rules**:
- No shadow on stat counters, badges, or inline elements.
- No shadow on table rows.
- Shadow on the card/panel wrapping a table is OK.

---

## 6. Component Patterns

### Cards
- Background: `--ps-surface`
- Border: `1px solid var(--ps-border)` — subtle, not heavy
- Radius: `--ps-radius-md`
- Shadow: `--ps-shadow-sm`
- Padding: `--ps-space-3` (24px)
- **No** colored left/top borders. No decorative borders.

### Buttons
- Primary: `background: var(--ps-primary); color: white`
- Hover: `background: var(--ps-primary-hover)`
- Focus: `outline: 2px solid var(--ps-primary); outline-offset: 2px`
- Padding: `8px 16px`
- Radius: `--ps-radius-sm`
- Secondary: `border: 1px solid var(--ps-border); background: transparent`

### Inputs
- Border: `1px solid var(--ps-border)`
- Radius: `--ps-radius-sm`
- Padding: `8px 16px`
- Focus: `border-color: var(--ps-primary); box-shadow: 0 0 0 2px rgba(26, 86, 219, 0.15)`

### Badges (Status)
- Use tinted backgrounds, NOT solid fills
- Enabled: `background: rgba(4,120,87,0.1); color: #047857`
- Testing: `background: rgba(37,99,235,0.1); color: #1d4ed8`
- Disabled: `background: rgba(107,114,128,0.1); color: #4b5563`
- Padding: `0 8px`, line-height: 24px
- Radius: `--ps-radius-pill`
- Font-weight: 500
- Font-size: 14px

### Tables
- Zebra stripes via `tr:nth-child(even) { background: var(--ps-bg) }`
- No vertical borders between cells
- Header: `font-weight: 600; color: var(--ps-text-muted); text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em`
- Cell padding: `--ps-space-2` vertical, `--ps-space-2` horizontal

---

## 7. Interactive States

### Hover
- Buttons: darken background 10%
- Links: underline
- Table rows: `background: rgba(26, 86, 219, 0.03)` (very subtle)
- Cards: no hover effect (cards are not clickable containers in this app)

### Focus (`:focus-visible`)
- All interactive elements: `outline: 2px solid var(--ps-primary); outline-offset: 2px`
- Do NOT use `box-shadow` for focus — use `outline` for consistency and accessibility

### Loading
- **Skeleton rows**, not spinners
- Animation: shimmer gradient moving left to right
- `background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`
- `animation: ps-shimmer 1.5s infinite`
- Show 6 placeholder rows matching the real table layout
- Skeleton replaces real content 1:1 in shape

### Empty State
- Simple centered text: "No items match your filters"
- Optional: "Reset filters" link below
- **No** giant illustrations, icons, or decorative elements
- Color: `var(--ps-text-muted)`

### Error State
- Red-tinted alert box: `background: rgba(220,38,38,0.05); border: 1px solid rgba(220,38,38,0.2)`
- `role="alert"` for screen readers
- Error message + "Try again" button
- **No** generic "Something went wrong" with rocket/astronaut illustration

---

## 8. Anti-AI-Slop Guards

These rules exist specifically to prevent generic AI-generated "designed" output.

### Forbidden Patterns
1. **No gradients** — no `linear-gradient` for decorative purposes (functional shimmer animation is OK)
2. **No 2-column comparison blocks** ("Before vs After", "Free vs Pro")
3. **No heavy borders** on cards — max 1px, color `--ps-border` only
4. **No colored left/top border on stat cards** — this is the #1 AI dashboard cliche
5. **No giant empty-state illustrations** (astronaut, rocket, magnifying glass)
6. **No default shadcn slate/zinc palette** — we use our own tokens
7. **No decorative icons on every heading**

### Required Patterns
1. **Hover state on all buttons** — must visually change
2. **Focus ring on keyboard navigation** — `outline`, not `box-shadow`
3. **Loading = skeleton rows**, never just a centered spinner
4. **All spacing multiples of 8** — enforced in code review
5. **Badges use tinted backgrounds** — never solid Bootstrap fills
6. **Typography uses DM Sans** — never falls back to system font without reason
7. **Shadows are minimal** — only on card containers, not on inline elements

### UX-First Rules
1. Admin data tables use **table layout**, not card grids (scanability > aesthetics)
2. Status controls use **native form elements** (select, radio) for accessibility
3. Empty states are **text-only** with actionable links
4. Error states include a **retry action**, not just a message
