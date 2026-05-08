"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { rasterSource, KARTVERKET_ATTRIBUTION } from "@/lib/kartverket";
import { APP_CACHE, DATA_CACHE, TILE_CACHE } from "@/lib/offline/cache";
import {
  bboxFromCoords,
  planPrecache,
  type Bbox,
  type TilePrecachePlan,
} from "@/lib/offline/tiles";
import type { Cabin, Trip } from "@/lib/ut";

type Props = {
  trip: Trip;
  cabins: Cabin[];
};

type DownloadState =
  | { status: "idle"; cached: number; total: number }
  | { status: "running"; done: number; total: number }
  | { status: "done"; cached: number; total: number }
  | { status: "error"; message: string };

const PRECACHE_CONCURRENCY = 6;

export function OfflineMap({ trip, cabins }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const gpsMarkerRef = useRef<Marker | null>(null);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [download, setDownload] = useState<DownloadState>({
    status: "idle",
    cached: 0,
    total: 0,
  });
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [position, setPosition] = useState<{
    lon: number;
    lat: number;
    accuracy: number;
  } | null>(null);

  const routeCoords = useMemo<Array<[number, number]>>(() => {
    const flat = flattenGeometry(trip.geojson);
    return flat.map((c) => [c[0], c[1]]);
  }, [trip.geojson]);

  const bbox: Bbox | null = useMemo(() => {
    const allCoords: Array<[number, number]> = [...routeCoords];
    for (const c of cabins) {
      const co = c.geojson?.coordinates;
      if (co && co.length >= 2) allCoords.push([co[0], co[1]]);
    }
    if (trip.startPointGeojson) {
      const co = trip.startPointGeojson.coordinates;
      if (co && co.length >= 2) allCoords.push([co[0], co[1]]);
    }
    return bboxFromCoords(allCoords);
  }, [routeCoords, cabins, trip.startPointGeojson]);

  const plan: TilePrecachePlan | null = useMemo(
    () => (bbox ? planPrecache(bbox) : null),
    [bbox],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const root = getComputedStyle(document.documentElement);
    const tripColor =
      root.getPropertyValue("--accent-forest").trim() || "#3D5E35";
    const cabinColor =
      root.getPropertyValue("--brand-flame-primary").trim() || "#C8602A";
    const startColor =
      root.getPropertyValue("--accent-midnight-sun").trim() || "#B8891E";

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
      center: bbox
        ? [(bbox.minLon + bbox.maxLon) / 2, (bbox.minLat + bbox.maxLat) / 2]
        : [10.74, 59.91],
      zoom: 10,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: `${KARTVERKET_ATTRIBUTION} · <a href="https://ut.no" target="_blank" rel="noreferrer">© DNT / UT.no</a>`,
      }),
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("load", () => {
      if (routeCoords.length >= 2) {
        map.addSource("trip-route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: routeCoords },
            properties: {},
          },
        });
        map.addLayer({
          id: "trip-route-casing",
          type: "line",
          source: "trip-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": 6,
            "line-opacity": 0.8,
          },
        });
        map.addLayer({
          id: "trip-route-line",
          type: "line",
          source: "trip-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": tripColor,
            "line-width": 4,
          },
        });
      }

      const cabinFeatures: GeoJSON.Feature[] = cabins
        .filter((c) => c.geojson?.coordinates)
        .map((c) => ({
          type: "Feature",
          id: c.id,
          geometry: {
            type: "Point",
            coordinates: c.geojson!.coordinates as [number, number],
          },
          properties: {
            id: c.id,
            name: c.name,
            popupHtml: cabinPopupHtml(c),
          },
        }));

      map.addSource("offline-cabins", {
        type: "geojson",
        data: { type: "FeatureCollection", features: cabinFeatures },
      });
      map.addLayer({
        id: "offline-cabin-points",
        type: "circle",
        source: "offline-cabins",
        paint: {
          "circle-color": cabinColor,
          "circle-radius": 6,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.on("click", "offline-cabin-points", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const geom = f.geometry as GeoJSON.Point;
        const html = (f.properties?.popupHtml as string) ?? "";
        new maplibregl.Popup({ maxWidth: "280px" })
          .setLngLat(geom.coordinates as [number, number])
          .setHTML(html)
          .addTo(map);
      });
      map.on("mouseenter", "offline-cabin-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "offline-cabin-points", () => {
        map.getCanvas().style.cursor = "";
      });
      map.addLayer({
        id: "offline-cabin-labels",
        type: "symbol",
        source: "offline-cabins",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1a1612",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      if (trip.startPointGeojson) {
        const co = trip.startPointGeojson.coordinates;
        if (co && co.length >= 2) {
          new maplibregl.Marker({ color: startColor })
            .setLngLat([co[0], co[1]])
            .setPopup(new maplibregl.Popup().setText("Startpunkt"))
            .addTo(map);
        }
      }

      if (bbox) {
        map.fitBounds(
          [
            [bbox.minLon, bbox.minLat],
            [bbox.maxLon, bbox.maxLat],
          ],
          { padding: 60, duration: 0 },
        );
      }
    });

    mapRef.current = map;

    return () => {
      gpsMarkerRef.current?.remove();
      gpsMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [routeCoords, cabins, trip.startPointGeojson, bbox]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setGpsError(null);
        setPosition({
          lon: p.coords.longitude,
          lat: p.coords.latitude,
          accuracy: p.coords.accuracy,
        });
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    const lngLat: [number, number] = [position.lon, position.lat];
    if (gpsMarkerRef.current) {
      gpsMarkerRef.current.setLngLat(lngLat);
    } else {
      const el = document.createElement("div");
      el.className = "gps-pulse";
      gpsMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, [position]);

  const startDownload = useCallback(async () => {
    if (!plan || plan.urls.length === 0) return;
    const total = plan.urls.length;
    setDownload({ status: "running", done: 0, total });
    try {
      const cache = await caches.open(TILE_CACHE);
      let done = 0;
      const queue = [...plan.urls];

      async function worker() {
        while (queue.length > 0) {
          const url = queue.shift();
          if (!url) return;
          try {
            const existing = await cache.match(url);
            if (!existing) {
              const res = await fetch(url, { mode: "cors" });
              if (res.ok) await cache.put(url, res.clone());
            }
          } catch (e) {
            console.warn("[offline] tile failed", url, e);
          }
          done++;
          setDownload({ status: "running", done, total });
        }
      }

      const workers = Array.from(
        { length: Math.min(PRECACHE_CONCURRENCY, total) },
        () => worker(),
      );
      await Promise.all(workers);

      try {
        const dataCache = await caches.open(DATA_CACHE);
        await dataCache.add(`/api/ut-trips/${trip.id}`);
        await dataCache.add("/api/cabins");
      } catch (e) {
        console.warn("[offline] data precache failed", e);
      }
      try {
        const appCache = await caches.open(APP_CACHE);
        await appCache.add(`/offline/tur/${trip.id}`);
      } catch (e) {
        console.warn("[offline] page precache failed", e);
      }

      setDownload({
        status: "done",
        cached: total,
        total,
      });
    } catch (e) {
      setDownload({ status: "error", message: (e as Error).message });
    }
  }, [plan, trip.id]);

  return (
    <div className="flex h-full flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-md rounded-md border border-border bg-surface p-md">
        <div>
          <div className="font-heading text-h3 font-semibold text-text-primary">
            {trip.name}
          </div>
          <div className="mt-xs flex flex-wrap gap-md text-small text-text-muted">
            {trip.distance && (
              <span>{(trip.distance / 1000).toFixed(1)} km</span>
            )}
            {trip.durationDays && trip.durationDays > 0 && (
              <span>
                {trip.durationDays === 1
                  ? "1 dag"
                  : `${trip.durationDays} dager`}
              </span>
            )}
            <span>{cabins.length} hytter på ruta</span>
            <span
              className={
                online ? "text-forest" : "text-warning"
              }
            >
              {online ? "● Online" : "● Offline"}
            </span>
          </div>
        </div>
        <DownloadButton
          state={download}
          plan={plan}
          onClick={startDownload}
        />
      </div>

      {gpsError && (
        <div className="rounded-md border border-warning-border bg-warning-bg p-sm text-small text-warning">
          GPS feilet: {gpsError}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-md border border-border">
        <div ref={containerRef} className="h-full w-full" />
        {position && (
          <div className="pointer-events-none absolute bottom-md left-md rounded-md bg-background/85 px-sm py-xs text-small font-mono text-text-primary backdrop-blur">
            {position.lat.toFixed(5)}, {position.lon.toFixed(5)} · ±
            {Math.round(position.accuracy)} m
          </div>
        )}
      </div>

      <style jsx global>{`
        .gps-pulse {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-fjord);
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 0 var(--accent-fjord);
          animation: gps-pulse 1.6s infinite;
        }
        @keyframes gps-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(61, 100, 117, 0.55);
          }
          70% {
            box-shadow: 0 0 0 16px rgba(61, 100, 117, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(61, 100, 117, 0);
          }
        }
      `}</style>
    </div>
  );
}

function DownloadButton({
  state,
  plan,
  onClick,
}: {
  state: DownloadState;
  plan: TilePrecachePlan | null;
  onClick: () => void;
}) {
  if (!plan) {
    return (
      <span className="text-small text-text-muted">
        Ingen rutegeometri å laste ned
      </span>
    );
  }

  if (state.status === "running") {
    const pct = state.total
      ? Math.round((state.done / state.total) * 100)
      : 0;
    return (
      <div className="text-small text-text-muted">
        Laster ned tiles… {state.done}/{state.total} ({pct}%)
      </div>
    );
  }

  if (state.status === "done") {
    return (
      <div className="text-small text-forest">
        ✓ Lagret {state.cached} tiles offline
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-md bg-warning-bg px-md py-sm text-small font-medium text-warning hover:opacity-90"
      >
        Feilet, prøv igjen
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-flame-primary px-md py-sm text-small font-medium text-white hover:bg-flame-hover"
    >
      Last ned for offline ({plan.count} tiles)
    </button>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cabinPopupHtml(c: Cabin): string {
  const beds = [
    c.bedsStaffed != null ? `${c.bedsStaffed} betjent` : null,
    c.bedsSelfService != null ? `${c.bedsSelfService} selvbetjent` : null,
    c.bedsNoService != null ? `${c.bedsNoService} ubetjent` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const lines: string[] = [];
  lines.push(
    `<strong style="font-family:Georgia,serif;font-size:14px">${escapeHtml(
      c.name,
    )}</strong>`,
  );
  if (c.serviceLevel)
    lines.push(
      `<div style="font-size:11px;color:#5a4a3a;text-transform:uppercase;letter-spacing:0.05em">${escapeHtml(
        c.serviceLevel,
      )}${c.dntCabin ? " · DNT" : ""}</div>`,
    );
  if (beds)
    lines.push(
      `<div style="font-size:12px;margin-top:4px">Senger: ${escapeHtml(beds)}</div>`,
    );
  if (c.description) {
    const trimmed = c.description.length > 220
      ? c.description.slice(0, 217) + "…"
      : c.description;
    lines.push(
      `<div style="font-size:12px;margin-top:6px;line-height:1.4">${escapeHtml(trimmed)}</div>`,
    );
  }
  if (c.phone)
    lines.push(
      `<div style="font-size:11px;margin-top:6px">📞 ${escapeHtml(c.phone)}</div>`,
    );
  return `<div style="color:#1a1612">${lines.join("")}</div>`;
}

function flattenGeometry(
  g: Trip["geojson"],
): Array<[number, number] | [number, number, number]> {
  if (!g) return [];
  if (g.type === "LineString") {
    return g.coordinates as Array<[number, number] | [number, number, number]>;
  }
  if (g.type === "MultiLineString") {
    const co = g.coordinates as Array<
      Array<[number, number] | [number, number, number]>
    >;
    return co.flat();
  }
  if (g.type === "Point") {
    return [g.coordinates as [number, number]];
  }
  return [];
}
