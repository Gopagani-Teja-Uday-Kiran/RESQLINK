import React from "react";
import { EmergencyMap } from "./EmergencyMap";

function HospitalLocationPicker({ value, status, message, onMapClick = null }) {
  const center = value ? [value.latitude, value.longitude] : [17.3850, 78.4867];
  const markers = value
    ? [{ position: center, label: value.label || "Hospital address match", type: "hospital" }]
    : [];

  return <section className="space-y-2" aria-label="Hospital address map preview">
    <div>
      <p className="font-medium">Hospital map location</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">A pin will appear automatically when a match is found. Map data may only identify the nearby area; click the map to set the exact hospital entrance.</p>
    </div>
    {value?.approximate && <p className="text-sm text-amber-700 dark:text-amber-400" role="alert">
      Nearby map match, not a confirmed hospital entrance. Click the exact entrance on the map before creating the account.
    </p>}
    {!value && <p className={`text-xs ${status === "error" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`} role={status === "error" ? "alert" : "status"}>
      {message || (status === "loading" ? "Finding this address on the map…" : "Enter a full address, name, Plus Code, or latitude,longitude. You can also click the map to place the exact pin.")}
    </p>}
    <div className="h-72 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" id="hospital-location-map">
      <EmergencyMap center={center} markers={markers} showDistance={false} zoom={value ? 16 : 5} onMapClick={onMapClick} />
    </div>
    {value && <p className={`text-sm ${value.approximate ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"}`} role={value.approximate ? "alert" : "status"}>
      {value.approximate
        ? `Nearby map match: ${value.label || "approximate location"} (${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}).`
        : `Map pin selected: ${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}. ${message}`}
    </p>}
    {value && <p className="text-xs text-gray-500">{value.attribution || "Address location match"}</p>}
  </section>;
}

export { HospitalLocationPicker };
