import { Router, type IRouter, type Response } from "express";
import {
  CreateItineraryBody,
  GetPlaceMediaParams,
  GetWeatherQueryParams,
  HealthCheckResponse,
  ReplanItineraryBody,
  ReplanItineraryInNaturalLanguageBody,
  type Interest,
  type TripInput,
} from "@workspace/api-zod";
import { hubs, places } from "../data/greenroute";
import {
  buildItinerary,
  forecast,
  parseNaturalChanges,
  rankPlaces,
  replan,
  wikipediaMedia,
} from "../greenroute/engine";

const router: IRouter = Router();
const supportedInterests = new Set<Interest>([
  "history", "nature", "waterfalls", "beaches", "temples",
  "adventure", "food", "wildlife", "hidden-gems",
]);

function badRequest(res: Response, message: string) {
  res.status(400).json({ error: message });
}

router.get("/health", (_req, res) => {
  res.json(HealthCheckResponse.parse({ status: "ok" }));
});

router.get("/hubs", (_req, res) => {
  res.json(hubs);
});

router.get("/places", (req, res) => {
  const rawInterests = String(req.query.interests ?? "");
  const interests = rawInterests.split(",").filter((value): value is Interest =>
    supportedInterests.has(value as Interest),
  );
  const hubFilter = req.query.hub === undefined ? undefined : String(req.query.hub);
  const startHub = hubFilter ?? "Bengaluru";
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const budget = Number(req.query.budget) || 5000;
  const days = Number(req.query.days) || 3;
  const maxFee = req.query.maxFee === undefined ? Number.POSITIVE_INFINITY : Number(req.query.maxFee);
  const hiddenGems = req.query.hidden === "true";
  if (!Number.isFinite(maxFee) && maxFee !== Number.POSITIVE_INFINITY) return badRequest(res, "Enter a valid maximum entry fee.");
  const ranked = rankPlaces({
    startHub, month, budget, days, interests, hiddenGems,
    pace: "balanced", walking: "medium", priority: "balanced",
  }).filter((place) =>
    place.fee <= maxFee
    && (!hubFilter || place.hub === hubFilter)
    && (!interests.length || interests.some((interest) => place.tags.includes(interest)))
    && (!hiddenGems || place.hiddenGem),
  );
  res.json(ranked);
});

router.get("/places/:placeId/media", async (req, res) => {
  const parsed = GetPlaceMediaParams.safeParse(req.params);
  if (!parsed.success) return badRequest(res, "Invalid place identifier.");
  const place = places.find((entry) => entry.id === parsed.data.placeId);
  if (!place) return res.status(404).json({ error: "Place not found." });
  res.json(await wikipediaMedia(place));
});

router.get("/weather", async (req, res) => {
  const parsed = GetWeatherQueryParams.safeParse({
    lat: Number(req.query.lat),
    lng: Number(req.query.lng),
  });
  if (!parsed.success) return badRequest(res, "Enter a valid latitude and longitude.");
  res.json(await forecast(parsed.data.lat, parsed.data.lng));
});

router.post("/itinerary", async (req, res) => {
  const parsed = CreateItineraryBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Check your trip settings and try again.");
  const input = parsed.data as TripInput;
  if (!hubs.some((hub) => hub.id === input.startHub)) return badRequest(res, "Choose a supported starting city.");
  try {
    res.json(await buildItinerary(input));
  } catch (error) {
    req.log.error({ err: error }, "Unable to build GreenRoute itinerary");
    res.status(500).json({ error: "We couldn't build this route just now. Please try again." });
  }
});

router.post("/replan", async (req, res) => {
  const parsed = ReplanItineraryBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "The updated trip settings are invalid.");
  const input = parsed.data.input as TripInput;
  try {
    res.json(await replan(input, parsed.data.changes as Partial<TripInput> & { exclude?: string[]; excludeInterests?: Interest[] }));
  } catch (error) {
    req.log.error({ err: error }, "Unable to replan GreenRoute itinerary");
    res.status(500).json({ error: "We couldn't update this itinerary just now. Please try again." });
  }
});

router.post("/replan/nl", async (req, res) => {
  const parsed = ReplanItineraryInNaturalLanguageBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Tell us what you would like to change.");
  const input = parsed.data.input as TripInput;
  const changes = parseNaturalChanges(parsed.data.text, input);
  try {
    const result = await replan(input, changes);
    res.json({ changes, ...result });
  } catch (error) {
    req.log.error({ err: error }, "Unable to parse and replan GreenRoute itinerary");
    res.status(500).json({ error: "We couldn't update this itinerary just now. Please try again." });
  }
});

export default router;
