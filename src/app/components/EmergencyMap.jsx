import React from 'react';
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetinaUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl
});
function EmergencyMap({
  center = [0, 0],
  markers = [],
  showRadius = false,
  showRoutes = false,
  showDistance = true,
  routeTarget = "patient",
  zoom = 13,
  onMapClick = null,
  followMarkerType = null
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const circleRef = useRef(null);
  const routeLinesRef = useRef([]);
  const breadcrumbsRef = useRef([]);
  const distanceMarkersRef = useRef([]);
  const failedRouteKeysRef = useRef(new Set());
  const pendingRouteKeysRef = useRef(new Set());
  const activeRouteSignatureRef = useRef("");
  const [isClient, setIsClient] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const routePairs = showRoutes ? markers.filter((marker) => marker.type === "ambulance").map((ambulance) => {
    const target = ambulance.routeTarget || routeTarget;
    const destination = markers.find((marker) => marker.type === target && marker.routeKey === ambulance.routeKey)
      || markers.find((marker) => marker.type === target && !marker.routeKey && !ambulance.routeKey);
    return destination ? { ambulance, destination, target } : null;
  }).filter(Boolean) : [];
  const routeSignature = routePairs.map(({ ambulance, destination, target }) => {
    const origin = ambulance.position.map((coordinate) => Number(coordinate).toFixed(3)).join(",");
    const end = destination.position.map((coordinate) => Number(coordinate).toFixed(6)).join(",");
    return `${target}:${origin}:${end}`;
  }).join("|");
  const viewportSignature = routePairs.length
    ? routePairs.map(({ ambulance, destination, target }) => `${target}:${destination.position.join(",")}`).join("|")
    : markers.map((marker) => `${marker.type}:${marker.position.join(",")}`).join("|");
  const followMarker = followMarkerType ? markers.find((marker) => marker.type === followMarkerType) : null;
  const followSignature = followMarker?.position.map((coordinate) => Number(coordinate).toFixed(5)).join(",") || "";
  useEffect(() => {
    setIsClient(true);
  }, []);
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const calculateETA = (distanceKm) => {
    const speedKmH = 60;
    const timeHours = distanceKm / speedKmH;
    const timeMinutes = Math.round(timeHours * 60);
    if (timeMinutes < 1) return "< 1 min";
    if (timeMinutes < 60) return `${timeMinutes} mins`;
    const hours = Math.floor(timeMinutes / 60);
    const mins = timeMinutes % 60;
    return `${hours}h ${mins}m`;
  };
  useEffect(() => {
    if (!isClient || !containerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
        circleRef.current = null;
        routeLinesRef.current.forEach((line) => line.remove());
        routeLinesRef.current = [];
        breadcrumbsRef.current.forEach((crumb) => crumb.remove());
        breadcrumbsRef.current = [];
        distanceMarkersRef.current.forEach((marker) => marker.remove());
        distanceMarkersRef.current = [];
      }
    };
  }, [isClient]);
  useEffect(() => {
    if (mapRef.current && isClient && !followMarkerType) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, isClient, zoom, followMarkerType]);
  useEffect(() => {
    if (!mapRef.current || !isClient || !followMarkerType || !followMarker) return;
    mapRef.current.panTo(followMarker.position, { animate: true, duration: 0.4 });
  }, [followMarkerType, followSignature, isClient]);
  useEffect(() => {
    if (!mapRef.current || !isClient || !onMapClick) return;
    const handleClick = (event) => {
      const selected = [event.latlng.lat, event.latlng.lng];
      mapRef.current?.setView(selected, Math.max(mapRef.current.getZoom(), 15));
      onMapClick(selected);
    };
    mapRef.current.on("click", handleClick);
    return () => mapRef.current?.off("click", handleClick);
  }, [isClient, onMapClick]);
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !isClient) return;
    markersLayerRef.current.clearLayers();
    const createIcon = (type) => {
      const colors = {
        patient: "#ef4444",
        ambulance: "#3b82f6",
        hospital: "#10b981"
      };
      const svgs = {
        patient: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
        ambulance: '<path d="M18 18.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5m1.5-9l1.96 2.5H17V9.5M6 18.5a1.5 1.5 0 0 1-1.5-1.5A1.5 1.5 0 0 1 6 15.5A1.5 1.5 0 0 1 7.5 17A1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3c-1.11 0-2 .89-2 2v11h2a3 3 0 0 0 3 3a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3a3 3 0 0 0 3-3h2v-5l-3-4Z"/>',
        hospital: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>'
      };
      const pulseAnimation = type === "patient" ? `<style>
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.1); }
            }
            .pulse-marker {
              animation: pulse 2s ease-in-out infinite;
            }
          </style>` : "";
      return L.divIcon({
        className: "custom-marker",
        html: `${pulseAnimation}<div class="${type === "patient" ? "pulse-marker" : ""}" style="background: ${colors[type]}; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            ${svgs[type]}
          </svg>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
    };
    markers.forEach((marker) => {
      const leafletMarker = L.marker(marker.position, {
        icon: createIcon(marker.type)
      }).bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong style="color: ${marker.type === "patient" ? "#ef4444" : marker.type === "ambulance" ? "#3b82f6" : "#10b981"};">${marker.label}</strong>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${marker.position[0].toFixed(6)}, ${marker.position[1].toFixed(6)}
          </div>
        </div>
      `);
      markersLayerRef.current?.addLayer(leafletMarker);
    });
  }, [markers, isClient, showRoutes, routeTarget]);
  useEffect(() => {
    if (!mapRef.current || !isClient || !viewportSignature) return;
    const viewportMarkers = routePairs.length
      ? routePairs.flatMap(({ ambulance, destination }) => [ambulance, destination])
      : markers;
    if (viewportMarkers.length > 1) {
      mapRef.current.fitBounds(L.latLngBounds(viewportMarkers.map((marker) => marker.position)), {
        padding: [80, 80],
        maxZoom: 16,
        animate: true,
        duration: 0.5
      });
    } else if (viewportMarkers.length === 1) {
      mapRef.current.setView(viewportMarkers[0].position, zoom);
    }
  }, [isClient, viewportSignature]);
  useEffect(() => {
    if (!mapRef.current || !isClient) return;
    if (circleRef.current) {
      mapRef.current.removeLayer(circleRef.current);
      circleRef.current = null;
    }
    if (showRadius) {
      circleRef.current = L.circle(center, {
        radius: 2e3,
        color: "#ec4899",
        fillColor: "#ec4899",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "10, 10"
      }).addTo(mapRef.current);
    }
  }, [showRadius, center, isClient]);
  useEffect(() => {
    activeRouteSignatureRef.current = routeSignature;
    setRouteError(null);
    if (!mapRef.current || !isClient) return;
    routeLinesRef.current.forEach((line) => line.remove());
    routeLinesRef.current = [];
    distanceMarkersRef.current.forEach((marker) => marker.remove());
    distanceMarkersRef.current = [];
    if (!showRoutes) return () => { activeRouteSignatureRef.current = ""; };
    if (!routePairs.length) return () => { activeRouteSignatureRef.current = ""; };
    const drawRoute = (coordinates, distanceKm, durationMinutes) => {
      if (activeRouteSignatureRef.current !== routeSignature || !mapRef.current) return;
      const casing = L.polyline(coordinates, { color: "#ffffff", weight: 11, opacity: 0.9 }).addTo(mapRef.current);
      const line = L.polyline(coordinates, { color: "#2563eb", weight: 7, opacity: 0.98 }).addTo(mapRef.current);
      routeLinesRef.current.push(casing);
      routeLinesRef.current.push(line);
      if (showDistance) {
        const midpoint = coordinates[Math.floor(coordinates.length / 2)];
        const eta = durationMinutes < 1 ? "< 1 min" : `${Math.round(durationMinutes)} min`;
        const icon = L.divIcon({ className: "distance-marker", html: `<div style="background:white;padding:7px 10px;border-radius:18px;border:2px solid #17365d;box-shadow:0 3px 10px #0003;font-weight:600;font-size:12px;color:#17365d;white-space:nowrap">${distanceKm.toFixed(1)} km · ${eta}</div>`, iconSize: [115, 28], iconAnchor: [57, 14] });
        distanceMarkersRef.current.push(L.marker(midpoint, { icon, interactive: false }).addTo(mapRef.current));
      }
    };
    routePairs.forEach(({ ambulance, destination }) => {
      const [fromLat, fromLng] = ambulance.position;
      const [toLat, toLng] = destination.position;
      const failedRouteKey = `${destination.type}:${toLat.toFixed(5)},${toLng.toFixed(5)}:${fromLat.toFixed(2)},${fromLng.toFixed(2)}`;
      if (failedRouteKeysRef.current.has(failedRouteKey)) {
        setRouteError("No drivable road route was found. Verify the assigned hospital pin.");
        return;
      }
      if (pendingRouteKeysRef.current.has(failedRouteKey)) return;
      pendingRouteKeysRef.current.add(failedRouteKey);
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      fetch(routeUrl).then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok || (result.code && result.code !== "Ok")) {
          if (response.status === 400 || ["NoRoute", "NoSegment"].includes(result.code)) {
            failedRouteKeysRef.current.add(failedRouteKey);
            throw new Error("No drivable road route was found. Verify the assigned hospital pin.");
          }
          throw new Error("The road routing service is temporarily unavailable.");
        }
        return result;
      }).then((result) => {
        if (activeRouteSignatureRef.current !== routeSignature) return;
        setRouteError(null);
        const route = result.routes?.[0];
        if (!route) throw new Error("Route unavailable");
        drawRoute(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), route.distance / 1000, route.duration / 60);
      }).catch((error) => {
        if (activeRouteSignatureRef.current === routeSignature) setRouteError(error.message);
      }).finally(() => pendingRouteKeysRef.current.delete(failedRouteKey));
    });
    return () => {
      if (activeRouteSignatureRef.current === routeSignature) activeRouteSignatureRef.current = "";
    };
  }, [showRoutes, routeSignature, isClient, showDistance, routeTarget]);
  if (!isClient) {
    return /* @__PURE__ */ React.createElement("div", { className: "w-full h-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-gray-500" }, "Loading map..."));
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "relative h-full w-full rounded-lg overflow-hidden"
    },
    /* @__PURE__ */ React.createElement("div", {
      ref: containerRef,
      className: "w-full h-full",
      "data-route-target": routeTarget,
      style: { minHeight: "300px" }
    }),
    routeError && showRoutes && /* @__PURE__ */ React.createElement("p", {
      role: "status",
      className: "absolute bottom-3 left-3 right-3 z-[1000] rounded-md border border-amber-300 bg-amber-50/95 p-3 text-sm text-amber-900 shadow"
    }, "Road route unavailable: ", routeError)
  );
}
export {
  EmergencyMap
};
