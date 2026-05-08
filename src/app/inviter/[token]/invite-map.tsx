"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { rasterSource, KARTVERKET_ATTRIBUTION } from "@/lib/kartverket/tiles";

type CabinPin = {
  name: string;
  lat: number;
  lon: number;
};

type Props = {
  cabins: CabinPin[];
};

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export function InviteMap({ cabins }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (cabins.length === 0) return;

    const cabinColor = readToken("--brand-flame-pressed", "#7A3515");
    const lineColor = readToken("--accent-forest", "#3D5E35");

    const lons = cabins.map((c) => c.lon);
    const lats = cabins.map((c) => c.lat);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

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
      center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
      zoom: 9,
      attributionControl: false,
      interactive: true,
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
      if (cabins.length >= 2) {
        map.addSource("invite-route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: cabins.map((c) => [c.lon, c.lat]),
            },
            properties: {},
          },
        });
        map.addLayer({
          id: "invite-route-casing",
          type: "line",
          source: "invite-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": 6,
            "line-opacity": 0.85,
          },
        });
        map.addLayer({
          id: "invite-route-line",
          type: "line",
          source: "invite-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": lineColor, "line-width": 4 },
        });
      }

      map.addSource("invite-cabins", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: cabins.map((c, i) => ({
            type: "Feature",
            id: i,
            geometry: { type: "Point", coordinates: [c.lon, c.lat] },
            properties: { name: c.name },
          })),
        },
      });
      map.addLayer({
        id: "invite-cabin-points",
        type: "circle",
        source: "invite-cabins",
        paint: {
          "circle-color": cabinColor,
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "invite-cabin-labels",
        type: "symbol",
        source: "invite-cabins",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1a1612",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      if (cabins.length >= 2) {
        map.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          { padding: 60, duration: 0 },
        );
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [cabins]);

  return (
    <div
      ref={containerRef}
      className="h-72 sm:h-96 w-full rounded-md border-2 border-flame-pressed overflow-hidden"
    />
  );
}
