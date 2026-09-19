# AGENTS.md

Guidance for AI coding agents working in this repository (Claude Code, Cursor, Codex CLI,
and similar). Claude Code loads this file automatically via `CLAUDE.md`'s `@AGENTS.md`
import; other tools read it directly.

## What this is

The DigitalBox web UI: a rewrite of the old Create React App `digital-box`
(`C:\Users\jonat\Documents\JSProjects\DigitalBoxUI`). It is the warehouse-staff interface for
uploading packing-slip PDFs and working the order queue (ship / cancel / search / history).
Backend is a separate repo (`DigitalBoxApi`). Stack and conventions mirror the
**Henderson Software Labs** UI (`C:\Users\jonat\Documents\HendersonSoftwareLabs\HendersonSoftwareLabsUI`).

## Commands

```bash
npm run dev          # Vite dev server, http://localhost:5183 (strictPort, must match the API's CORS origin)
npm run build        # tsc -b && vite build; this is the real typecheck, NOT `tsc --noEmit`
npm run lint         # oxlint  (currently 8 warnings, all known/accepted; don't let the count grow)
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
No Redux: the old four-slice store mostly cached one response shape; server data now lives in
small hooks (`hooks/useOrders.ts`) around `apiFetch`, UI state in `useState`. Prettier
(`.prettierrc.json`) formats everything: `npm run format` / `format:check`.

**Conventions**: local functions use bare imperative verbs (`save`, `load`, `submit`,
`upload`, `close`); the `on…` / `handle…` prefix is reserved for props that are event
handlers passed to children. Shared magic values live in `src/lib/constants.ts`. The
reopen-a-shipped/cancelled-order operation is called **`reopen`** everywhere in the UI (the
API function is `undoOrders`, hitting `POST /api/orders/undo`; that name mirrors the route).

### Design system (`src/theme.ts`)

Full redesign, 2026. Target aesthetic is Linear / Vercel / Stripe dashboard: flat surfaces,
1px borders, tight type, one blue accent, **real dark mode**, no gradients/glass/hover-lift.

- **cssVariables mode** (`cssVariables: { colorSchemeSelector: 'class' }` + `colorSchemes.light/dark`).
  The external pre-paint `public/theme-init.js`, loaded by `index.html`, sets `.light`/`.dark` on `<html>` from the
  `mui-mode` localStorage key (no flash). `ColorModeToggle` cycles light→dark→system via
  `useColorScheme()`.
- **CRITICAL**: inside `sx`/`styleOverrides` callbacks, read palette as `(theme.vars ?? theme).palette.X`,
  **never** `theme.palette.X` directly. In cssVariables mode `theme.vars.palette.X` returns the
  `var(--mui-palette-X)` reference (which flips light/dark); `theme.palette.X` returns a frozen
  light hex, so dark mode silently breaks. `sx` **string shorthands** (`bgcolor: 'surface.panel'`,
  `color: 'text.secondary'`) resolve to vars correctly, so prefer them.
- Custom palette node **`surface`** (`canvas / panel / sunken / inset / border / borderStrong / hover`)
  augmented onto `Palette` + `PaletteOptions` at the bottom of `theme.ts`. MUI auto-generates
  `--mui-palette-surface-*` vars for it.
- Fonts: Inter Variable for UI, Geist Mono for order numbers / SKUs / IDs (`.db-mono` class or
  the `<Mono>` component, which also does click-to-copy).
- Shadow tokens: `var(--db-shadow-sm | -md | -lg)` (defined in `MuiCssBaseline`, light + dark).
- Spacing base is **4px** (`theme.spacing = 4`), so sx `p: 3` = 12px. Use multipliers for
  padding / margin / gap; raw px numbers only for fixed dimensions (`height`, `width`).
- **Radius scale** — four steps, as CSS vars next to the shadow tokens in `MuiCssBaseline`:

  | token | px | role |
  |---|---|---|
  | `--db-radius-sm` | 6 | chips, badges, menu items, skeletons |
  | `--db-radius-md` | 8 | buttons, inputs, icon buttons, toggles |
  | `--db-radius-lg` | 12 | **containers**: panels, cards, tables, dialogs, menus, toast |
  | `--db-radius-xl` | 16 | dropzones, empty-state tiles, the selection pill |

  In `sx` write `borderRadius: 'var(--db-radius-lg)'`, **not** a multiplier. `shape.borderRadius`
  is 8, so `borderRadius: 3` silently means 24px, not 3 — that trap is exactly how the app
  drifted to twelve different radii. `'50%'` for circles is still fine.
- **Icon scale** — three steps on MUI's own `fontSize` prop, via `MuiSvgIcon` overrides:
  `small` = 16 (button icons, dialog closes, most controls), `medium` = 20 (the default;
  sidebar nav, emphasis), `large` = 28 (empty states, dropzones, toast). Use the prop
  (`<Icon fontSize="small" />`), never `sx={{ fontSize: 16 }}`. A glyph sitting inline with
  text in a table row uses `fontSize="inherit"` so it tracks the cell. `MuiButton`'s
  `startIcon`/`endIcon` overrides already size button icons, so those call sites pass nothing.
- **Control height** — `CONTROL_HEIGHT` (40, exported from `theme.ts`) is the filter-row
  height: the queue search field and both toggle kinds share it so the toolbar reads as one
  band. Buttons keep their own 28/34/42 `size` scale.
- **Panels are `<Paper variant="outlined">`**, which the theme already gives a 1px
  `surface.border` + 12px radius + `surface.panel` background. There is deliberately **no**
  `<Panel>` primitive. `MuiTableContainer` carries the same chrome, so a table and a panel are
  the same object and a loading panel can't have different corners from the table replacing it.
- Motion: two opt-in classes in `index.css`. `.db-fade-in` (page/panel entrance, **opacity
  only**; `<main>` carries it and also holds the `position: fixed` SelectionBar, so a
  `transform` there would re-anchor the fixed child) and `.db-row-in` (per-row; caller sets
  `style={{ animationDelay }}` for the stagger, capped at ~10 rows). A global
  `prefers-reduced-motion` block neutralises all of it. `AppShell` keys `<main>` by pathname
  so every route change replays `.db-fade-in`.
- Layout: `AppShell` content is **full-width** (viewport minus `px` gutters); no centred
  max-width, an ops tool shouldn't waste pixels on a wide monitor. The sticky-header row uses
  the same width + gutters so the page title / header actions stay aligned with the table
  edges. `OrdersTable` uses
  `tableLayout: 'fixed'` + an explicit `<colgroup>`: Order is a percentage (`42%` queue /
  `36%` history), queue Notes uses `17%`, and the other data columns have fixed pixel widths.
  The percentage columns grow with the viewport
  and long product titles get room; a small trailing spacer `<col>` (+ matching `aria-hidden`
  `<td>`s) keeps a little air on the right of very wide screens. `min()` in a `<col>` width is
  ignored under fixed layout (the browser treats it as `auto`), so use a plain `%`.
- `SelectionBar` is a full-width fixed strip that flex-centres its pill; do **not** try to
  centre the pill itself with `translateX(-50%)`, MUI's `<Slide>` writes an inline `transform`
  that overrides it (that bug parked the bar in the bottom-right corner).

**`src/api/client.ts`** holds the `apiFetch<T>` wrapper: injects the bearer token, throws `ApiError`
with the server's `{ message }`, and calls the registered unauthorized handler on `401`
(which `AuthContext` wires to `logout`). `apiFetch` sets `Content-Type: application/json`
unless `rawBody: true` (used for the multipart upload). `fetchPackingSlipObjectUrl` in
`api/orders.ts` exists because the packing-slip endpoint is auth-gated, and a plain `<a href>`
can't send the token, so it fetches the PDF as a blob and returns an object URL the caller
must revoke.

API contracts are maintained manually: `src/types/index.ts` and `src/api/` mirror the backend's
`Models/` DTOs. There is no generated client. `useOrders` owns query-keyed loading, ignores
stale responses, and supports background refresh without replacing the table with a skeleton.
Pages own filters, pagination, and selection; effective selection is intersected with visible
rows. Keep `PAGE_SIZE_OPTIONS` at or below the backend bulk-action limit (currently 100).

**Auth** (`src/auth/`): `AuthContext` stores the JWT in `localStorage` under `digitalbox_token`,
exposes `{ user, loading, login, logout }` where `user` is `{ id, username, displayName, role }`
(`role` is `'User' | 'Admin'`). `ProtectedRoute` redirects to `/login` (with a `from` location)
when not authenticated; pass `requireRole="Admin"` to bounce non-admins to `/`. Per-user
accounts, admin-managed; there is no sign-up or self-service password reset in the UI.

**Routes** (`src/App.tsx`): `/login`, `/` (open-order queue), `/history` (shipped/cancelled
tabs), `/orders/:id` (detail + packing-slip viewer + correction form), `/users` (admin-only;
`UsersPage`: add users, reset passwords shown once, activate/deactivate, rename), `/lookup`
(admin-only; `LookupPage`: customer-service order lookup with DB status + in-stock/pre-order
badges + ShipStation tracking; `pages/`, `components/lookup/`, `api/lookup.ts`). Everything
except `/login` is inside `ProtectedRoute`; `/users` and `/lookup` add `requireRole="Admin"`,
which bounces a non-admin to `/`, indistinguishable from the `path="*"` catch-all, so those
routes read as non-existent (the API backs this: `/api/lookup/*` 404s for non-admins). The
**Users** and **Lookup** nav items (`AppShell` `ADMIN_NAV`) only render for admins.
Ship/cancel/reopen no longer collect a name; the actor is the signed-in user
(`ConfirmActionDialog` has no fields).

**Realtime** (`src/realtime/`): `RealtimeProvider`, inside `AuthProvider`, owns one SignalR
connection per mounted app to `/hub/activity`, starts after login, and stops on logout.
`activityConnection.ts` uses WebSockets with token authentication and automatic reconnect.
Presence drives the online roster; `ActivityFeed` displays coworker actions. Queue and history
subscribe through `useRealtimeEvent` and debounce `queueChanged` refreshes by
`QUEUE_SYNC_DEBOUNCE_MS` (1200ms). Events from the signed-in user are ignored by user ID,
including other tabs using that account. Order detail currently does not subscribe to these
refreshes. Mutations still use HTTP; realtime messages are best-effort refresh signals.

**Packing-slip saving** (`hooks/useSlipDelivery.ts`, `hooks/useSlipFolder.ts`,
`hooks/useDownloadSlipsOnShip.ts`, `lib/slipFolder.ts`): queue/history can save selected PDFs
through authenticated blob fetches. Supported browsers use a user-chosen File System Access
directory handle persisted in IndexedDB; otherwise, or without write permission, delivery
falls back to individual browser downloads. The queue's ship confirmation offers automatic
saving, enabled by default with the preference stored in localStorage. Filenames derive from
marketplace/order number and are deduplicated within the batch. Delivery reports its own
success/failure counts after the order action. Detail-page shipping currently has no automatic
saving, and queue shipping currently saves the pre-action selection without filtering API
`skippedIds`; account for these differences when changing that flow.

**Key components**:
- `AppShell`: fixed left sidebar (`SIDEBAR_WIDTH` = 260, exported from `lib/layout.ts` and
  reused by `SelectionBar` + the toast so they stay aligned) at ≥900px / `Drawer` (<900px),
  plus a 64px sticky blurred topbar (page title + `actions` slot). Sidebar body split into
  `components/app-shell/`: `SidebarNavItem` (the 46px nav row: icon tile + animated `::before`
  accent bar, active state primary-tinted via one `tint()` helper) and `SidebarFooter` (avatar
  card + `ColorModeToggle` + sign-out). Content is full-width with `{ xs: 3, sm: 4, lg: 6 }` gutters.
- `Logo` / `LogoMark`: inline-SVG isometric-box monogram.
- `QueueToolbar`: a `CONTROL_HEIGHT` (40px) search field that grows to fill the row (with a `/` kbd hint
  and a global `/`-to-focus / `Esc`-to-clear handler) + a right-aligned filter cluster:
  marketplace `ToggleButtonGroup` and a "Priority" toggle (`showPriority`), both 40px. When
  neither filter is shown (history) the cluster is omitted and the search runs full-width.
  `onChange` emits `ToolbarState { q, marketplace, priority }`; the toggles fire immediately,
  the text field debounces.
- `OrdersTable`: one table for queue and history (`status` picks which). Just the container +
  header + `.map` shell now; each row is `orders-table/OrdersTableRow` (with `OrderPrimaryCell`
  / `NotesCell` local to it), and the `<colgroup>` widths + coupled `minWidth` live in
  `orders-table/orderColumns.ts`. Callbacks: `onTogglePriority` (flag cell, queue only),
  `onEditNote` (queue **Notes** column: click to open the popover; empty cells hover-reveal an
  add icon), `onReopenRow` (per-row Reopen, history only). Hover-reveal elements use
  `.db-row-hover`. Parse status is **not a column**; a non-`Parsed` order shows a warning/error
  icon next to its number (tooltip from `PARSE_STATUS_HINTS`); history rows show a note-present
  icon there instead.
- `OrderDetailPage` is a thin shell over `components/order-detail/`: `OrderInfoPanel` (read
  view), `OrderEditForm` (correction form, owns its edit state, so mount `key={order.id}`),
  `OrderNoteCard`, `PackingSlipPanel` (owns the blob-URL effect).
- `SelectionBar`: floating pill, bottom-centre over the content, deliberately **loud**
  (large `size="large"` buttons, 28px count badge, a `color-mix` primary ring + `--db-shadow-lg`,
  back-out slide-up). Generalized to `{ count, onClear, children }`; each page passes its own
  action buttons (queue: Ship/Cancel; history: Reopen). This and the toast are the two
  intentional exceptions to the quiet-UI rule: a warehouse operator must not miss them.
- `NotePopover`: anchored popover around the shared `ui/NoteEditor` (Cmd/Ctrl+Enter saves).
- `UploadDialog` / `ShippableOrdersDialog` / `ShippableItemsDialog`: all three use the shared
  `ui/FileDropzone` for the drag-drop area. Both Shippable dialogs share the same flow: drop
  CSV → map columns (auto-detected via `lib/csv.ts`) → preview → Download CSV (client-side,
  BOM + CRLF). `ShippableOrdersDialog` (button "Shippable Orders") shows three tabs (by
  order / by item / not in inventory) and calls `POST /api/reports/shippable-orders`.
  `ShippableItemsDialog` (button "Shippable Items", the original item-centric report restored
  alongside the order-centric one) shows just items + not-in-inventory and calls
  `POST /api/reports/shippable-items` — same matching engine on the backend
  (`InventoryMatching`), so their per-item numbers always agree.
  `UploadDialog` is expected to take **large multi-file selections**: a warehouse operator
  drops a week at once (hundreds, up to ~1000 PDFs). `api/orders.ts#uploadPackingSlips` sends
  them in sequential 6-file batches (`UPLOAD_CHUNK_SIZE`; keep at 6: 6 × the 15 MB file cap =
  90 MB, under the API's 100 MB `RequestSizeLimit`; 8 would overflow it) so the server never
  sees a big request and each request parses files sequentially. The staged-file list and
  result list render at most `UPLOAD_LIST_PREVIEW` (80) rows plus an overflow count; results
  needing attention sort first. Each chunk uses `announce=false`; one final
  `/api/orders/upload/announce` call sends the activity summary.
- `ConfirmActionDialog`: `intent: 'ship' | 'cancel' | 'reopen'`, 3-way copy config; `onConfirm`
  takes no args (the acting user comes from the JWT server-side).
- `ToastProvider` / `useToast`: MUI Snackbar, **top-centre over the content**, a big solid
  `palette[severity].main` bar (28px icon, 16px/600 text, `contrastText`), slide-down with a
  back-out easing; errors linger (9s) longer than success (4.5s). Severity is passed explicitly,
  never string-matched (the old app's fragile pattern). Not an MUI `<Alert>` but a plain styled
  `Box`, because the theme's `MuiAlert` root forces `surface.panel` bg and would kill the fill.
- `ui/` primitives: `Mono`, `MarketplaceTag`, `StatusBadge` (`OrderStatusBadge` / `ParseStatusBadge`),
  `RelativeTime`, `EmptyState`, `TableSkeleton`, `EventTimeline`, `Kbd`, `FileDropzone`,
  `NoteEditor`, `PriorityToggle`.
  `TableSkeleton` uses real MUI table elements; pass `orderColumns(...)` as its layout for
  queue/history so the loading and populated tables share column geometry.

Marketplace accent colours: `MARKETPLACE_COLORS` in `theme.ts` (Amazon orange, eBay red,
Walmart blue, Shopify green), used only as small dots, never as fills.

## Security

The JWT lives in `localStorage` (`digitalbox_token`), so **any XSS is full account takeover**:
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
  hiding and `ProtectedRoute requireRole` are UX, not a security boundary; the API enforces
  `[Authorize(Roles=Admin)]` and that's what actually matters.
- **No new runtime dependency without a look at what it does**: a compromised or sloppy
  package runs with the token in scope. This also keeps the bundle lean (see Cost awareness).
- Surface the API's `{ message }` in toasts as **text** (the `ApiError` path already does this);
  never inject an error string as markup.

## Deployment configuration (mirror Henderson)

`amplify.yml` configures `npm ci`, `npm run build`, and publishing `dist`. The intended hosting
flow is AWS Amplify connected to `master` for auto-build/deploy; `deploy.ps1` also provides a
manual deployment path. Set `VITE_API_BASE_URL` as an Amplify branch environment variable.
Security headers (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS) are already declared
under `customHeaders`. CSP `connect-src` must match both the API HTTPS origin and its WSS
origin for SignalR. Checked-in configuration alone does not verify live deployment state.

## Cost awareness (AWS)

Amplify bills build minutes, hosting storage, and data transfer out. The UI is cheap and
should stay that way. This isn't about cutting features, just not shipping weight we don't
need:

- **Keep the dependency list lean.** Adding a runtime dep grows every user's bundle and the
  transfer bill. Before reaching for a library, check whether MUI / React / the standard lib
  already covers it. Heavy date/utility/animation libs especially; we deliberately don't
  have them.
- **Import narrowly.** `@mui/icons-material/SpecificIcon`, never `{ SpecificIcon } from
  '@mui/icons-material'`. Same for any package with deep entry points.
- **Fonts are already subset-aware** (`@fontsource*` files carry `unicode-range`, so browsers
  fetch only the Latin slice). Don't add font weights or families casually; each is another
  always-loaded asset.
- **No new build steps or codegen** in `amplify.yml` unless a feature needs it; build
  minutes are metered.
- Server data lives in small hooks around `apiFetch`, not a client-side store or cache
  layer; keep it that way, it's less code and less bundle.

## Gotchas

- MUI **v9** `Stack` no longer accepts `alignItems` / `justifyContent` as props; use `sx`.
- MUI **v9** `Checkbox`: `inputProps` was removed; use `slotProps={{ input: {...} }}`.
- `theme.palette.X` vs `theme.vars.palette.X` in cssVariables mode; see "Design system" above.
  If dark mode looks half-broken (light cards on a dark page), this is why.
- MUI icon names differ by version; verify before importing a new one
  (`ls node_modules/@mui/icons-material | grep -i <name>`). `DeleteOutline` doesn't exist; it's `DeleteOutlined`.
- After adding/removing npm packages while `npm run dev` is running, kill it, delete
  `node_modules/.vite`, and restart, or you'll see phantom "Invalid hook call" errors. HMR also
  wedges after a burst of edits: the console shows stale `ReferenceError`s for names you just
  removed; a dev-server restart clears it (the build itself stays clean).
- oxlint honours `// eslint-disable-next-line react-hooks/exhaustive-deps` (in `useOrders.ts` and
  `QueueToolbar.tsx`) and it suppresses more than just that rule for the effect, so **do not
  remove those comments**; the warning count jumps if you do.
- `oxlint` has only `react/rules-of-hooks` + `react/only-export-components` explicitly configured
  but runs its default correctness set (that's where `set-state-in-effect` comes from).
- The Claude Code browser-preview pane here is ~406 CSS px and scales larger emulated
  viewports down to an unreadable thumbnail; verify desktop layout via DOM measurements
  (`javascript_tool`), not screenshots.
