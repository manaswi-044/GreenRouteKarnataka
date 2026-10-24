# GreenRoute Karnataka AI

An intelligent, eco-conscious Karnataka trip planner that calculates optimal multi-day routes across heritage, nature, coastal, and wildlife destinations with per-leg multi-modal transport comparisons and carbon emission scoring.

## Run & operate

- `pnpm dev` — run both API server (port 5000) and Web App (port 3000) concurrently.
- `pnpm dev:api` — run the API server alone (port 5000).
- `pnpm dev:web` — run the React/Vite web application alone (port 3000).
- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/greenroute-karnataka run dev` — start the Vite web app locally.
- `PORT=5000 pnpm --filter @workspace/api-server run dev` — build and start the API on port 5000.
- `pnpm run typecheck` — type-check workspace libraries and artifacts.
- `pnpm run build` — type-check and build all workspace packages.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API clients and Zod schemas from the OpenAPI spec.
- Or run `run.bat` for one-click startup on Windows.

The API server requires `PORT`. AI credentials are optional: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY` enables optional itinerary narration and natural-language replanning; deterministic fallbacks remain available.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9.
- **Frontend**: React 19, Vite 7, TailwindCSS 4, Wouter routing, TanStack Query, Leaflet / React-Leaflet, Lucide icons, Recharts.
- **API Server**: Express 5, Pino logger, CORS, esbuild bundle.
- **Validation & Spec**: OpenAPI 3.1, Zod, Orval code generator.
- **Routing & Intelligence**: OSRM, Open-Meteo, Wikipedia media, deterministic nearest-neighbour + 2-opt clustering, and optional Anthropic Claude / OpenAI / Groq integration.
- **Optional persistence package**: PostgreSQL and Drizzle ORM.

## Key Features

1. **Intelligent Hub & Place Matching**: Ranks 40+ hand-curated Karnataka destinations across 13 major travel hubs.
2. **Multi-Modal Route Optimization**: Evaluates 7 modes per leg across cheapest, fastest, greenest, and balanced strategies.
3. **Eco Scoring & Carbon Intelligence**: Compares chosen route emissions against an all-cab baseline.
4. **Interactive Mapping**: Leaflet maps with custom day markers, multi-modal route overlays, road geometry, and stop inspection.
5. **Adaptive Replanning & Natural Language Assistant**: Supports budget, pace, walking, exclusion, and plain-language changes with deterministic and optional LLM parsing.
6. **Trip Management**: Save, duplicate, compare, and share itineraries with local persistence.

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
