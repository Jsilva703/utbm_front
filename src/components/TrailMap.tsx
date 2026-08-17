"use client";

import { useEffect, useMemo, useRef } from "react";
import L, { LatLngExpression, Map as LeafletMap } from "leaflet";
import { Flag, MapPin } from "lucide-react";
import type {
  PublicLocationPoint,
  PublicRoutePoint,
  PublicTrackingResponse,
} from "@/lib/api/types";

type TrailMapProps = {
  tracking: PublicTrackingResponse | null;
  history: PublicLocationPoint[];
  officialRoute?: PublicRoutePoint[];
};

function isValidPoint(
  point?: { latitude: number; longitude: number } | null,
): point is { latitude: number; longitude: number } {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

function markerHtml(kind: "current" | "start" | "finish") {
  if (kind === "current") {
    return '<div class="marker-pulse"></div>';
  }

  return `<div class="marker-flag">${kind === "start" ? "L" : "C"}</div>`;
}

export function TrailMap({ tracking, history, officialRoute = [] }: TrailMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const finishMarkerRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const officialRouteRef = useRef<L.Polyline | null>(null);

  const currentPoint = tracking?.location || null;
  const path = useMemo(
    () =>
      history
        .filter(isValidPoint)
        .map((point) => [point.latitude, point.longitude] as LatLngExpression),
    [history],
  );
  const officialPath = useMemo(
    () =>
      officialRoute
        .filter(isValidPoint)
        .map((point) => [point.latitude, point.longitude] as LatLngExpression),
    [officialRoute],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const fallbackCenter: LatLngExpression = [-23.524346, -46.885805];
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(fallbackCenter, 15);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    officialRouteRef.current = L.polyline([], {
      color: "#f8c95d",
      weight: 4,
      opacity: 0.7,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    pathRef.current = L.polyline([], {
      color: "#42ff8c",
      weight: 5,
      opacity: 0.86,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      currentMarkerRef.current = null;
      startMarkerRef.current = null;
      finishMarkerRef.current = null;
      pathRef.current = null;
      officialRouteRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    officialRouteRef.current?.setLatLngs(officialPath);
    pathRef.current?.setLatLngs(path);

    const routeForMarkers = officialPath.length > 0 ? officialPath : path;

    if (routeForMarkers.length > 0) {
      const first = routeForMarkers[0];
      const last = routeForMarkers[routeForMarkers.length - 1];

      if (!startMarkerRef.current) {
        startMarkerRef.current = L.marker(first, {
          icon: L.divIcon({
            className: "trail-marker trail-marker-start",
            html: markerHtml("start"),
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(map);
      } else {
        startMarkerRef.current.setLatLng(first);
      }

      if (!finishMarkerRef.current) {
        finishMarkerRef.current = L.marker(last, {
          icon: L.divIcon({
            className: "trail-marker trail-marker-finish",
            html: markerHtml("finish"),
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(map);
      } else {
        finishMarkerRef.current.setLatLng(last);
      }

      map.fitBounds(L.latLngBounds(routeForMarkers), { padding: [34, 34], maxZoom: 17 });
    }

    if (isValidPoint(currentPoint)) {
      const latLng: LatLngExpression = [currentPoint.latitude, currentPoint.longitude];
      if (!currentMarkerRef.current) {
        currentMarkerRef.current = L.marker(latLng, {
          icon: L.divIcon({
            className: "trail-marker trail-marker-current",
            html: markerHtml("current"),
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);
      } else {
        currentMarkerRef.current.setLatLng(latLng);
      }

      if (path.length === 0) {
        map.setView(latLng, 16);
      }
    }
  }, [currentPoint, officialPath, path]);

  if (!tracking?.location && officialPath.length === 0) {
    return (
      <section className="map-shell" aria-label="Mapa">
        <div className="map-empty">
          <div>
            <MapPin size={32} aria-hidden="true" />
            <p>Atleta ainda não iniciou o rastreamento.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="map-shell" aria-label="Mapa de acompanhamento">
      <div ref={containerRef} className="map-canvas" />
      <div className="map-legend" aria-hidden="true">
        <span>
          <i className="legend-line official" />
          Rota oficial
        </span>
        <span>
          <i className="legend-line completed" />
          Percurso realizado
        </span>
      </div>
      <span className="sr-only">
        <Flag size={14} aria-hidden="true" />
        Mapa com rota oficial, posição atual e trilha enviada pelo histórico.
      </span>
    </section>
  );
}
