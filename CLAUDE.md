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
npm run dev          # Vite dev server, http://localhost:5173 (strictPort — must match the API's CORS origin)
npm run build        # tsc -b && vite build  — this is the real typecheck, NOT `tsc --noEmit`
npm run lint         # oxlint  (currently 8 warnings, all known/accepted — don't let the count grow)
npm run format       # prettier --write .   (format:check for CI)
npm run preview
```

No automated test suite. Verification = `npm run build` + `npm run lint` + a manual browser pass.

**Local prerequisite**: `.env.local` (gitignored) with `VITE_API_BASE_URL=http://localhost:5180`.

### Gotcha: typecheck with `npm run build`, not `tsc --noEmit`

Solution-style root `tsconfig.json` (`references` only). Plain `tsc --noEmit` compiles nothing
and reports success even with real errors. `npm run build` runs `tsc -b`, which actually checks.

## Architecture

**Stack**: Vite + React 19 + TypeScript, MUI v9 + Emotion (**not** Tailwind),
`react-router-dom` v7, self-hosted fonts (`@fontsource-variable/inter`, `@fontsource/geist-mono`).
No Redux — the old four-slice store mostly cached one response shape; server data now lives in
small hooks (`hooks/useOrders.ts`) around `apiFetch`, UI state in `useState`. Prettier
(`.prettierrc.json`) formats everything: `npm run format` / `format:check`.

**Conventions**: local functions use bare imperative verbs (`save`, `load`, `submit`,
`upload`, `close`); the `on…` / `handle…` prefix is reserved for props that are event
handlers passed to children. Shared magic values live in `src/lib/constants.ts`. The
reopen-a-shipped/cancelled-order operation is called **`reopen`** everywhere in the UI (the
API function is `undoOrders`, hitting `POST /api/orders/undo` — that name mirrors the route).

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
- Spacing base is **4px** (`theme.spacing = 4`), radius base **8px** (`shape.borderRadius = 8`) —
  so sx `p: 3` = 12px, `borderRadius: 3` = 24px, `borderRadius: 1.5` = 12px. Use multipliers for
  padding / margin / gap / borderRadius; raw px numbers only for fixed dimensions (`height`,
  `width`, `fontSize`).
- Motion: two opt-in classes in `index.css` — `.db-fade-in` (page/panel entrance, **opacity
  only** — `<main>` carries it and also holds the `position: fixed` SelectionBar, so a
  `transform` there would re-anchor the fixed child) and `.db-row-in` (per-row; caller sets
  `style={{ animationDelay }}` for the stagger, capped at ~10 rows). A global
  `prefers-reduced-motion` block neutralises all of it. `AppShell` keys `<main>` by pathname
  so every route change replays `.db-fade-in`.
- Layout: `AppShell` content is **full-width** (viewport minus `px` gutters) — no centred
  max-width, an ops tool shouldn't waste pixels on a wide monitor. The sticky-header row uses
  the same width + gutters so the page title / header actions stay aligned with the table
  edges. `OrdersTable` uses
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
exposes `{ user, loading, login, logout }` where `user` is `{ id, username, displayName, role }`
(`role` is `'User' | 'Admin'`). `ProtectedRoute` redirects to `/login` (with a `from` location)
when not authenticated; pass `requireRole="Admin"` to bounce non-admins to `/`. Per-user
accounts, admin-managed — there is no sign-up or self-service password reset in the UI.

**Routes** (`src/App.tsx`): `/login`, `/` (open-order queue), `/history` (shipped/cancelled
tabs), `/orders/:id` (detail + packing-slip viewer + correction form), `/users` (admin-only —
`UsersPage`: add users, reset passwords shown once, activate/deactivate, rename). Everything
except `/login` is inside `ProtectedRoute`. The **Users** nav item (`AppShell` `ADMIN_NAV`)
only renders for admins. Ship/cancel/reopen no longer collect a name — the actor is the
signed-in user (`ConfirmActionDialog` has no fields).

**Key components**:
- `AppShell` — fixed left sidebar (`SIDEBAR_WIDTH` = 260, exported from `lib/layout.ts` and
  reused by `SelectionBar` + the toast so they stay aligned) at ≥900px / `Drawer` (<900px),
  plus a 64px sticky blurred topbar (page title + `actions` slot). Sidebar body split into
  `components/app-shell/`: `SidebarNavItem` (the 46px nav row — icon tile + animated `::before`
  accent bar, active state primary-tinted via one `tint()` helper) and `SidebarFooter` (avatar
  card + `ColorModeToggle` + sign-out). Content is full-width with `{ xs: 3, sm: 4, lg: 6 }` gutters.
- `Logo` / `LogoMark` — inline-SVG isometric-box monogram.
- `QueueToolbar` — a tall (44px) search field that grows to fill the row (with a `/` kbd hint
  and a global `/`-to-focus / `Esc`-to-clear handler) + a right-aligned filter cluster:
  marketplace `ToggleButtonGroup` and a "Priority" toggle (`showPriority`), both 40px. When
  neither filter is shown (history) the cluster is omitted and the search runs full-width.
  `onChange` emits `ToolbarState { q, marketplace, priority }`; the toggles fire immediately,
  the text field debounces.
- `OrdersTable` — one table for queue and history (`status` picks which). Just the container +
  header + `.map` shell now; each row is `orders-table/OrdersTableRow` (with `OrderPrimaryCell`
  / `NotesCell` local to it), and the `<colgroup>` widths + coupled `minWidth` live in
  `orders-table/orderColumns.ts`. Callbacks: `onTogglePriority` (flag cell, queue only),
  `onEditNote` (queue **Notes** column — click to open the popover; empty cells hover-reveal an
  add icon), `onReopenRow` (per-row Reopen, history only). Hover-reveal elements use
  `.db-row-hover`. Parse status is **not a column** — a non-`Parsed` order shows a warning/error
  icon next to its number (tooltip from `PARSE_STATUS_HINTS`); history rows show a note-present
  icon there instead.
- `OrderDetailPage` is a thin shell over `components/order-detail/`: `OrderInfoPanel` (read
  view), `OrderEditForm` (correction form, owns its edit state — mount `key={order.id}`),
  `OrderNoteCard`, `PackingSlipPanel` (owns the blob-URL effect).
- `SelectionBar` — floating pill, bottom-centre over the content, deliberately **loud**
  (large `size="large"` buttons, 28px count badge, a `color-mix` primary ring + `--db-shadow-lg`,
  back-out slide-up). Generalized to `{ count, onClear, children }` — each page passes its own
  action buttons (queue: Ship/Cancel; history: Reopen). This and the toast are the two
  intentional exceptions to the quiet-UI rule: a warehouse operator must not miss them.
- `NotePopover` — anchored popover around the shared `ui/NoteEditor` (Cmd/Ctrl+Enter saves).
- `UploadDialog` / `ShippableItemsDialog` — both use the shared `ui/FileDropzone` for the
  drag-drop area. ShippableItems: drop CSV → map columns (auto-detected via `lib/csv.ts`) →
  preview → Download CSV (client-side, BOM + CRLF).
- `ConfirmActionDialog` — `intent: 'ship' | 'cancel' | 'reopen'`, 3-way copy config; `onConfirm`
  takes no args (the acting user comes from the JWT server-side).
- `ToastProvider` / `useToast` — MUI Snackbar, **top-centre over the content**, a big solid
  `palette[severity].main` bar (28px icon, 16px/600 text, `contrastText`), slide-down with a
  back-out easing; errors linger (9s) longer than success (4.5s). Severity is passed explicitly,
  never string-matched (the old app's fragile pattern). Not an MUI `<Alert>` — a plain styled
  `Box`, because the theme's `MuiAlert` root forces `surface.panel` bg and would kill the fill.
- `ui/` primitives: `Mono`, `MarketplaceTag`, `StatusBadge` (`OrderStatusBadge` / `ParseStatusBadge`),
  `RelativeTime`, `EmptyState`, `TableSkeleton`, `EventTimeline`, `Kbd`, `FileDropzone`,
  `NoteEditor`, `PriorityToggle`.

Marketplace accent colours: `MARKETPLACE_COLORS` in `theme.ts` (Amazon orange, eBay red,
Walmart blue, Shopify green) — used only as small dots, never as fills.

## Security

The JWT lives in `localStorage` (`digitalbox_token`), so **any XSS is full account takeover** —
token theft, not just a defaced page. Keep the discipline that makes that hard:

- **Never `dangerouslySetInnerHTML`**, and never build DOM / URLs by string-concatenating
  server data (order numbers, product titles, notes, filenames, display names). Render values
  as JSX text and let React escape them.
- **Packing-slip PDFs**: keep loading them as an auth-fetched `blob:` object URL in an
  `<iframe>`/`<embed>` (`fetchPackingSlipObjectUrl`). Don't switch to a raw cross-origin `<a>`
  or `window.open` on the API URL, and don't render slip/order text as HTML.
- **`VITE_API_BASE_URL` must be `https://` in every deployed environment.** The bearer token
  rides every request.
- **Trust the server's `role` for data, the UI's role checks for convenience only.** `ADMIN_NAV`
  hiding and `ProtectedRoute requireRole` are UX, not a security boundary — the API enforces
  `[Authorize(Roles=Admin)]` and that's what actually matters.
- **No new runtime dependency without a look at what it does** — a compromised or sloppy
  package runs with the token in scope. This also keeps the bundle lean (see Cost awareness).
- Surface the API's `{ message }` in toasts as **text** (the `ApiError` path already does this) —
  never inject an error string as markup.

## Deployment (mirror Henderson — not yet wired)

`amplify.yml` is in place. Target: AWS Amplify connected to `master`, auto-build/deploy.
`VITE_API_BASE_URL` is set as an Amplify branch env var pointing at the deployed API.
Security headers (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS) belong in
`amplify.yml` under `customHeaders` — not wired yet.

## Cost awareness (AWS)

Amplify bills build minutes, hosting storage, and data transfer out. The UI is cheap and
should stay that way — this isn't about cutting features, just not shipping weight we don't
need:

- **Keep the dependency list lean.** Adding a runtime dep grows every user's bundle and the
  transfer bill. Before reaching for a library, check whether MUI / React / the standard lib
  already covers it. Heavy date/utility/animation libs especially — we deliberately don't
  have them.
- **Import narrowly.** `@mui/icons-material/SpecificIcon`, never `{ SpecificIcon } from
  '@mui/icons-material'`. Same for any package with deep entry points.
- **Fonts are already subset-aware** (`@fontsource*` files carry `unicode-range`, so browsers
  fetch only the Latin slice). Don't add font weights or families casually — each is another
  always-loaded asset.
- **No new build steps or codegen** in `amplify.yml` unless a feature needs it — build
  minutes are metered.
- Server data lives in small hooks around `apiFetch`, not a client-side store or cache
  layer — keep it that way; it's less code and less bundle.

## Gotchas

- MUI **v9** `Stack` no longer accepts `alignItems` / `justifyContent` as props — use `sx`.
- MUI **v9** `Checkbox` — `inputProps` was removed; use `slotProps={{ input: {...} }}`.
- `theme.palette.X` vs `theme.vars.palette.X` in cssVariables mode — see "Design system" above.
  If dark mode looks half-broken (light cards on a dark page), this is why.
- MUI icon names differ by version; verify before importing a new one
  (`ls node_modules/@mui/icons-material | grep -i <name>`). `DeleteOutline` doesn't exist; it's `DeleteOutlined`.
- After adding/removing npm packages while `npm run dev` is running, kill it, delete
  `node_modules/.vite`, and restart, or you'll see phantom "Invalid hook call" errors. HMR also
  wedges after a burst of edits — the console shows stale `ReferenceError`s for names you just
  removed; a dev-server restart clears it (the build itself stays clean).
- oxlint honours `// eslint-disable-next-line react-hooks/exhaustive-deps` (in `useOrders.ts` and
  `QueueToolbar.tsx`) and it suppresses more than just that rule for the effect — **do not
  remove those comments**, the warning count jumps if you do.
- `oxlint` has only `react/rules-of-hooks` + `react/only-export-components` explicitly configured
  but runs its default correctness set (that's where `set-state-in-effect` comes from).
- The Claude Code browser-preview pane here is ~406 CSS px and scales larger emulated
  viewports down to an unreadable thumbnail — verify desktop layout via DOM measurements
  (`javascript_tool`), not screenshots.
