import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon, latLngBounds, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Hub, Itinerary, Mode, Strategy } from "@workspace/api-client-react";

const dayColors = ["#10B981", "#0EA5E9", "#F59E0B", "#8B5CF6", "#EF4444", "#14B8A6", "#EC4899"];
const modeColors: Record<Mode, string> = {
  walk: "#22C55E", metro: "#8B5CF6", bus: "#F59E0B", train: "#0EA5E9",
  ecab: "#14B8A6", auto: "#F97316", cab: "#EF4444",
};
const modeNames: Record<Mode, string> = {
  walk: "Walk", metro: "Metro", bus: "Bus", train: "Train",
  ecab: "E-cab", auto: "Auto", cab: "Cab",
};

type Props = {
  days: Itinerary["days"];
  selectedDay: number;
  strategy: Strategy;
  startHub: string;
  hubs: Hub[];
  focusedPlace?: string;
  onFocusPlace: (id: string) => void;
  onSelectDay: (index: number) => void;
};

function MapViewport({ points, focused, resetKey }: {
  points: LatLngExpression[];
  focused?: LatLngExpression;
  resetKey: string;
}) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      if (focused) map.flyTo(focused, Math.max(map.getZoom(), 9), { duration: 0.45 });
      else if (points.length > 1) map.fitBounds(latLngBounds(points), { padding: [35, 35], maxZoom: 9 });
      else if (points.length === 1) map.setView(points[0]!, 10);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [map, points, focused, resetKey]);
  return null;
}

export function RouteMap({ days, selectedDay, strategy, startHub, hubs, focusedPlace, onFocusPlace, onSelectDay }: Props) {
  const [layer, setLayer] = useState<number | null>(selectedDay);
  useEffect(() => setLayer(selectedDay), [selectedDay]);

  const visibleDays = useMemo(
    () => layer === null ? days.map((day, index) => ({ day, dayIndex: index })) : days[layer] ? [{ day: days[layer]!, dayIndex: layer }] : [],
    [days, layer],
  );
  const focusedStop = visibleDays.flatMap(({ day }) => day.stops).find((stop) => stop.place.id === focusedPlace);
  const points = useMemo(() => visibleDays.flatMap(({ day }) => day.stops.map((stop) => [stop.place.lat, stop.place.lng] as LatLngExpression)), [visibleDays]);

  return <div className="map-frame">
    <div className="map-layer-controls" aria-label="Map layers">
      <button type="button" className={layer === null ? "selected" : ""} onClick={() => setLayer(null)}>All days</button>
      {days.map((day, index) => <button type="button" key={day.dayNo} className={layer === index ? "selected" : ""} onClick={() => { setLayer(index); onSelectDay(index); }} style={{ "--layer-color": dayColors[index % dayColors.length] } as React.CSSProperties}>Day {day.dayNo}</button>)}
    </div>
    <MapContainer center={[14.8, 75.7]} zoom={7} scrollWheelZoom={false} className="leaflet-container">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      {visibleDays.map(({ day, dayIndex }) => day.stops.map((stop, stopIndex) => {
        const coordinate: [number, number] = [stop.place.lat, stop.place.lng];
        const icon = divIcon({
          className: "route-pin-wrap",
          html: `<span class="route-pin" style="--pin-color:${dayColors[dayIndex % dayColors.length]}">${String(stopIndex + 1).padStart(2, "0")}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        return <Marker
          key={`${day.dayNo}-${stop.place.id}`}
          position={coordinate}
          icon={icon}
          eventHandlers={{ click: () => {
            onSelectDay(dayIndex);
            onFocusPlace(stop.place.id);
            window.setTimeout(() => document.getElementById(`stop-${stop.place.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
          } }}
        >
          <Popup><strong>{stop.place.name}</strong><br />Day {day.dayNo} · {stop.arrive} · {stop.place.region}</Popup>
        </Marker>;
      }))}
      {visibleDays.map(({ day }) => day.legs.map((leg) => {
        const mode = leg.chosen[strategy].mode;
        const geometry = leg.geometry?.map(([lat, lng]) => [lat, lng] as [number, number]) ?? [];
        const stopIndex = day.stops.findIndex((stop) => stop.place.id === leg.toId);
        const target = day.stops[stopIndex]?.place;
        const source = stopIndex > 0
          ? day.stops[stopIndex - 1]?.place
          : hubs.find((hub) => hub.id === startHub);
        const fallback = target && source ? [[source.lat, source.lng] as [number, number], [target.lat, target.lng] as [number, number]] : [];
        const route = geometry.length > 1 ? geometry : fallback;
        if (route.length < 2) return null;
        return <Polyline
          key={`${day.dayNo}-${leg.fromId}-${leg.toId}-${strategy}`}
          positions={route}
          pathOptions={{ color: modeColors[mode], weight: 4, opacity: 0.88, dashArray: mode === "walk" ? "7 8" : undefined }}
        >
          <Popup>{modeNames[mode]} · {leg.fromName} to {leg.toName}</Popup>
        </Polyline>;
      }))}
      <MapViewport points={points} focused={focusedStop ? [focusedStop.place.lat, focusedStop.place.lng] : undefined} resetKey={`${layer}-${strategy}-${days.length}-${focusedPlace ?? ""}`} />
    </MapContainer>
    <div className="map-credit">KARNATAKA · © OPENSTREETMAP · CARTO</div>
  </div>;
}

export { modeColors, modeNames };
