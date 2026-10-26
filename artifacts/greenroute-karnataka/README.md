# GreenRoute Karnataka

A demo-ready Karnataka trip planner. The browser app uses the shared API server for place recommendations, itinerary generation, route comparison, weather and place media.

## Run

From the workspace root, start the managed services:

- Web app: `pnpm --filter @workspace/greenroute-karnataka run dev`
- API server: `pnpm --filter @workspace/api-server run dev`

The app works without AI credentials. The Replit preview should use the registered **GreenRoute Karnataka AI** web artifact.

## Deploy to Vercel

The repository includes a root `vercel.json` that selects this package as the
deployable Vite application. Import the repository as a single Vercel project;
do not select `artifacts/mockup-sandbox` or `artifacts/api-server` as the
project root. The Vercel build produces the static frontend in
`artifacts/greenroute-karnataka/dist/public`.

The frontend expects the API at `/api`. For a production deployment, deploy
the API separately and configure the Vercel project with the appropriate
rewrite or API host; the Vite development proxy only targets the local API.

The **Voice guide** route (`/translator`) lets travellers speak into their device microphone, translate the transcript between their language and Kannada or another Karnataka language, and play the translation aloud. It uses the browser Web Speech API, so microphone permission is required and support depends on the browser (Chrome, Edge and Safari are recommended). Typed input and the on-screen pronunciation remain available when voice recognition is unavailable.

## Demo routes

The landing page includes three end-to-end presets:

- **Heritage & Nature** — Bengaluru, 3 days, ₹5,000, history and nature, greenest priority.
- **Coastal & Waterfalls** — Mangaluru, 4 days, ₹8,000, beaches, waterfalls and food.
- **Bengaluru Green Weekend** — Bengaluru, 2 days, ₹2,000, nature, food and history, low walking.

For the over-budget demo, open the Heritage & Nature route, choose **Change my plan**, and lower the budget to ₹3,000. The results page also offers one-click route changes when a plan exceeds its budget.

## AI setup

Deterministic recommendations, route scoring, narrative templates and the natural-language parser are always available. To enable the live AI features, copy the workspace `.env.example` to your local environment and set one provider key:

- `ANTHROPIC_API_KEY` (default model: `claude-3-5-haiku-latest`)
- `OPENAI_API_KEY` (default model: `gpt-4o-mini`)
- `GROQ_API_KEY` (default model: `llama-3.3-70b-versatile`)

Set `AI_PROVIDER=anthropic`, `AI_PROVIDER=openai`, or `AI_PROVIDER=groq` when multiple keys are present. The API exposes `/api/ai/status` without returning credentials, and the replanning drawer shows whether a live provider is ready. AI failures fall back to the deterministic behavior, so trip planning remains usable.

## How the optimiser works

- Place matches use interest overlap, hidden-gem preference, season, entry-fee fit and distance from the start hub; must-visits rank first and exclusions are removed.
- Stops are grouped by hub, ordered with nearest-neighbour and a 2-opt improvement, then checked against the selected daily pace.
- Every leg compares feasible walk, bus, metro, train, auto, cab and electric-cab options. Cheapest, fastest, greenest and balanced strategies use per-leg comparisons; entry, food and stay costs are included in the totals.
- The eco score compares the selected route emissions with an all-cab baseline. Replanning rebuilds the itinerary and reports stop, mode and total changes.

## Data and limitations

The Karnataka place catalogue and route estimates are intended for trip planning demonstrations, not bookings. OSRM road routing, Open-Meteo forecasts and Wikipedia media are cached server-side and have deterministic or gradient fallbacks. Map tiles use CARTO with OpenStreetMap attribution and switch to OpenStreetMap tiles if CARTO is unavailable.

Travel times, fares, weather, opening details and suggested routes are estimates. Confirm transport, access, permits, opening hours and weather with local operators before travelling.
