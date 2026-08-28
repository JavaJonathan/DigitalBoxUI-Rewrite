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
`react-router-dom` v7, `@fontsource` self-hosted fonts. No Redux — the old four-slice store
mostly cached one response shape; server data now lives in small hooks (`hooks/useOrders.ts`)
around `apiFetch`, UI state in `useState`.

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
- `AppLayout` — brand-gradient AppBar, Queue/History nav, sign-out, optional right-side actions slot.
- `UploadDialog` — drag-drop multi-PDF upload; shows a per-file created/duplicate/error result list.
- `OrdersTable` — one table for both queue (selectable rows, ship-date/title sort) and history
  (read-only, shows shipped/cancelled-on + operator).
- `FilterBar` — debounced text search + marketplace select.
- `ConfirmActionDialog` — ship/cancel confirm; requires the operator to type their name (→ `actionedBy`).
- `ToastProvider` / `useToast` — MUI Snackbar; severity is passed explicitly, never matched from message text (the old app's fragile pattern).

**Design tokens** in `src/theme.ts` — keeps the old DigitalBox blue identity
(`BRAND_GRADIENT`), primary `#2563eb`, Plus Jakarta Sans headings + Inter body.

## Deployment (mirror Henderson — not yet wired)

`amplify.yml` is in place. Target: AWS Amplify connected to `master`, auto-build/deploy.
`VITE_API_BASE_URL` is set as an Amplify branch env var pointing at the deployed API.

## Gotchas

- MUI **v9** `Stack` no longer accepts `alignItems` / `justifyContent` as props — use `sx`.
- MUI icon names differ by version; verify before importing a new one
  (`ls node_modules/@mui/icons-material | grep -i <name>`). `DeleteOutline` doesn't exist; it's `DeleteOutlined`.
- After adding/removing npm packages while `npm run dev` is running, kill it, delete
  `node_modules/.vite`, and restart, or you'll see phantom "Invalid hook call" errors.
