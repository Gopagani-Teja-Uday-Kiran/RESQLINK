import React from "react";
import { EmergencyMap } from "./EmergencyMap";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Ambulance, MapPin, Users, HeartPulse } from "lucide-react";

const statusDetails = {
  assigned: { label: "Assigned", tone: "bg-blue-100 text-blue-800" },
  enroute: { label: "En route to patient", tone: "bg-indigo-100 text-indigo-800" },
  arrived: { label: "At patient pickup", tone: "bg-amber-100 text-amber-800" },
  transporting: { label: "Transporting patient", tone: "bg-orange-100 text-orange-800" },
  delivered: { label: "At hospital", tone: "bg-teal-100 text-teal-800" },
};

function statusFor(ambulance) {
  return statusDetails[ambulance.emergencyStatus] || (ambulance.available
    ? { label: "Available", tone: "bg-green-100 text-green-800" }
    : { label: "Busy", tone: "bg-slate-100 text-slate-700" });
}

export function HospitalLivePanel({ profile, ambulances = [] }) {
  const tracked = ambulances.filter((item) => item.location);
  const workingCount = ambulances.filter((item) => !item.available).length;
  const patientCount = ambulances.filter((item) => item.hasPatient).length;
  const atPatientCount = ambulances.filter((item) => item.emergencyStatus === "arrived").length;
  const markers = tracked.flatMap((item) => [
    { position: [Number(item.location.latitude), Number(item.location.longitude)], label: `${item.ambulanceNumber} - ${item.hospitalName}`, type: "ambulance", routeKey: item.emergencyId, routeTarget: item.routeTarget },
    ...(item.patientLocation ? [{ position: [Number(item.patientLocation.latitude), Number(item.patientLocation.longitude)], label: `Patient - ${item.patientName || "Patient"}`, type: "patient", routeKey: item.emergencyId }] : []),
    ...(item.hospitalLocation ? [{ position: [Number(item.hospitalLocation.latitude), Number(item.hospitalLocation.longitude)], label: `Hospital - ${item.hospitalName}`, type: "hospital", routeKey: item.emergencyId }] : []),
  ]);
  if (profile?.latitude != null && profile?.longitude != null) {
    markers.push({ position: [Number(profile.latitude), Number(profile.longitude)], label: profile.hospitalName || "Hospital", type: "hospital" });
  }

  return <Card className="mb-8 overflow-hidden border-green-100 shadow-md dark:border-green-900/40 dark:bg-gray-900">
    <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-teal-50 dark:border-green-900/40 dark:from-green-950/30 dark:to-teal-950/20">
      <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white"><Ambulance className="h-5 w-5 text-green-700" />Live ambulance tracking</CardTitle>
    </CardHeader>
    <CardContent className="space-y-5 p-4 sm:p-6">
      <p className="text-sm text-slate-600 dark:text-gray-400">See each ambulance’s live position and driving route to its current destination. Route and status data refresh automatically.</p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950"><Users className="h-5 w-5 text-slate-500" /><div><p className="text-xs text-slate-500">Hospital fleet</p><p className="text-lg font-bold text-slate-900 dark:text-white">{ambulances.length}</p></div></div>
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30"><MapPin className="h-5 w-5 text-blue-700" /><div><p className="text-xs text-blue-800 dark:text-blue-300">Visible on map</p><p className="text-lg font-bold text-blue-900 dark:text-blue-100">{tracked.length}</p></div></div>
        <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30"><Ambulance className="h-5 w-5 text-orange-700" /><div><p className="text-xs text-orange-800 dark:text-orange-300">Working on cases</p><p className="text-lg font-bold text-orange-900 dark:text-orange-100">{workingCount}</p></div></div>
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30"><HeartPulse className="h-5 w-5 text-red-700" /><div><p className="text-xs text-red-800 dark:text-red-300">Patient onboard</p><p className="text-lg font-bold text-red-900 dark:text-red-100">{patientCount}{atPatientCount > 0 ? <span className="ml-1 text-xs font-medium">({atPatientCount} at pickup)</span> : null}</p></div></div>
      </div>

      {tracked.length > 0 ? <div className="h-80 overflow-hidden rounded-xl border border-slate-200 dark:border-gray-700">
        <EmergencyMap center={[Number(tracked[0].location.latitude), Number(tracked[0].location.longitude)]} markers={markers} showRoutes />
      </div> : ambulances.length > 0 ? <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        The hospital has {ambulances.length} registered ambulance{ambulances.length === 1 ? "" : "s"}, but none has shared GPS yet. Enable location access on the ambulance dashboard to place them on this map.
      </div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">No ambulances are registered to this hospital yet.</div>}

      {ambulances.length > 0 && <div className="grid gap-3 md:grid-cols-2">{ambulances.map((item) => {
        const status = statusFor(item);
        return <div key={item.ambulanceId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
          <div><p className="font-semibold text-slate-900 dark:text-white">{item.ambulanceNumber} <span className="font-normal text-slate-500">- {item.driverName}</span></p><p className="mt-1 text-xs text-slate-500">{item.hospitalName} {item.location ? `| ${Number(item.location.latitude).toFixed(5)}, ${Number(item.location.longitude).toFixed(5)}` : "| Waiting for GPS"}</p>{item.patientName && <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">Assigned patient: {item.patientName}</p>}</div>
          <div className="flex flex-col items-end gap-1"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span><span className="text-xs font-medium text-slate-600 dark:text-gray-300">Patient onboard: {item.hasPatient ? "Yes" : "No"}</span></div>
        </div>;
      })}</div>}
    </CardContent>
  </Card>;
}
