"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  Map as MlMap,
  Marker,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { rasterSource, KARTVERKET_ATTRIBUTION } from "@/lib/kartverket";
import { resultZoom, type SearchResult } from "@/lib/search/types";
import type { TripNearItem } from "@/lib/ut";

const NORWAY_CENTER: [number, number] = [10.74, 59.91];
const NORWAY_ZOOM = 8;
const CABIN_LAYER_MIN_ZOOM = 7;

const CABIN_COLOR_DNT = "#cc1f2c";
const CABIN_COLOR_OUTLINE = "#ffffff";
const CLUSTER_COLOR = "#cc1f2c";
const TRIP_COLOR = "#0f766e";
const TRIP_COLOR_ACTIVE = "#fbbf24";

const TRIPS_SOURCE = "trip-starts";
const TRIPS_LAYER = "trip-points";

type ViewportInfo = {
  lon: number;
  lat: number;
  radiusMeters: number;
};

type Props = {
  selected: SearchResult | null;
  trips: TripNearItem[];
  activeTripId: number | null;
  onCabinClick: (id: number) => void;
  onTripClick: (id: number) => void;
  onViewportChange: (v: ViewportInfo) => void;
};

export function Map({
  selected,
  trips,
  activeTripId,
  onCabinClick,
  onTripClick,
  onViewportChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onCabinClickRef = useRef(onCabinClick);
  const onTripClickRef = useRef(onTripClick);
  const onViewportChangeRef = useRef(onViewportChange);
  const styleReadyRef = useRef(false);

  useEffect(() => {
    onCabinClickRef.current = onCabinClick;
    onTripClickRef.current = onTripClick;
    onViewportChangeRef.current = onViewportChange;
  }, [onCabinClick, onTripClick, onViewportChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    function emitViewport(map: MlMap) {
      const center = map.getCenter();
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const radius = Math.max(
        haversine(center.lng, center.lat, ne.lng, ne.lat),
        haversine(center.lng, center.lat, sw.lng, sw.lat),
      );
      onViewportChangeRef.current({
        lon: center.lng,
        lat: center.lat,
        radiusMeters: Math.round(radius),
      });
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs:
          "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
        customAttribution: `${KARTVERKET_ATTRIBUTION} · <a href="https://ut.no" target="_blank" rel="noreferrer">© DNT / UT.no</a>`,
      }),
    );
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("dnt-cabins", {
        type: "geojson",
        data: "/api/cabins",
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 11,
      });

      map.addLayer({
        id: "cabin-clusters",
        type: "circle",
        source: "dnt-cabins",
        filter: ["has", "point_count"],
        minzoom: CABIN_LAYER_MIN_ZOOM,
        paint: {
          "circle-color": CLUSTER_COLOR,
          "circle-opacity": 0.85,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            14,
            10,
            18,
            30,
            22,
            80,
            26,
          ],
        },
      });

      map.addLayer({
        id: "cabin-cluster-count",
        type: "symbol",
        source: "dnt-cabins",
        filter: ["has", "point_count"],
        minzoom: CABIN_LAYER_MIN_ZOOM,
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cabin-points",
        type: "circle",
        source: "dnt-cabins",
        filter: ["!", ["has", "point_count"]],
        minzoom: CABIN_LAYER_MIN_ZOOM,
        paint: {
          "circle-color": CABIN_COLOR_DNT,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7,
            3,
            12,
            6,
            15,
            8,
          ],
          "circle-stroke-color": CABIN_COLOR_OUTLINE,
          "circle-stroke-width": 1.5,
        },
      });

      map.addSource(TRIPS_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: TRIPS_LAYER,
        type: "circle",
        source: TRIPS_SOURCE,
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "active"], true],
            TRIP_COLOR_ACTIVE,
            TRIP_COLOR,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            4,
            10,
            7,
            14,
            10,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.on("click", "cabin-points", (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = (f.properties as { id?: number })?.id;
        if (typeof id === "number") onCabinClickRef.current(id);
      });

      map.on("click", TRIPS_LAYER, (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = (f.properties as { id?: number })?.id;
        if (typeof id === "number") onTripClickRef.current(id);
      });

      map.on("click", "cabin-clusters", async (e: MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["cabin-clusters"],
        });
        const cluster = features[0];
        if (!cluster) return;
        const clusterId = (cluster.properties as { cluster_id?: number })
          ?.cluster_id;
        if (clusterId === undefined) return;
        const source = map.getSource("dnt-cabins") as maplibregl.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        if (cluster.geometry.type === "Point") {
          map.easeTo({
            center: cluster.geometry.coordinates as [number, number],
            zoom,
          });
        }
      });

      for (const layer of ["cabin-points", "cabin-clusters", TRIPS_LAYER]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      styleReadyRef.current = true;
      emitViewport(map);
    });

    map.on("moveend", () => emitViewport(map));

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    const src = map.getSource(TRIPS_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!src) return;
    src.setData(tripsToGeoJSON(trips, activeTripId));
  }, [trips, activeTripId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;

    const target: [number, number] = [selected.lon, selected.lat];

    if (markerRef.current) {
      markerRef.current.setLngLat(target);
    } else {
      markerRef.current = new maplibregl.Marker({ color: "#1e40af" })
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

function tripsToGeoJSON(
  trips: TripNearItem[],
  activeId: number | null,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: trips.map((t) => ({
      type: "Feature",
      id: t.id,
      geometry: { type: "Point", coordinates: [t.lon, t.lat] },
      properties: {
        id: t.id,
        name: t.name,
        active: t.id === activeId,
      },
    })),
  };
}

function haversine(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
