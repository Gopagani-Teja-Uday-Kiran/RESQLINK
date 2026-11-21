import React, { useEffect, useRef, useState } from "react";
import { api } from "../utils/api";
import { distanceKm } from "../utils/geo";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Navigation } from "lucide-react";

const formatDistance = (meters) => meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
const formatDuration = (seconds) => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

export function RouteGuidance({ emergency, currentLocation, autoRefresh = false }) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefreshStopped, setAutoRefreshStopped] = useState(false);
  const lastRequestKeyRef = useRef("");
  const target = ["arrived", "transporting", "delivered"].includes(emergency.status) ? "hospital" : "patient";
  const destination = target === "hospital" && emergency.hospitalLocation
    ? [emergency.hospitalLocation.latitude, emergency.hospitalLocation.longitude]
    : target === "patient" ? [emergency.latitude, emergency.longitude] : null;
  const routeOrigin = currentLocation || (emergency.ambulanceLocation ? [emergency.ambulanceLocation.latitude, emergency.ambulanceLocation.longitude] : null);
  const routeOriginRef = useRef(routeOrigin);
  const driverAtDestinationRef = useRef(false);
  routeOriginRef.current = routeOrigin;
  const remainingKm = distanceKm(currentLocation, destination);
  const arrived = Boolean(currentLocation && remainingKm !== null && remainingKm <= 0.1);
  driverAtDestinationRef.current = arrived;
  const announcementKey = `${emergency.emergencyId}:${target}`;
  const announcedKey = useRef("");
  const title = target === "hospital" ? (emergency.hospitalName || "hospital") : "patient";

  const announceArrival = () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    const message = target === "patient"
      ? "You have arrived at the patient's location."
      : "You have arrived at the hospital.";
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-in") && /natural|neural|google/i.test(voice.name))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-in"))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en") && /natural|neural|google/i.test(voice.name))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en-us"))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"))
      || null;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!arrived || announcedKey.current === announcementKey) return;
    announcedKey.current = announcementKey;
    announceArrival();
  }, [arrived, announcementKey, target]);

  const loadDirections = async (force = false) => {
    const origin = routeOriginRef.current;
    if (driverAtDestinationRef.current || !origin || !destination) return;
    const requestKey = `${emergency.emergencyId}:${target}:${destination.join(",")}:${origin.map((coordinate) => Number(coordinate).toFixed(3)).join(",")}`;
    if (!force && lastRequestKeyRef.current === requestKey) return;
    lastRequestKeyRef.current = requestKey;
    setLoading(true);
    setError("");
    const result = await api.getRouteDirections({
      emergencyId: emergency.emergencyId,
      target,
      origin: { latitude: origin[0], longitude: origin[1] },
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setRoute(null);
      if (autoRefresh) setAutoRefreshStopped(true);
    } else {
      setRoute(result);
      setAutoRefreshStopped(false);
    }
  };

  useEffect(() => {
    setAutoRefreshStopped(false);
    setError("");
    setRoute(null);
  }, [emergency.emergencyId, target, destination?.[0], destination?.[1]]);

  useEffect(() => {
    if (!autoRefresh || autoRefreshStopped || !destination || !routeOriginRef.current) return undefined;
    void loadDirections();
    const interval = setInterval(() => void loadDirections(), 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshStopped, emergency.emergencyId, emergency.status, target, destination?.[0], destination?.[1]]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Route directions to {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => { setAutoRefreshStopped(false); void loadDirections(true); }} disabled={loading || !routeOrigin || !destination || arrived}>
            {arrived ? `Reached ${target} location` : loading ? "Getting route…" : autoRefresh ? "Refresh live directions" : "Get turn-by-turn directions"}
          </Button>
          {route && <span className="text-sm text-slate-600">{formatDistance(route.distanceMeters)} · {formatDuration(route.durationSeconds)}</span>}
        </div>
        {target === "hospital" && !destination && <p className="text-sm text-amber-700">The assigned hospital location is not configured yet.</p>}
        {!routeOrigin && <p className="text-sm text-amber-700">Waiting for a live ambulance GPS location before directions can be shown.</p>}
        {autoRefresh && autoRefreshStopped && error && <p className="text-xs text-slate-500">Automatic route retries are paused. Refresh directions after checking the location or connectivity.</p>}
        {autoRefresh && route && <p className="text-xs text-slate-500">Route and turn-by-turn directions refresh as the ambulance location updates.</p>}
        {arrived && (
          <div role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-900">
            You have reached the {target} location. Stop here and update the emergency status when safe.
            <Button type="button" variant="link" className="ml-1 h-auto p-0" onClick={announceArrival}>Repeat announcement</Button>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {route?.aiSummary && <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-950"><strong>Groq route summary:</strong> {route.aiSummary}</div>}
        {route?.steps?.length > 0 && (
          <ol className="max-h-72 list-decimal space-y-2 overflow-y-auto pl-5">
            {route.steps.map((step, index) => <li key={`${step.instruction}-${index}`} className="text-sm"><span>{step.instruction}</span><span className="ml-2 text-slate-500">{formatDistance(step.distanceMeters)}</span></li>)}
          </ol>
        )}
        {route && !route.aiSummary && <p className="text-xs text-slate-500">Showing turn-by-turn steps from OSRM. Groq summary is unavailable; follow the listed route.</p>}
      </CardContent>
    </Card>
  );
}
