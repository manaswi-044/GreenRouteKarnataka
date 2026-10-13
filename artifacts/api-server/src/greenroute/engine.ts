import type {
  Day,
  Interest,
  Itinerary,
  Leg,
  LegOption,
  Mode,
  Place,
  ReplanDiff,
  Strategy,
  TripInput,
} from "@workspace/api-zod";
import { hubs, places, railPairs } from "../data/greenroute";

const strategies: Strategy[] = ["cheapest", "fastest", "greenest", "balanced"];
const emissions: Record<Mode, number> = {
  walk: 0, metro: 30, bus: 55, train: 35, auto: 85, cab: 170, ecab: 40,
};
const speed: Record<Mode, number> = {
  walk: 5, metro: 33, bus: 42, train: 50, auto: 20, cab: 55, ecab: 50,
};
const waits: Record<Mode, number> = {
  walk: 0, metro: 6, bus: 15, train: 40, auto: 3, cab: 8, ecab: 8,
};
const modeColors: Record<Mode, string> = {
  walk: "#22c55e", metro: "#8b5cf6", bus: "#f59e0b", train: "#0ea5e9",
  auto: "#f97316", cab: "#ef4444", ecab: "#14b8a6",
};
const metroStations = [
  { name: "Majestic", lat: 12.9757, lng: 77.5728 },
  { name: "Vidhana Soudha", lat: 12.9795, lng: 77.5911 },
  { name: "Cubbon Park", lat: 12.9810, lng: 77.5970 },
  { name: "MG Road", lat: 12.9756, lng: 77.6068 },
  { name: "Lalbagh", lat: 12.9468, lng: 77.5802 },
  { name: "KR Market", lat: 12.9626, lng: 77.5769 },
];

export interface RoadRoute {
  distanceKm: number;
  minutes: number;
  geometry: number[][];
}

const roadCache = new Map<string, { value: RoadRoute; expires: number }>();
const weatherCache = new Map<string, { value: { tMax: number; rainMm: number; code: number; available: boolean }; expires: number }>();
const wikiCache = new Map<string, { value: { thumbnail: string | null; extract: string | null }; expires: number }>();

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (deg: number) => (deg * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

const straightLine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => [
  [a.lat, a.lng], [b.lat, b.lng],
];

export async function roadRoute(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): Promise<RoadRoute> {
  const key = [a.lat.toFixed(4), a.lng.toFixed(4), b.lat.toFixed(4), b.lng.toFixed(4)].join(",");
  const cached = roadCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const direct = haversine(a, b);
  const fallback: RoadRoute = {
    distanceKm: direct * 1.3,
    minutes: Math.max(2, Math.round((direct * 1.3 / 40) * 60)),
    geometry: straightLine(a, b),
  };
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(2500), headers: { "User-Agent": "GreenRoute-Karnataka-Demo/1.0" } },
    );
    if (!response.ok) throw new Error(`OSRM ${response.status}`);
    const data = await response.json() as {
      routes?: Array<{ distance: number; duration: number; geometry?: { coordinates?: number[][] } }>;
    };
    const route = data.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    const value: RoadRoute = route && Array.isArray(coordinates) && coordinates.length
      ? {
          distanceKm: route.distance / 1000,
          minutes: Math.max(1, Math.round(route.duration / 60)),
          geometry: coordinates.map(([lng, lat]) => [lat, lng]),
        }
      : fallback;
    roadCache.set(key, { value, expires: Date.now() + 24 * 60 * 60 * 1000 });
    return value;
  } catch {
    roadCache.set(key, { value: fallback, expires: Date.now() + 24 * 60 * 60 * 1000 });
    return fallback;
  }
}

export async function forecast(lat: number, lng: number) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  try {
    const query = new URLSearchParams({
      latitude: String(lat), longitude: String(lng),
      daily: "temperature_2m_max,precipitation_sum,weathercode",
      timezone: "Asia/Kolkata", forecast_days: "7",
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const body = await response.json() as {
      daily?: { temperature_2m_max?: number[]; precipitation_sum?: number[]; weathercode?: number[] };
    };
    const value = {
      tMax: body.daily?.temperature_2m_max?.[0] ?? 28,
      rainMm: body.daily?.precipitation_sum?.[0] ?? 0,
      code: body.daily?.weathercode?.[0] ?? 1,
      available: true,
    };
    weatherCache.set(key, { value, expires: Date.now() + 60 * 60 * 1000 });
    return value;
  } catch {
    const value = { tMax: 28, rainMm: 0, code: 1, available: false };
    weatherCache.set(key, { value, expires: Date.now() + 10 * 60 * 1000 });
    return value;
  }
}

export async function wikipediaMedia(place: Place) {
  const key = place.wiki;
  const cached = wikiCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place.wiki)}`,
      { signal: AbortSignal.timeout(2500), headers: { "User-Agent": "GreenRoute-Karnataka-Demo/1.0" } },
    );
    if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
    const body = await response.json() as {
      thumbnail?: { source?: string };
      extract?: string;
    };
    const value = { thumbnail: body.thumbnail?.source ?? null, extract: body.extract ?? null };
    wikiCache.set(key, { value, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    return value;
  } catch {
    const value = { thumbnail: null, extract: null };
    wikiCache.set(key, { value, expires: Date.now() + 60 * 60 * 1000 });
    return value;
  }
}

function recommendationScore(
  place: Place,
  input: TripInput,
): { matchScore: number; why: string } {
  const interests = input.interests ?? [];
  const matched = place.tags.filter((tag) => interests.includes(tag));
  const interestMatch = matched.length / Math.max(1, interests.length);
  const seasonFit = place.bestMonths.includes(input.month) ? 1 : 0.3;
  const feeLimit = input.budget / (input.days * 3);
  const feeFit = 1 - Math.min(1, place.fee / Math.max(1, feeLimit));
  const start = hubs.find((hub) => hub.id === input.startHub) ?? hubs[0];
  const proximity = 1 - Math.min(1, haversine(start, place) / 600);
  const matchScore = Math.min(100, Math.round(
    60 * interestMatch
    + 15 * (input.hiddenGems && place.hiddenGem ? 1 : 0)
    + 10 * seasonFit
    + 10 * feeFit
    + 5 * proximity
    + (input.mustVisit?.includes(place.id) ? 100 : 0),
  ));
  const labels = matched.length ? matched.map((tag) => tag.replace("-", " ")).join(" and ") : "your trip";
  const monthName = new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2020, input.month - 1, 1));
  const seasonalNote = place.bestMonths.includes(input.month)
    ? `best in ${monthName}`
    : `best in ${place.bestMonths.map((month) => new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2020, month - 1, 1))).join(", ")}`;
  return {
    matchScore,
    why: `Matches your interest in ${labels}, ${seasonalNote}, ₹${place.fee} entry.`,
  };
}

export function rankPlaces(input: Partial<TripInput> & { interests?: Interest[] }) {
  const fullInput = {
    startHub: input.startHub ?? "Bengaluru",
    days: input.days ?? 3,
    budget: input.budget ?? 5000,
    interests: input.interests ?? [],
    pace: input.pace ?? "balanced",
    priority: input.priority ?? "balanced",
    walking: input.walking ?? "medium",
    month: input.month ?? new Date().getMonth() + 1,
    hiddenGems: input.hiddenGems ?? false,
    mustVisit: input.mustVisit ?? [],
    excluded: input.excluded ?? [],
  } as TripInput;
  const excluded = new Set(fullInput.excluded ?? []);
  const mustVisit = new Set(fullInput.mustVisit ?? []);
  return places
    .filter((place) => !excluded.has(place.id))
    .map((place) => ({ ...place, ...recommendationScore(place, fullInput) }))
    .sort((a, b) =>
      Number(mustVisit.has(b.id)) - Number(mustVisit.has(a.id))
      || b.matchScore - a.matchScore
      || a.name.localeCompare(b.name),
    );
}

function closestMetroStation(point: { lat: number; lng: number }, preferred?: string) {
  if (preferred) {
    const station = metroStations.find((entry) => entry.name === preferred);
    if (station && haversine(point, station) <= 1.2) return station;
  }
  const nearest = metroStations
    .map((station) => ({ station, distance: haversine(point, station) }))
    .sort((a, b) => a.distance - b.distance)[0];
  return nearest && nearest.distance <= 1.2 ? nearest.station : undefined;
}

function optionsFor(
  distanceKm: number,
  b: Place,
  walking: TripInput["walking"],
  metroRoute: { from: string; to: string } | undefined,
  trainAllowed: boolean,
  local: boolean,
): LegOption[] {
  const tolerance = { low: 0.8, medium: 2, high: 4 }[walking];
  const result: LegOption[] = [];
  if (distanceKm <= tolerance) {
    result.push({
      mode: "walk", modes: ["walk"], distanceKm, minutes: Math.max(2, Math.round(distanceKm / speed.walk * 60)),
      cost: 0, co2Kg: 0, label: "Walk",
    });
  }
  const waitCost = (mode: Mode) => waits[mode];
  const fare = (mode: Mode, km: number) => {
    if (mode === "bus") return Math.max(10, Math.round(km * 1.8));
    if (mode === "auto") return Math.max(30, Math.round(km * 16));
    if (mode === "cab") return Math.max(80, Math.round(km * 15));
    if (mode === "ecab") return Math.max(70, Math.round(km * 13));
    return 0;
  };
  const roadModes: Mode[] = ["bus", "auto", "cab"];
  if ((local && ["Bengaluru", "Mysuru", "Mangaluru"].includes(b.hub)) || distanceKm <= 80) roadModes.push("ecab");
  const speedFor = (mode: Mode) => {
    if (mode === "bus") return local ? 18 : 42;
    if (mode === "cab") return local ? 24 : 55;
    if (mode === "ecab") return local ? 24 : 50;
    return speed[mode];
  };
  for (const mode of roadModes) {
    const minutes = Math.round(distanceKm / speedFor(mode) * 60) + waitCost(mode);
    const transport = mode === "bus" ? (local ? "City bus" : "KSRTC intercity bus") : mode === "auto" ? "Auto rickshaw" : mode === "ecab" ? "Electric cab" : "Cab";
    result.push({
      mode, modes: [mode], distanceKm, minutes, cost: fare(mode, distanceKm),
      co2Kg: Number((distanceKm * emissions[mode] / 1000).toFixed(2)),
      label: transport,
    });
  }
  if (metroRoute) {
    const metroDistance = Math.max(1.1, distanceKm * 0.78);
    result.push({
      mode: "metro", modes: ["walk", "metro", "walk"], distanceKm: metroDistance,
      minutes: Math.round(metroDistance / speed.metro * 60) + waits.metro + 8,
      cost: Math.min(60, Math.round(10 + metroDistance * 2.5)),
      co2Kg: Number((metroDistance * emissions.metro / 1000).toFixed(2)),
      label: `Namma Metro ${metroRoute.from} → ${metroRoute.to}`,
    });
  }
  if (trainAllowed) {
    result.push({
      mode: "train", modes: ["bus", "train", "bus"], distanceKm,
      minutes: Math.round(distanceKm / speed.train * 60) + waits.train + 35,
      cost: Math.max(30, Math.round(distanceKm * 0.9)) + 40,
      co2Kg: Number((distanceKm * emissions.train / 1000).toFixed(2)),
      label: "Train with station transfers",
    });
  }
  return result;
}

function chooseOptions(options: LegOption[], priority: Strategy): Leg["chosen"] {
  const costs = options.map((option) => option.cost);
  const times = options.map((option) => option.minutes);
  const co2 = options.map((option) => option.co2Kg);
  const norm = (value: number, values: number[]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max === min ? 0 : (value - min) / (max - min);
  };
  const cheapest = [...options].sort((x, y) => x.cost - y.cost || x.minutes - y.minutes)[0];
  const fastest = [...options].sort((x, y) => x.minutes - y.minutes || x.cost - y.cost)[0];
  const greenest = [...options].sort((x, y) => x.co2Kg - y.co2Kg || x.cost - y.cost)[0];
  const balanced = [...options].sort((x, y) => {
    const score = (option: LegOption) => priority === "greenest"
      ? 0.3 * norm(option.cost, costs) + 0.2 * norm(option.minutes, times) + 0.5 * norm(option.co2Kg, co2)
      : 0.4 * norm(option.cost, costs) + 0.4 * norm(option.minutes, times) + 0.2 * norm(option.co2Kg, co2);
    return score(x) - score(y) || x.cost - y.cost;
  })[0];
  return { cheapest, fastest, greenest, balanced };
}

async function makeLeg(
  fromId: string,
  fromName: string,
  from: { lat: number; lng: number; hub: string },
  to: Place,
  input: TripInput,
): Promise<Leg> {
  const road = await roadRoute(from, to);
  const hubsPair = [from.hub, to.hub].sort().join("|");
  const fromHub = hubs.find((hub) => hub.id === from.hub);
  const toHub = hubs.find((hub) => hub.id === to.hub);
  const trainAllowed = from.hub !== to.hub
    && haversine(from, to) > 80
    && Boolean(fromHub?.railConnected && toHub?.railConnected)
    && railPairs.has(hubsPair);
  const local = from.hub === to.hub;
  const fromPlace = places.find((place) => place.id === fromId);
  const fromStation = fromId === `hub:${from.hub}` && fromHub?.metro
    ? closestMetroStation(from)
    : fromPlace ? closestMetroStation(fromPlace, fromPlace.metroStation) : undefined;
  const toStation = closestMetroStation(to, to.metroStation);
  const metroRoute = local && from.hub === "Bengaluru" && fromStation && toStation
    ? { from: fromStation.name, to: toStation.name }
    : undefined;
  const options = optionsFor(road.distanceKm, to, input.walking, metroRoute, trainAllowed, local);
  return {
    fromId, toId: to.id, fromName, toName: to.name, options,
    chosen: chooseOptions(options, input.priority),
    geometry: road.geometry,
  };
}

function nearestNeighbourOrder<T extends { lat: number; lng: number; matchScore: number }>(
  start: { lat: number; lng: number },
  placesToOrder: T[],
) {
  const remaining = [...placesToOrder];
  const ordered: T[] = [];
  let current = start;
  while (remaining.length) {
    remaining.sort((a, b) =>
      haversine(current, a) - haversine(current, b)
      || b.matchScore - a.matchScore,
    );
    const next = remaining.shift();
    if (!next) break;
    ordered.push(next);
    current = next;
  }
  for (let pass = 0; pass < ordered.length; pass += 1) {
    let improved = false;
    for (let left = 0; left < ordered.length - 1; left += 1) {
      for (let right = left + 1; right < ordered.length; right += 1) {
        const before = left === 0 ? start : ordered[left - 1]!;
        const first = ordered[left]!;
        const last = ordered[right]!;
        const after = ordered[right + 1];
        const oldDistance = haversine(before, first)
          + (after ? haversine(last, after) : 0);
        const newDistance = haversine(before, last)
          + (after ? haversine(first, after) : 0);
        if (newDistance + 0.001 >= oldDistance) continue;
        ordered.splice(left, right - left + 1, ...ordered.slice(left, right + 1).reverse());
        improved = true;
      }
    }
    if (!improved) break;
  }
  return ordered;
}

function clusterPlaces(input: TripInput, scored: ReturnType<typeof rankPlaces>) {
  const count = { relaxed: 2, balanced: 3, packed: 4 }[input.pace];
  const groups = new Map<string, typeof scored>();
  for (const entry of scored) {
    const group = groups.get(entry.hub) ?? [];
    group.push(entry);
    groups.set(entry.hub, group);
  }
  const start = hubs.find((hub) => hub.id === input.startHub) ?? hubs[0];
  const clusters = [...groups.entries()].map(([hubId, group]) => {
    const hub = hubs.find((entry) => entry.id === hubId) ?? start;
    const top = group.slice(0, count);
    const value = top.length ? top.reduce((total, item) => total + item.matchScore, 0) / top.length : 0;
    return { hubId, hub, group, value, distance: haversine(start, hub) };
  });
  const order: typeof clusters = [];
  const remaining = [...clusters];
  let previous = start;
  const localIndex = remaining.findIndex((cluster) => cluster.hubId === start.id);
  const localCluster = remaining[localIndex];
  if (input.days <= 2 && localCluster && localCluster.group.length >= 4) {
    order.push(localCluster, localCluster);
    remaining.splice(localIndex, 1);
    previous = localCluster.hub;
  }
  while (remaining.length && order.length < input.days) {
    const eligible = remaining.filter((cluster) => order.length === 0 || haversine(previous, cluster.hub) <= 350);
    const pool = eligible.length ? eligible : remaining;
    pool.sort((a, b) => {
      const score = (entry: typeof clusters[number]) =>
        entry.value - 0.5 * haversine(previous, entry.hub) - (entry.hubId === previous.id ? 0 : 4);
      return score(b) - score(a);
    });
    const selected = pool[0];
    order.push(selected);
    remaining.splice(remaining.findIndex((entry) => entry.hubId === selected.hubId), 1);
    previous = selected.hub;
  }
  while (order.length < input.days && order.length) {
    order.push(order[order.length % order.length]);
  }
  const maxHours = { relaxed: 7, balanced: 9, packed: 11 }[input.pace];
  const days: Array<typeof scored> = [];
  let previousPlace: Place | null = null;
  const assigned = new Set<string>();
  for (const cluster of order) {
    const origin = previousPlace ?? cluster.hub;
    let candidates = cluster.group.filter((entry) => !assigned.has(entry.id));
    if (!candidates.length) candidates = scored.filter((entry) => !assigned.has(entry.id));
    const selected = nearestNeighbourOrder(origin, candidates).slice(0, count);
    let hours = 0;
    let currentPlace: { lat: number; lng: number } = previousPlace ?? cluster.hub;
    const routeSpeed = cluster.hubId === input.startHub ? 24 : 42;
    const feasible = selected.filter((entry) => {
      const transfer = haversine(currentPlace, entry) / routeSpeed;
      const next = hours + entry.visitHrs + transfer;
      if (next > maxHours) return false;
      hours = next;
      currentPlace = entry;
      return true;
    });
    const mustVisit = (input.mustVisit ?? []).map((id) => scored.find((entry) => entry.id === id && !assigned.has(id))).filter(Boolean);
    for (const required of mustVisit) {
      if (!required || feasible.some((entry) => entry.id === required.id) || feasible.length >= count) continue;
      const from = feasible.at(-1) ?? origin;
      const travel = haversine(from, required) / routeSpeed;
      if (hours + travel + required.visitHrs <= maxHours) {
        feasible.push(required);
        hours += travel + required.visitHrs;
      }
    }
    const day = feasible.length ? feasible : selected.slice(0, 1);
    day.forEach((entry) => assigned.add(entry.id));
    days.push(day);
    previousPlace = days[days.length - 1].at(-1) ?? previousPlace;
  }
  return days;
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = Math.round(minutes % 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export async function buildItinerary(input: TripInput): Promise<Itinerary> {
  const ranked = rankPlaces(input);
  const selectedDays = clusterPlaces(input, ranked);
  const days: Day[] = [];
  const startHub = hubs.find((hub) => hub.id === input.startHub) ?? hubs[0];
  let previous: Place | null = null;
  for (let index = 0; index < selectedDays.length; index++) {
    const selected = selectedDays[index] ?? [];
    const dayPlaces: ReturnType<typeof rankPlaces> = nearestNeighbourOrder<ReturnType<typeof rankPlaces>[number]>(previous ?? startHub, [...selected]);
    const dayOrigin = previous ?? { ...startHub, hub: startHub.id };
    const legs = await Promise.all(dayPlaces.map((scored, stopIndex) => {
      const from = stopIndex === 0 ? dayOrigin : dayPlaces[stopIndex - 1]!;
      return makeLeg(
        stopIndex === 0 ? previous?.id ?? `hub:${startHub.id}` : from.id,
        stopIndex === 0 ? previous?.name ?? startHub.name : from.name,
        from,
        scored,
        input,
      );
    }));
    let time = 8 * 60 + 30;
    const stops = dayPlaces.map((candidate, stopIndex) => {
      const scored = ranked.find((entry) => entry.id === candidate.id) ?? candidate;
      const travelMinutes = legs[stopIndex]?.chosen[input.priority].minutes ?? 0;
      const arrivalTime = time + travelMinutes;
      const scheduledArrival = arrivalTime >= 13 * 60 && time < 13 * 60 ? arrivalTime + 45 : arrivalTime;
      const arrive = formatTime(scheduledArrival);
      time = scheduledArrival + scored.visitHrs * 60;
      const depart = formatTime(time);
      return {
        place: scored,
        arrive,
        depart,
        matchScore: scored.matchScore,
        why: scored.why,
      };
    });
    const entryCost = stops.reduce((sum, stop) => sum + stop.place.fee, 0);
    const perDay = input.budget / Math.max(1, input.days);
    const foodCost = perDay < 1500 ? 400 : perDay < 3000 ? 700 : 1200;
    const stayCost = index === selectedDays.length - 1 ? 0 : perDay < 1500 ? 700 : perDay < 3000 ? 1800 : 3500;
    const names = stops.map((stop) => stop.place.name);
    const narrative = names.length > 1
      ? `Day ${index + 1} pairs ${names.slice(0, -1).join(", ")} with ${names[names.length - 1]}, with time to take in the local landscape and history.`
      : `Day ${index + 1} focuses on ${names[0] ?? "a local Karnataka highlight"} and the stories of the surrounding region.`;
    days.push({
      dayNo: index + 1,
      stops,
      legs,
      entryCost,
      foodCost,
      stayCost,
      narrative,
    });
    previous = dayPlaces.at(-1) ?? previous;
  }

  const allLegs = days.flatMap((day) => day.legs);
  const totals = {} as Itinerary["totals"];
  for (const strategy of strategies) {
    const modeMix: Record<string, number> = {};
    for (const leg of allLegs) {
      const mode = leg.chosen[strategy].mode;
      modeMix[mode] = (modeMix[mode] ?? 0) + 1;
    }
    const transport = allLegs.reduce((sum, leg) => {
      const option = leg.chosen[strategy];
      return {
        cost: sum.cost + option.cost,
        minutes: sum.minutes + option.minutes,
        co2Kg: sum.co2Kg + option.co2Kg,
      };
    }, { cost: 0, minutes: 0, co2Kg: 0 });
    const tripEntry = days.reduce((sum, day) => sum + day.entryCost, 0);
    const foodAndStay = days.reduce((sum, day) => sum + day.foodCost + day.stayCost, 0);
    const visitMinutes = days.flatMap((day) => day.stops).reduce((sum, stop) => sum + stop.place.visitHrs * 60, 0);
    totals[strategy] = {
      cost: Math.round(transport.cost + tripEntry + foodAndStay),
      minutes: Math.round(transport.minutes + visitMinutes),
      co2Kg: Number(transport.co2Kg.toFixed(2)),
      modeMix,
    };
  }

  const baselineCo2Kg = Number(allLegs.reduce((sum, leg) =>
    sum + (leg.options[0]?.distanceKm ?? 0) * emissions.cab / 1000, 0).toFixed(2));
  const total = totals[input.priority];
  const ecoScore = baselineCo2Kg > 0
    ? Math.max(0, Math.min(100, Math.round(100 * (1 - total.co2Kg / baselineCo2Kg))))
    : 100;
  const overBudgetBy = Math.max(0, total.cost - input.budget);
  const cheapestSaving = Math.max(0, total.cost - totals.cheapest.cost);
  const rankedSelected = days.flatMap((day) => day.stops).sort((a, b) => a.matchScore - b.matchScore);
  const removable = rankedSelected.find((stop) => !(input.mustVisit ?? []).includes(stop.place.id));
  const removeSaving = removable ? Math.round(
    removable.place.fee + Math.min(1200, totals[input.priority].cost * 0.1),
  ) : 0;
  const cutSaving = input.days > 1
    ? Math.round((totals[input.priority].cost - days[0].entryCost) / input.days)
    : 0;
  const perDayBudget = input.budget / Math.max(1, input.days);
  const lowerPerDayBudget = perDayBudget >= 3000 ? 2500 : perDayBudget >= 1500 ? 1400 : perDayBudget;
  const lowerTierBudget = Math.max(1500, Math.round(lowerPerDayBudget * input.days));
  const lowerTierPerDay = lowerTierBudget / Math.max(1, input.days);
  const foodTierCost = (amount: number) => amount < 1500 ? 400 : amount < 3000 ? 700 : 1200;
  const stayTierCost = (amount: number) => amount < 1500 ? 700 : amount < 3000 ? 1800 : 3500;
  const tierSaving = Math.max(0,
    (foodTierCost(perDayBudget) - foodTierCost(lowerTierPerDay)) * input.days
    + (stayTierCost(perDayBudget) - stayTierCost(lowerTierPerDay)) * Math.max(0, input.days - 1),
  );
  const suggestions = [
    ...(cheapestSaving > 0 ? [{
      id: "switch-cheapest",
      label: "Switch to the cheapest routes",
      saving: cheapestSaving,
      description: "Keep every stop and use the lower-fare route choices.",
      changes: { priority: "cheapest" },
    }] : []),
    ...(removable ? [{
      id: "remove-stop",
      label: `Remove ${removable.place.name}`,
      saving: removeSaving,
      description: "Simplify the day and reduce entry and travel costs.",
      changes: { exclude: [removable.place.id] },
    }] : []),
    ...(input.days > 1 ? [{
      id: "cut-day",
      label: "Plan one fewer day",
      saving: cutSaving,
      description: "Remove a day of food, stay and travel costs.",
      changes: { days: input.days - 1 },
    }] : []),
    ...(tierSaving > 0 ? [{
      id: "basic-stay-food",
      label: "Use simpler stays and meals",
      saving: tierSaving,
      description: "Keep the route, with a lower food and accommodation allowance.",
      changes: { budget: lowerTierBudget },
    }] : []),
  ].sort((a, b) => b.saving - a.saving).slice(0, 3);

  await addOptionalNarratives(days, input);
  return {
    input,
    days,
    totals,
    baselineCo2Kg,
    ecoScore,
    overBudgetBy,
    suggestions,
  };
}

export async function replan(input: TripInput, changes: Partial<TripInput> & { exclude?: string[]; excludeInterests?: Interest[] }) {
  const oldItinerary = await buildItinerary(input);
  const next: TripInput = {
    ...input,
    ...changes,
    days: Math.min(7, Math.max(1, Math.round(changes.days ?? input.days))),
    budget: Math.min(50000, Math.max(1500, Math.round(changes.budget ?? input.budget))),
    excluded: [...new Set([...(input.excluded ?? []), ...(changes.exclude ?? [])])],
    interests: (changes.excludeInterests?.length
      ? input.interests.filter((interest) => !changes.excludeInterests?.includes(interest))
      : input.interests),
  };
  const itinerary = await buildItinerary(next);
  return { itinerary, diff: compareItineraries(oldItinerary, itinerary) };
}

export function parseNaturalChanges(text: string, input: TripInput): Partial<TripInput> & { exclude?: string[]; excludeInterests?: Interest[] } {
  const changes: Partial<TripInput> & { exclude?: string[]; excludeInterests?: Interest[] } = {};
  const amount = text.match(/(?:₹|rs\.?\s*)\s*([\d,]+)|\b([\d,]+)\s*(?:rupees|inr)\b/i);
  if (amount) {
    const value = Number((amount[1] ?? amount[2]).replaceAll(",", ""));
    if (Number.isFinite(value)) changes.budget = Math.min(50000, Math.max(1500, value));
  }
  if (/hate walking|no walking|walk less|less walking|low walking|avoid walking|limited walking|mobility/i.test(text)) changes.walking = "low";
  else if (/more walking|high walking|enjoy walking/i.test(text)) changes.walking = "high";
  if (/greenest|greener|eco.?friendly|low carbon|less carbon|sustainable/i.test(text)) changes.priority = "greenest";
  else if (/fastest|faster|quickest|in a hurry/i.test(text)) changes.priority = "fastest";
  else if (/cheapest|cheaper|save money|lower cost/i.test(text)) changes.priority = "cheapest";
  else if (/\bbalanced?\b/i.test(text)) changes.priority = "balanced";
  const lessDay = text.match(/\b(?:one|1)\s+(?:less|fewer)\s+day\b|\bcut\s+(?:one|1)\s+day\b/i);
  const explicitDays = text.match(/\b(\d{1,2})\s+days?\b/i);
  if (lessDay) changes.days = Math.max(1, input.days - 1);
  else if (explicitDays) changes.days = Math.min(7, Math.max(1, Number(explicitDays[1])));
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ");
  if (/\b(skip|remove|drop|avoid)\b/i.test(normalized)) {
    changes.exclude = places.filter((place) => {
      const name = place.name.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ").trim();
      return name.length > 4 && normalized.includes(name);
    }).map((place) => place.id);
  }
  const interestWords: Record<Interest, string[]> = {
    history: ["history", "historic places"], nature: ["nature"], waterfalls: ["waterfalls", "waterfall"],
    beaches: ["beaches", "beach"], temples: ["temples", "temple"], adventure: ["adventure"],
    food: ["food"], wildlife: ["wildlife", "animals"], "hidden-gems": ["hidden gems"],
  };
  const excludedInterests = (Object.entries(interestWords) as [Interest, string[]][])
    .filter(([, terms]) => terms.some((term) => new RegExp(`\\b(?:no|skip|less|avoid)\\s+(?:the\\s+)?${term.replace(" ", "\\s+")}\\b`, "i").test(normalized)))
    .map(([interest]) => interest);
  if (excludedInterests.length) changes.excludeInterests = excludedInterests;
  return changes;
}

async function optionalAIText(system: string, prompt: string): Promise<string | undefined> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (anthropicKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 8192,
          system,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error(`Anthropic ${response.status}`);
      const body = await response.json() as { content?: Array<{ type?: string; text?: string }> };
      const text = body.content?.filter((block) => block.type === "text").map((block) => block.text ?? "").join("").trim();
      if (text) return text;
    } catch {
      // Optional AI failures should leave the deterministic path in control.
    }
  }
  if (openAIKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${openAIKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 8192,
          messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error(`OpenAI ${response.status}`);
      const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = body.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch {
      // Optional AI failures should leave the deterministic path in control.
    }
  }
  return undefined;
}

async function addOptionalNarratives(days: Day[], input: TripInput) {
  const prompt = JSON.stringify({
    interests: input.interests,
    month: new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2020, input.month - 1, 1)),
    days: days.map((day) => ({
      dayNo: day.dayNo,
      places: day.stops.map((stop) => ({ name: stop.place.name, region: stop.place.region, description: stop.place.desc })),
    })),
  });
  const response = await optionalAIText(
    "Write a concise one-sentence travel narrative for each day in a Karnataka itinerary. Use only the provided places and descriptions; do not add unsupported facts. Return JSON only as {\"narratives\":[{\"dayNo\":1,\"text\":\"...\"}]}",
    prompt,
  );
  if (!response) return;
  try {
    const parsed = JSON.parse(response.replace(/^```(?:json)?\s*|\s*```$/g, "")) as { narratives?: Array<{ dayNo?: number; text?: string }> };
    for (const entry of parsed.narratives ?? []) {
      const day = days.find((candidate) => candidate.dayNo === entry.dayNo);
      if (day && typeof entry.text === "string" && entry.text.trim().length > 0) day.narrative = entry.text.trim().slice(0, 320);
    }
  } catch {
    // Keep the deterministic day templates if the optional response is malformed.
  }
}

export async function parseNaturalChangesWithLLM(text: string, input: TripInput) {
  const fallback = parseNaturalChanges(text, input);
  if (!process.env.ANTHROPIC_API_KEY?.trim() && !process.env.OPENAI_API_KEY?.trim()) return fallback;
  const response = await optionalAIText(
    "Convert the requested travel-plan changes to JSON only. Allowed keys: budget (integer INR), days (1-7), walking (low|medium|high), priority (cheapest|fastest|greenest|balanced), excludeInterests (array of supported interest ids). Omit unspecified keys.",
    JSON.stringify({ request: text, current: { budget: input.budget, days: input.days, walking: input.walking, priority: input.priority, interests: input.interests } }),
  );
  if (!response) return fallback;
  try {
    const parsed = JSON.parse(response.replace(/^```(?:json)?\s*|\s*```$/g, "")) as Record<string, unknown>;
    const safe: typeof fallback = { ...fallback };
    if (typeof parsed.budget === "number" && Number.isFinite(parsed.budget)) safe.budget = Math.min(50000, Math.max(1500, Math.round(parsed.budget)));
    if (typeof parsed.days === "number" && Number.isFinite(parsed.days)) safe.days = Math.min(7, Math.max(1, Math.round(parsed.days)));
    if (parsed.walking === "low" || parsed.walking === "medium" || parsed.walking === "high") safe.walking = parsed.walking;
    if (parsed.priority === "cheapest" || parsed.priority === "fastest" || parsed.priority === "greenest" || parsed.priority === "balanced") safe.priority = parsed.priority;
    if (Array.isArray(parsed.excludeInterests)) {
      const valid = parsed.excludeInterests.filter((interest): interest is Interest => ["history", "nature", "waterfalls", "beaches", "temples", "adventure", "food", "wildlife", "hidden-gems"].includes(String(interest)));
      if (valid.length) safe.excludeInterests = valid;
    }
    return safe;
  } catch {
    return fallback;
  }
}

export function compareItineraries(old: Itinerary, next: Itinerary): ReplanDiff {
  const oldIds = new Set(old.days.flatMap((day) => day.stops.map((stop) => stop.place.id)));
  const currentIds = new Set(next.days.flatMap((day) => day.stops.map((stop) => stop.place.id)));
  const removedStops = [...oldIds].filter((id) => !currentIds.has(id));
  const addedStops = [...currentIds].filter((id) => !oldIds.has(id));
  const oldModes = new Map<string, string>();
  const modeChanges: string[] = [];
  for (const day of old.days) {
    for (const leg of day.legs) {
      oldModes.set(`${leg.fromId}:${leg.toId}`, leg.chosen[old.input.priority].mode);
    }
  }
  for (const day of next.days) {
    for (const leg of day.legs) {
      const oldMode = oldModes.get(`${leg.fromId}:${leg.toId}`);
      const newMode = leg.chosen[next.input.priority].mode;
      if (oldMode && oldMode !== newMode) modeChanges.push(`${oldMode} → ${newMode} on ${leg.fromName} to ${leg.toName}`);
    }
  }
  return {
    removedStops,
    addedStops,
    modeChanges: [...new Set(modeChanges)].slice(0, 8),
    costDelta: next.totals[next.input.priority].cost - old.totals[old.input.priority].cost,
    timeDelta: next.totals[next.input.priority].minutes - old.totals[old.input.priority].minutes,
    co2Delta: Number((next.totals[next.input.priority].co2Kg - old.totals[old.input.priority].co2Kg).toFixed(2)),
  };
}

export function modeColor(mode: Mode) {
  return modeColors[mode];
}
