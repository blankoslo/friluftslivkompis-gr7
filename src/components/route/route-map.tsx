"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, {
  Map as MlMap,
  Marker,
  type LngLatBoundsLike,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { rasterSource, KARTVERKET_ATTRIBUTION } from "@/lib/kartverket/tiles";
import type { CabinPoint } from "@/lib/route";
import type { TripTimeline } from "@/lib/timeline";
import { weatherLabel } from "@/components/timeline/weather-symbol";

type RouteMapDay = TripTimeline["days"][number];

interface Props {
  cabins: CabinPoint[];
  days: RouteMapDay[];
}

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

const ROUTE_SOURCE = "trip-route";
const ROUTE_LAYER = "trip-route-line";
const ROUTE_LAYER_CASING = "trip-route-line-casing";

export function RouteMap({ cabins, days }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const styleReadyRef = useRef(false);

  const { center, bounds } = useMemo(() => {
    if (cabins.length === 0) {
      return {
        center: [10.74, 59.91] as [number, number],
        bounds: null as LngLatBoundsLike | null,
      };
    }
    const lons = cabins.map((c) => c.lon);
    const lats = cabins.map((c) => c.lat);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    return {
      center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2] as [number, number],
      bounds: [
        [minLon, minLat],
        [maxLon, maxLat],
      ] as LngLatBoundsLike,
    };
  }, [cabins]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: { kartverket: rasterSource("topo") },
        layers: [
          {
            id: "kartverket-topo",
            type: "raster",
            source: "kartverket",
            minzoom: 0,
            maxzoom: 18,
          },
        ],
      },
      center,
      zoom: 6,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: KARTVERKET_ATTRIBUTION,
      }),
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("load", () => {
      const flame = readToken("--brand-flame-primary", "#C8602A");
      const flamePressed = readToken("--brand-flame-pressed", "#7A3515");

      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: ROUTE_LAYER_CASING,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 7,
          "line-opacity": 0.9,
        },
      });

      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": flamePressed,
          "line-width": 4,
          "line-dasharray": [2, 1.5],
        },
      });

      styleReadyRef.current = true;
      renderRoute(map, cabins);
      renderMarkers(map, markersRef, cabins, days, flame);

      if (bounds) {
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: 11,
          duration: 0,
        });
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    renderRoute(map, cabins);
    const flame = readToken("--brand-flame-primary", "#C8602A");
    renderMarkers(map, markersRef, cabins, days, flame);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 11,
        duration: 600,
      });
    }
  }, [cabins, days, bounds]);

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}

function renderRoute(map: MlMap, cabins: CabinPoint[]) {
  const src = map.getSource(ROUTE_SOURCE) as
    | maplibregl.GeoJSONSource
    | undefined;
  if (!src) return;
  if (cabins.length < 2) {
    src.setData({ type: "FeatureCollection", features: [] });
    return;
  }
  src.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: cabins.map((c) => [c.lon, c.lat] as [number, number]),
        },
        properties: {},
      },
    ],
  });
}

function renderMarkers(
  map: MlMap,
  markersRef: React.MutableRefObject<Marker[]>,
  cabins: CabinPoint[],
  days: RouteMapDay[],
  flameColor: string,
) {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];

  cabins.forEach((cabin, idx) => {
    const el = document.createElement("div");
    el.className = "lm-route-pin";
    el.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${flameColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-stamp, system-ui);
      font-weight: 700;
      font-size: 13px;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      cursor: pointer;
    `;
    el.textContent = String(idx + 1);

    const popupHtml = buildPopupHtml(cabin, idx, days);
    const popup = new maplibregl.Popup({
      offset: 18,
      closeButton: true,
      maxWidth: "260px",
    }).setHTML(popupHtml);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([cabin.lon, cabin.lat])
      .setPopup(popup)
      .addTo(map);

    markersRef.current.push(marker);
  });
}

function buildPopupHtml(
  cabin: CabinPoint,
  idx: number,
  days: RouteMapDay[],
): string {
  const dayFrom = days.find((d) => d.leg.from.name === cabin.name);
  const escName = escapeHtml(cabin.name);

  let body = `<div style="font-family:var(--font-body,system-ui);font-size:12px;color:#333;">`;
  body += `<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#7A3515;font-weight:700;">Hytte ${idx + 1}</div>`;
  body += `<div style="font-family:var(--font-heading,Georgia);font-size:16px;font-weight:700;color:#1a1a1a;margin-top:2px;">${escName}</div>`;

  if (dayFrom) {
    const dateLabel = dayFrom.date
      ? new Date(dayFrom.date + "T00:00:00Z").toLocaleDateString("nb-NO", {
          weekday: "long",
          day: "numeric",
          month: "short",
        })
      : `Dag ${dayFrom.dayNumber}`;
    body += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #eee;">`;
    body += `<div style="font-size:11px;color:#666;text-transform:capitalize;">${escapeHtml(dateLabel)} · etappe ${dayFrom.dayNumber}</div>`;
    body += `<div style="font-size:12px;color:#1a1a1a;">${dayFrom.leg.distanceKm.toFixed(1)} km · ${dayFrom.leg.estimatedHours.toFixed(1)} t</div>`;
    if (dayFrom.weather) {
      const w = dayFrom.weather;
      const tempStr =
        w.tempMin !== null && w.tempMax !== null
          ? `${Math.round(w.tempMin)}° til ${Math.round(w.tempMax)}°C`
          : "";
      body += `<div style="margin-top:4px;font-size:12px;color:#3D6475;">${escapeHtml(weatherLabel(w.symbolCode))}${tempStr ? ` · ${tempStr}` : ""}</div>`;
      if (w.precipMm > 0) {
        body += `<div style="font-size:11px;color:#666;">${w.precipMm.toFixed(1)} mm nedbør</div>`;
      }
    } else if (dayFrom.date) {
      const target = new Date(dayFrom.date + "T00:00:00Z").getTime();
      const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
      const days = Math.round((target - today) / (24 * 3600 * 1000));
      if (days > 9) {
        body += `<div style="margin-top:4px;font-size:11px;color:#3D6475;">Sesong-snitt - prognose kommer ~9 dager før</div>`;
      } else {
        body += `<div style="margin-top:4px;font-size:11px;color:#999;">Værvarsel mangler</div>`;
      }
    } else {
      body += `<div style="margin-top:4px;font-size:11px;color:#999;">Værvarsel mangler</div>`;
    }
    body += `</div>`;
  }

  body += `</div>`;
  return body;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
