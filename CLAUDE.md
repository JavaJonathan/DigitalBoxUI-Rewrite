# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

The DigitalBox web UI — a rewrite of the old Create React App `digital-box`
(`C:\Users\jonat\Documents\JSProjects\DigitalBoxUI`). It is the warehouse-staff interface for
uploading packing-slip PDFs and working the order queue (ship / cancel / search / history).
Backend is a separate repo (`DigitalBoxApi`). Stack and conventions mirror the
**Henderson Software Labs** UI (`C:\Users\jonat\Documents\HendersonSoftwareLabs\HendersonSoftwareLabsUI`).

## Commands

```bash
npm run dev       # Vite dev server, http://localhost:5173 (strictPort — must match the API's CORS origin)
npm run build     # tsc -b && vite build  — this is the real typecheck, NOT `tsc --noEmit`
npm run lint      # oxlint
npm run preview
```

No automated test suite.

**Local prerequisite**: `.env.local` (gitignored) with `VITE_API_BASE_URL=http://localhost:5180`.

### Gotcha: typecheck with `npm run build`, not `tsc --noEmit`

Solution-style root `tsconfig.json` (`references` only). Plain `tsc --noEmit` compiles nothing
and reports success even with real errors. `npm run build` runs `tsc -b`, which actually checks.

## Architecture

**Stack**: Vite + React 19 + TypeScript, MUI v9 + Emotion (**not** Tailwind),
`react-router-dom` v7, self-hosted fonts (`@fontsource-variable/inter`, `@fontsource/geist-mono`).
No Redux — the old four-slice store mostly cached one response shape; server data now lives in
small hooks (`hooks/useOrders.ts`) around `apiFetch`, UI state in `useState`.

### Design system (`src/theme.ts`)

Full redesign, 2026 — target aesthetic is Linear / Vercel / Stripe dashboard: flat surfaces,
1px borders, tight type, one blue accent, **real dark mode**, no gradients/glass/hover-lift.

- **cssVariables mode** (`cssVariables: { colorSchemeSelector: 'class' }` + `colorSchemes.light/dark`).
  A pre-paint inline script in `index.html` sets `.light`/`.dark` on `<html>` from the
  `mui-mode` localStorage key (no flash). `ColorModeToggle` cycles light→dark→system via
  `useColorScheme()`.
- **CRITICAL**: inside `sx`/`styleOverrides` callbacks, read palette as `(theme.vars ?? theme).palette.X`,
  **never** `theme.palette.X` directly. In cssVariables mode `theme.vars.palette.X` returns the
  `var(--mui-palette-X)` reference (which flips light/dark); `theme.palette.X` returns a frozen
  light hex, so dark mode silently breaks. `sx` **string shorthands** (`bgcolor: 'surface.panel'`,
  `color: 'text.secondary'`) resolve to vars correctly — prefer them.
- Custom palette node **`surface`** (`canvas / panel / sunken / inset / border / borderStrong / hover`)
  augmented onto `Palette` + `PaletteOptions` at the bottom of `theme.ts`. MUI auto-generates
  `--mui-palette-surface-*` vars for it.
- Fonts: Inter Variable for UI, Geist Mono for order numbers / SKUs / IDs (`.db-mono` class or
  the `<Mono>` component, which also does click-to-copy).
- Shadow tokens: `var(--db-shadow-sm | -md | -lg)` (defined in `MuiCssBaseline`, light + dark).
- Motion: two opt-in classes in `index.css` — `.db-fade-in` (page/panel entrance, **opacity
  only** — `<main>` carries it and also holds the `position: fixed` SelectionBar, so a
  `transform` there would re-anchor the fixed child) and `.db-row-in` (per-row; caller sets
  `style={{ animationDelay }}` for the stagger, capped at ~10 rows). A global
  `prefers-reduced-motion` block neutralises all of it. `AppShell` keys `<main>` by pathname
  so every route change replays `.db-fade-in`.
- Layout: `AppShell` content is **full-width** (viewport minus `px` gutters) — no centred
  max-width, an ops tool shouldn't waste pixels on a wide monitor. The `contentMax` prop can
  still cap a specific page. The sticky-header row uses the same width + gutters so the page
  title / header actions stay aligned with the table edges. `OrdersTable` uses
  `tableLayout: 'fixed'` + an explicit `<colgroup>`: every column except Order has a fixed
  px width; Order is a percentage (`48%` queue / `36%` history) so it grows with the viewport
  and long product titles get room; a small trailing spacer `<col>` (+ matching `aria-hidden`
  `<td>`s) keeps a little air on the right of very wide screens. `min()` in a `<col>` width is
  ignored under fixed layout (the browser treats it as `auto`) — use a plain `%`.
- `SelectionBar` is a full-width fixed strip that flex-centres its pill — do **not** try to
  centre the pill itself with `translateX(-50%)`, MUI's `<Slide>` writes an inline `transform`
  that overrides it (that bug parked the bar in the bottom-right corner).

**`src/api/client.ts`** — `apiFetch<T>` wrapper: injects the bearer token, throws `ApiError`
with the server's `{ message }`, and calls the registered unauthorized handler on `401`
(which `AuthContext` wires to `logout`). `apiFetch` sets `Content-Type: application/json`
unless `rawBody: true` (used for the multipart upload). `fetchPackingSlipObjectUrl` in
`api/orders.ts` exists because the packing-slip endpoint is auth-gated — a plain `<a href>`
can't send the token, so it fetches the PDF as a blob and returns an object URL the caller
must revoke.

**Auth** (`src/auth/`): `AuthContext` stores the JWT in `localStorage` under `digitalbox_token`,
exposes `{ user, loading, login, logout }`. `ProtectedRoute` redirects to `/login` (with a
`from` location) when not authenticated. There is one shared login and no roles.

**Routes** (`src/App.tsx`): `/login`, `/` (open-order queue), `/history` (shipped/cancelled
tabs), `/orders/:id` (detail + packing-slip viewer + correction form). Everything except
`/login` is inside `ProtectedRoute`.

**Key components**:
- `AppShell` — fixed left sidebar (≥900px) / `Drawer` (<900px) + sticky blurred topbar with
  page title + `actions` slot. Sidebar footer has the user chip, `ColorModeToggle`, sign-out.
- `Logo` / `LogoMark` — inline-SVG isometric-box monogram.
- `QueueToolbar` — debounced search (order # / item / **note**) + marketplace `ToggleButtonGroup`
  + a "Priority" toggle (`showPriority`). `onChange` emits `ToolbarState { q, marketplace, priority }`;
  the toggles fire immediately, the text field debounces.
- `OrdersTable` — one table for queue and history. Optional callbacks: `onTogglePriority` (flag
  cell, queue only), `onEditNote` (note icon → opens a popover), `onUndoRow` (per-row Reopen,
  history only). Hover-reveal elements use the `.db-row-hover` class. Has `minWidth` so it
  scrolls horizontally instead of squishing on narrow screens.
- `SelectionBar` — floating pill; generalized to `{ count, onClear, children }` — each page passes
  its own action buttons (queue: Ship/Cancel; history: Reopen).
- `NotePopover` — anchored multiline note editor (500-char cap, Cmd/Ctrl+Enter saves).
- `UploadDialog` — drag-drop multi-PDF; per-file created/duplicate/error result list.
- `ShippableItemsDialog` — drop inventory CSV → map columns (auto-detected client-side via
  `lib/csv.ts`) → preview table → Download CSV (built client-side, BOM + CRLF).
- `ConfirmActionDialog` — `intent: 'ship' | 'cancel' | 'undo'`, 3-way copy config; requires
  operator name → `actionedBy`.
- `ToastProvider` / `useToast` — MUI Snackbar (bottom-right, slide-up); severity passed
  explicitly, never string-matched (the old app's fragile pattern).
- `ui/` primitives: `Mono`, `MarketplaceTag`, `StatusBadge` (`OrderStatusBadge` / `ParseStatusBadge`),
  `RelativeTime`, `EmptyState`, `TableSkeleton`, `EventTimeline`.

Marketplace accent colours: `MARKETPLACE_COLORS` in `theme.ts` (Amazon orange, eBay red,
Walmart blue, Shopify green) — used only as small dots, never as fills.

## Deployment (mirror Henderson — not yet wired)

`amplify.yml` is in place. Target: AWS Amplify connected to `master`, auto-build/deploy.
`VITE_API_BASE_URL` is set as an Amplify branch env var pointing at the deployed API.

## Gotchas

- MUI **v9** `Stack` no longer accepts `alignItems` / `justifyContent` as props — use `sx`.
- MUI **v9** `Checkbox` — `inputProps` was removed; use `slotProps={{ input: {...} }}`.
- `theme.palette.X` vs `theme.vars.palette.X` in cssVariables mode — see "Design system" above.
  If dark mode looks half-broken (light cards on a dark page), this is why.
- MUI icon names differ by version; verify before importing a new one
  (`ls node_modules/@mui/icons-material | grep -i <name>`). `DeleteOutline` doesn't exist; it's `DeleteOutlined`.
- After adding/removing npm packages while `npm run dev` is running, kill it, delete
  `node_modules/.vite`, and restart, or you'll see phantom "Invalid hook call" errors.
- The Claude Code browser-preview pane here is ~406 CSS px and scales larger emulated
  viewports down to an unreadable thumbnail — verify desktop layout via DOM measurements
  (`javascript_tool`), not screenshots.
