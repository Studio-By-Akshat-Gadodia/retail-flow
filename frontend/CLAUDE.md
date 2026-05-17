# CLAUDE.md ? frontend

React + TypeScript PWA for RetailFlow. Talks to the Django backend (`../backend/`) over `/api/v<N>/<app>/<path>`. See the repo root `CLAUDE.md` for project context and `../backend/core/CLAUDE.md` for the API response contract.

## Stack

- **React + TypeScript** ? all components are `.tsx`, all utilities `.ts`.
- **Tailwind CSS** for styling (`src/styles/tailwind.css`, `src/styles/globals.css`).
- **Axios** as the HTTP client (configured in `src/lib/axios.ts`).
- **React Query** for server-state caching (configured in `src/lib/queryClient.ts`).
- **Service worker / Workbox** for PWA offline support.

## Commands

```bash
cd frontend
npm install
npm start          # dev server
npm run build      # production PWA build
npm test
```

## Folder layout

```
frontend/
??? public/
?   ??? manifest.json              PWA manifest
?   ??? icons/                     PWA icons (192, 512, maskable)
?   ??? robots.txt
?   ??? offline.html               Offline fallback page
??? src/
    ??? app/                       Root composition: App, Router, Providers, ErrorBoundary
    ??? features/                  One folder per domain (mirrors backend apps where applicable)
    ??? shared/                    Generic cross-feature code: components, hooks, utils, constants, types
    ??? lib/                       Third-party config & wrappers: axios, queryClient, storage, i18n
    ??? layouts/                   Page chrome: DashboardLayout, AuthLayout, POSLayout
    ??? pages/                     Thin route components
    ??? styles/                    Global CSS + Tailwind
    ??? service-worker/            sw.ts, strategies.ts, sync-queue.ts
    ??? config/                    env.ts (typed env vars), routes.ts (route constants)
```

## Where things go

The structure is **feature-based**, not type-based. Most new code belongs inside a `features/<name>/` folder.

- **`app/`** ? root composition only. Don't add feature logic here.
- **`features/<name>/`** ? everything for one domain: components, hooks, API calls, types. Subfolders today: `auth`, `products`, `sales`, `inventory`, `suppliers`, `alerts`, `reports`, `scanner`.
- **`shared/`** ? only truly generic code. A `<Button>` belongs here; a `<ProductCard>` doesn't.
- **`lib/`** ? third-party setup and wrappers. No business logic.
- **`layouts/`** ? page chrome. `POSLayout` is for sales-floor screens; `DashboardLayout` for back-office.
- **`pages/`** ? **thin** route components. A page picks a layout and renders one feature view inside it. If a page is more than a few dozen lines, the logic likely belongs in a feature.
- **`service-worker/`** ? `sw.ts` is the entrypoint; `strategies.ts` is per-route caching; `sync-queue.ts` is the offline action queue.
- **`config/env.ts`** ? read every `import.meta.env.*` (or `process.env.REACT_APP_*`) here, type them, export a typed config object. Never read env vars directly elsewhere.
- **`config/routes.ts`** ? all route paths as constants. Never hardcode `/products` in components.

**Cross-feature imports are a smell.** If `sales` reaches into `products/`, the shared piece probably belongs in `shared/` (or should be fetched via the API, not imported).

## Frontend ? backend feature mapping

Not all features map 1:1 to backend apps; some are frontend-only or wrap multiple backend endpoints:

| Frontend feature | Backend app(s) | Notes |
|---|---|---|
| `auth` | Django auth | Login/session; no dedicated backend app |
| `products` | `products` | 1:1 |
| `sales` | `sales` | 1:1 |
| `inventory` | `stock` | **Naming mismatch ? the backend app is `stock/`. Keep API paths as `/api/v<N>/stock/...`** |
| `suppliers` | `suppliers` | 1:1 |
| `alerts` | `alerts` | 1:1 |
| `reports` | `sales` + `exports` | UI for dashboards (`sales`) and CSV/PDF triggers (`exports`) |
| `scanner` | n/a | Frontend-only (camera/barcode); writes go through `inventory`/`products` API |

## API response contract

Every backend response has the shape:

```text
{"status": "success" | "failed", "data": <payload>}
```

Paginated lists put metadata inside `data`:

```text
data: { total_count, total_pages, current_page, page_size, results }
```

The axios client in `src/lib/axios.ts` is responsible for:

- Unwrapping `data` on `status === "success"` so feature code works in domain types (`Product`, `Order`), not API envelopes.
- Throwing a typed error on `status === "failed"`, carrying the inner `data` as the error payload.
- Surfacing paginated responses with the five-key shape unchanged.

Feature code should never inspect `status` or unwrap `data` itself ? that's the client's job.

## PWA / offline-first

The app must be usable on the warehouse floor where wifi is spotty.

- **Stock updates queue locally** when offline (`service-worker/sync-queue.ts`) and replay on reconnect. UI shows optimistic state and reconciles on sync.
- **Reads** are served from IndexedDB via `lib/storage.ts` with background revalidation.
- **Caching strategies** live in `service-worker/strategies.ts` ? network-first for live stock counts; cache-first for product images and supplier metadata.
- **Conflict resolution:** for stock quantities prefer **delta operations** (`+5`, `-3`) over absolute sets so concurrent edits compose cleanly. Last-writer-wins is acceptable for low-frequency edits (supplier details, product metadata).
- `lib/storage.ts` is the only place that touches IndexedDB / localStorage APIs directly.

## API versioning

`config/env.ts` exports `API_BASE_URL` and `API_VERSION`. The axios client composes them ? never hardcode `/api/v1/` in feature code. Bumping the backend to `v2` should be a one-line change.

## State boundaries

- **Server state** (anything from the API) ? React Query. Configure in `lib/queryClient.ts`.
- **Local UI state** ? `useState` / `useReducer`.
- **Cross-feature shared state** ? React context, exported from `app/Providers.tsx`. The project doesn't have a global store (Redux/Zustand) yet ? if you're tempted to add one, ask first.

## TypeScript conventions

- Shared types in `shared/types/`. Feature-internal types stay inside the feature.
- Prefer `type` for unions and shapes, `interface` only for declaration merging.
- No `any` in feature code ? use `unknown` and narrow.
