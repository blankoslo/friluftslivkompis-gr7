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

const NORWAY_CENTER: [number, number] = [13, 65];
const NORWAY_ZOOM = 4;
const CABIN_LAYER_MIN_ZOOM = 7;

const CABIN_COLOR_DNT = "#cc1f2c";
const CABIN_COLOR_OUTLINE = "#ffffff";
const CLUSTER_COLOR = "#cc1f2c";

type Props = {
  selected: SearchResult | null;
  onCabinClick: (id: number) => void;
};

export function Map({ selected, onCabinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onCabinClickRef = useRef(onCabinClick);

  useEffect(() => {
    onCabinClickRef.current = onCabinClick;
  }, [onCabinClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

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

      map.on("click", "cabin-points", (e: MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = (f.properties as { id?: number })?.id;
        if (typeof id === "number") onCabinClickRef.current(id);
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

      for (const layer of ["cabin-points", "cabin-clusters"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

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
