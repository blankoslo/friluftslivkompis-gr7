"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { rasterSource, KARTVERKET_ATTRIBUTION } from "@/lib/kartverket";
import { resultZoom, type SearchResult } from "@/lib/search/types";

const NORWAY_CENTER: [number, number] = [13, 65];
const NORWAY_ZOOM = 4;

type Props = {
  selected: SearchResult | null;
};

export function Map({ selected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
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
      center: NORWAY_CENTER,
      zoom: NORWAY_ZOOM,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: KARTVERKET_ATTRIBUTION,
      }),
    );
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;

    const target: [number, number] = [selected.lon, selected.lat];

    if (markerRef.current) {
      markerRef.current.setLngLat(target);
    } else {
      markerRef.current = new maplibregl.Marker({ color: "#0f766e" })
        .setLngLat(target)
        .addTo(map);
    }

    map.flyTo({
      center: target,
      zoom: resultZoom(selected),
      speed: 1.4,
      essential: true,
    });
  }, [selected]);

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}
