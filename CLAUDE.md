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
- `QueueToolbar` — debounced search box + marketplace `ToggleButtonGroup` (dot per marketplace).
- `OrdersTable` — one table for queue (selectable rows, sortable Order/Ship-date, `SelectionBar`
  drives bulk ship/cancel) and history (read-only, relative-time + operator). Has `minWidth` so
  it scrolls horizontally instead of squishing on narrow screens.
- `SelectionBar` — floating pill that slides up when rows are selected; hosts Ship/Cancel.
- `UploadDialog` — drag-drop multi-PDF; per-file created/duplicate/error result list.
- `ConfirmActionDialog` — ship/cancel confirm; `intent` prop; requires operator name → `actionedBy`.
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
