# GreenRoute Karnataka

A demo-ready trip planner for discovering Karnataka and comparing day-by-day routes by cost, travel time, and estimated emissions.

## Run & operate

- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/greenroute-karnataka run dev` — start the Vite web app locally.
- `PORT=5000 pnpm --filter @workspace/api-server run dev` — build and start the API on port 5000.
- `pnpm run typecheck` — type-check workspace libraries and artifacts.
- `PORT=5000 BASE_PATH=/ pnpm run build` — type-check and build all workspace packages outside Replit's artifact runner.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API clients and Zod schemas from the OpenAPI spec.

The API server requires `PORT`. AI credentials are optional: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` enables optional itinerary narration and natural-language replanning; deterministic fallbacks remain available.

## Stack

- pnpm workspace, Node.js 24, TypeScript 5.9.
- Web app: React, Vite, Wouter, TanStack Query, Leaflet.
- API: Express 5; contracts and generated clients are shared through workspace packages.
- Optional persistence package: PostgreSQL and Drizzle ORM.

## Where things live

- `artifacts/greenroute-karnataka/src/App.tsx` — planner, route results, comparison, place explorer, saved trips, and replanning UI.
- `artifacts/greenroute-karnataka/src/components/route-map.tsx` — Leaflet map and route layers.
- `artifacts/api-server/src/routes/greenroute.ts` — health, hubs, places, weather, itinerary, and replanning endpoints.
- `artifacts/api-server/src/greenroute/engine.ts` — route scoring, transport options, itinerary construction, and replanning.
- `artifacts/api-server/src/data/greenroute.ts` — supported hubs, places, and rail connections.
- `lib/api-spec/openapi.yaml` — API source of truth; regenerate generated packages after contract changes.
- `lib/api-zod` and `lib/api-client-react` — generated validation schemas and React API hooks.

## Architecture decisions

- The API builds routes deterministically; optional AI only enhances narration and parses natural-language changes.
- Route comparisons use the same itinerary and vary transport-mode selection across cheapest, fastest, greenest, and balanced strategies.
- The browser stores saved trips and the active itinerary in local storage; no account is required.
- Road routing, weather, and place-media lookups use cached external data with fallbacks for unavailable services.
- Cost, time, emissions, and place details are planning estimates, not booking or live-service guarantees.

## Gotchas

- Run commands from the workspace root; use pnpm rather than npm or yarn.
- Keep `lib/api-spec/openapi.yaml` in sync with API routes, then run codegen before type-checking.
- `DATABASE_URL` is needed only for database operations; the current trip-planning API does not require database access.
- Check local transport, permits, opening hours, and weather with operators before travelling.
