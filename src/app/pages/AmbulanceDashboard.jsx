import React from 'react';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Ambulance,
  LogOut,
  CheckCircle,
  MapPin,
  Navigation,
  User,
  Phone,
  Clock,
  AlertTriangle,
  Building2,
  RefreshCw
} from "lucide-react";
import { EmergencyMap } from "../components/EmergencyMap";
import { auth } from "../utils/auth";
import { api } from "../utils/api";
import { toast } from "sonner";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { InAppNotifications } from "../components/InAppNotifications";
import { RouteGuidance } from "../components/RouteGuidance";
import { distanceKm } from "../utils/geo";

const googleMapsLocationUrl = (latitude, longitude) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

const googleMapsDirectionsUrl = (latitude, longitude, currentLocation) => {
  const origin = currentLocation
    ? `&origin=${encodeURIComponent(`${currentLocation[0]},${currentLocation[1]}`)}`
    : "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}${origin}&travelmode=driving`;
};

const geolocationErrorMessage = (error) => {
  if (error?.code === 1) return "Location access is blocked. Allow location permission in browser settings.";
  if (error?.code === 2) return "The device could not determine its GPS location. Check location services and signal.";
  if (error?.code === 3) return "GPS fix timed out. Keeping the last shared location while waiting for a fresh fix.";
  return error?.message || "Unable to read the ambulance GPS location.";
};

function AmbulanceDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [tripHistory, setTripHistory] = useState({ total: 0, trips: [] });
  const [assignedEmergency, setAssignedEmergency] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationUpdatedAt, setLocationUpdatedAt] = useState(null);
  const latestLocationRef = useRef(null);
  const lastGpsFixAtRef = useRef(0);
  const lastLocationShareAtRef = useRef(0);
  const nextGpsFallbackAtRef = useRef(0);
  const locationPublishInProgressRef = useRef(false);
  const locationReadInProgressRef = useRef(false);
  const [routeRefreshKey, setRouteRefreshKey] = useState(0);
  const [emergencyLoadError, setEmergencyLoadError] = useState("");
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  useEffect(() => {
    let interval;
    let locationWatchId;
    let cancelled = false;
    (async () => {
      const { data } = await auth.getUser();
      const role = data?.user?.user_metadata?.role;
      if (role !== "ambulance") {
        navigate(role === "hospital" ? "/hospital" : role === "patient" ? "/patient" : "/login", { replace: true });
        return;
      }
      if (cancelled) return;
      await Promise.all([loadProfile(), loadEmergencies(), loadTripHistory()]);
      nextGpsFallbackAtRef.current = Date.now() + 15000;
      if (navigator.geolocation?.watchPosition) {
        locationWatchId = navigator.geolocation.watchPosition(
          (position) => {
            const coordinates = [position.coords.latitude, position.coords.longitude];
            latestLocationRef.current = coordinates;
            lastGpsFixAtRef.current = Date.now();
            void publishLocation(coordinates);
          },
          (error) => {
            setLocationError(geolocationErrorMessage(error));
            nextGpsFallbackAtRef.current = Date.now() + 10000;
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
      } else {
        setLocationError("This browser does not support live GPS tracking.");
      }
      interval = setInterval(() => {
        loadEmergencies();
        const now = Date.now();
        if (now >= nextGpsFallbackAtRef.current && now - lastGpsFixAtRef.current > 30000) {
          nextGpsFallbackAtRef.current = now + 30000;
          void updateLocation();
        }
      }, 5e3);
    })();
    return () => { cancelled = true; clearInterval(interval); if (locationWatchId !== undefined) navigator.geolocation?.clearWatch(locationWatchId); };
  }, []);
  const publishLocation = async (coordinates) => {
    setCurrentLocation(coordinates);
    if (locationPublishInProgressRef.current || Date.now() - lastLocationShareAtRef.current < 5000) return coordinates;
    locationPublishInProgressRef.current = true;
    lastLocationShareAtRef.current = Date.now();
    try {
      const result = await api.updateLocation({ latitude: coordinates[0], longitude: coordinates[1] });
      if (result.error) {
        setLocationError(`Could not share GPS with dispatch: ${result.error}`);
      } else {
        setLocationUpdatedAt(new Date());
        setLocationError("");
      }
    } catch (error) {
      setLocationError(error.message || "Could not share GPS with dispatch.");
    } finally {
      locationPublishInProgressRef.current = false;
    }
    return coordinates;
  };
  const updateLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("This browser does not provide GPS location.");
      return null;
    }
    if (latestLocationRef.current && Date.now() - lastGpsFixAtRef.current <= 30000) {
      return publishLocation(latestLocationRef.current);
    }
    if (locationReadInProgressRef.current) return null;
    locationReadInProgressRef.current = true;
    return new Promise((resolve) => navigator.geolocation.getCurrentPosition(async (position) => {
      const coordinates = [position.coords.latitude, position.coords.longitude];
      latestLocationRef.current = coordinates;
      lastGpsFixAtRef.current = Date.now();
      locationReadInProgressRef.current = false;
      await publishLocation(coordinates);
      resolve(coordinates);
    }, (error) => {
      locationReadInProgressRef.current = false;
      nextGpsFallbackAtRef.current = Date.now() + 30000;
      setLocationError(geolocationErrorMessage(error));
      resolve(null);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }));
  };
  const loadProfile = async () => {
    try {
      const { data: userData } = await auth.getUser();
      if (userData?.user?.user_metadata) {
        setProfile({
          userId: userData.user.id,
          // Add userId from auth
          name: userData.user.user_metadata.name,
          email: userData.user.email,
          ambulanceNumber: userData.user.user_metadata.ambulanceNumber,
          phone: userData.user.user_metadata.phone,
          role: userData.user.user_metadata.role,
          available: true
          // default to available
        });
      }
      const result = await api.getProfile();
      if (result.profile && !result.error) {
        setProfile(result.profile);
      }
    } catch (error) {
    }
  };
  const loadTripHistory = async () => {
    const result = await api.getAmbulanceTripHistory();
    if (!result.error) setTripHistory({ total: result.total || 0, trips: result.trips || [] });
  };
  const loadEmergencies = async () => {
    try {
      const result = await api.getAllEmergencies();
      if (result.error) {
        setEmergencyLoadError(result.error);
      } else if (result.emergencies) {
        setEmergencyLoadError("");
        setEmergencies(result.emergencies);
        const assigned = result.emergencies.find(
          (e) => ["assigned", "enroute", "arrived", "transporting", "delivered"].includes(e.status)
        );
        setAssignedEmergency(assigned || null);
      }
    } catch (error) {
      setEmergencyLoadError(error.message || "Unable to load emergency requests.");
    } finally {
      setEmergenciesLoading(false);
    }
  };
  const handleAcceptEmergency = async (emergencyId) => {
    try {
      void updateLocation();
      const result = await api.acceptEmergency(emergencyId);
      if (result.error) {
        toast.error("Failed to accept emergency: " + result.error);
      } else {
        if (result.emergency) {
          setAssignedEmergency(result.emergency);
          setEmergencies((current) => current.map((item) => item.emergencyId === emergencyId ? result.emergency : item));
        }
        window.dispatchEvent(new Event("resqlink:notifications-refresh"));
        toast.success("Emergency accepted! Navigate to patient location.");
        await loadEmergencies();
      }
    } catch (error) {
      toast.error("Error accepting emergency: " + error.message);
    }
  };
  const handleUpdateStatus = async (status) => {
    if (!assignedEmergency) return;
    try {
      const result = await api.updateEmergencyStatus({
        emergencyId: assignedEmergency.emergencyId,
        status,
        ...(currentLocation ? { ambulanceLocation: { latitude: currentLocation[0], longitude: currentLocation[1] } } : {})
      });
      if (result.error) {
        toast.error("Failed to update status: " + result.error);
      } else {
        if (result.emergency) setAssignedEmergency(result.emergency);
        if (status === "completed") {
          toast.success("\u2705 Emergency completed! You are now available for new requests.");
        } else {
          toast.success("Status updated successfully!");
        }
        loadEmergencies();
        loadProfile();
        if (status === "delivered") loadTripHistory();
      }
    } catch (error) {
      toast.error("Error updating status: " + error.message);
    }
  };
  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };
  const pendingEmergencies = assignedEmergency ? [] : emergencies.filter((e) => e.status === "pending" && !e.ambulanceId);
  const getProgressValue = (status) => {
    switch (status) {
      case "assigned":
        return 15;
      case "enroute":
        return 30;
      case "arrived":
        return 50;
      case "transporting":
        return 70;
      case "delivered":
        return 90;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/80 backdrop-blur-sm dark:border-blue-900/30 dark:bg-gray-950/90">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Logo size="sm" variant="ambulance" showText />
            <div className="flex items-center gap-4"><ThemeToggle /><InAppNotifications unreadOnly />
            <Button variant="outline" size="sm" onClick={() => navigate("/ambulance/profile")}>Driver Profile</Button>
            <div className="text-right"><p className="text-sm font-semibold">{profile?.ambulanceNumber}</p><p className="text-xs text-gray-600 dark:text-gray-400">{profile?.driverName}</p></div>
            <Badge className={profile?.available === false ? "bg-red-500" : "bg-green-500"}>{profile?.available === false ? "On Duty" : "Available"}</Badge>
            <Button variant="ghost" size="icon" aria-label="Log out" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-6 py-8">
        {assignedEmergency && <Card className="border-blue-200 bg-white/80 shadow-xl dark:border-blue-800/50 dark:bg-gray-800/80">
          <CardHeader><CardTitle className="flex items-center gap-2"><span className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />Current Assignment</CardTitle><CardDescription>Navigate to the {["arrived", "transporting", "delivered"].includes(assignedEmergency.status) ? "hospital" : "patient"} location.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div><div className="mb-2 flex items-center justify-between"><p className="font-semibold">Emergency Status</p><Badge>{assignedEmergency.status}</Badge></div><Progress value={getProgressValue(assignedEmergency.status)} /></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Emergency Type</p><p className="text-lg font-semibold">{assignedEmergency.emergencyType}</p><Badge className="mt-2">{assignedEmergency.severity}</Badge></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Patient</p><p className="font-semibold">{assignedEmergency.patientName}</p><p>Blood: {assignedEmergency.bloodGroup || "Not provided"}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Contact</p><p className="font-semibold">{assignedEmergency.patientPhone || "Not provided"}</p>{assignedEmergency.patientPhone && <Button className="mt-2" size="sm" variant="outline" onClick={() => window.open("tel:" + assignedEmergency.patientPhone)}>Call Patient</Button>}</CardContent></Card>
            </div>
            {(assignedEmergency.allergies?.length > 0 || assignedEmergency.medicalConditions?.length > 0) && <div className="rounded border border-red-200 bg-red-50 p-4"><p className="font-semibold"><AlertTriangle className="mr-2 inline h-4 w-4" />Medical Information</p>{assignedEmergency.allergies?.length > 0 && <p>Allergies: {assignedEmergency.allergies.join(", ")}</p>}{assignedEmergency.medicalConditions?.length > 0 && <p>Conditions: {assignedEmergency.medicalConditions.join(", ")}</p>}</div>}
            {assignedEmergency.notes && <div className="rounded bg-yellow-50 p-4"><p className="font-semibold">Additional Notes</p><p>{assignedEmergency.notes}</p></div>}
            <div className="flex flex-wrap gap-3">
              {assignedEmergency.status === "assigned" && <Button onClick={() => handleUpdateStatus("enroute")}><Navigation className="mr-2 h-4 w-4" />Enroute to Patient</Button>}
              {assignedEmergency.status === "transporting" && <Button onClick={() => handleUpdateStatus("delivered")}><Building2 className="mr-2 h-4 w-4" />Arrived at Hospital</Button>}
              {assignedEmergency.status === "delivered" && <Button onClick={() => handleUpdateStatus("completed")}><CheckCircle className="mr-2 h-4 w-4" />Complete Handover</Button>}
              <Button variant="outline" onClick={() => navigate("/tracking/" + assignedEmergency.emergencyId)}><MapPin className="mr-2 h-4 w-4" />View Full Map</Button>
            </div>
            {assignedEmergency.status === "enroute" && <p className="text-sm text-blue-700" role="status">Arrived status updates automatically when GPS is within 100 m of the patient location.</p>}
            {assignedEmergency.status === "arrived" && <p className="text-sm text-blue-700" role="status">Transporting status updates automatically when GPS detects departure from the 100 m pickup area toward the assigned hospital.</p>}
            <section aria-label="Ambulance journey map" className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Route Map</p>
                <Button type="button" size="sm" onClick={() => setRouteRefreshKey((k) => k + 1)}>
                  <RefreshCw className="mr-2 h-4 w-4" />Refresh Route
                </Button>
              </div>
              {locationError && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">Live GPS issue: {locationError}</p>}
              <p className="text-xs text-gray-500" role="status">{locationUpdatedAt ? `Location last shared ${locationUpdatedAt.toLocaleTimeString()}${Date.now() - locationUpdatedAt.getTime() > 30000 ? " (may be stale)" : ""}` : "Waiting for GPS location to be shared with dispatch."}</p>
              {(assignedEmergency.hospitalId || assignedEmergency.hospitalName) && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Assigned hospital</p><p className="text-lg font-semibold">{assignedEmergency.hospitalName || "Hospital"}</p><p className="text-sm text-gray-700 dark:text-gray-300">{assignedEmergency.hospitalAddress || "Hospital address not available"}</p>{assignedEmergency.hospitalLocation ? <p className="mt-1 text-xs text-gray-500">{Number(assignedEmergency.hospitalLocation.latitude).toFixed(6)}, {Number(assignedEmergency.hospitalLocation.longitude).toFixed(6)}</p> : <p className="mt-1 text-xs text-amber-700">Hospital map location is not configured.</p>}</div>}
              <div className="h-[70vh] min-h-[480px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"><EmergencyMap key={routeRefreshKey} center={currentLocation || [Number(assignedEmergency.latitude) || 0, Number(assignedEmergency.longitude) || 0]} markers={[{ position: currentLocation || [Number(assignedEmergency.latitude) || 0, Number(assignedEmergency.longitude) || 0], label: currentLocation ? "Your Live GPS Location" : "Ambulance (no GPS)", type: "ambulance" }, { position: [Number(assignedEmergency.latitude) || 0, Number(assignedEmergency.longitude) || 0], label: "Patient Location", type: "patient" }, ...(["arrived", "transporting", "delivered"].includes(assignedEmergency.status) && assignedEmergency.hospitalLocation ? [{ position: [Number(assignedEmergency.hospitalLocation.latitude), Number(assignedEmergency.hospitalLocation.longitude)], label: `${assignedEmergency.hospitalName || "Assigned Hospital"}${assignedEmergency.hospitalAddress ? ` — ${assignedEmergency.hospitalAddress}` : ""}`, type: "hospital" }] : [])]} routeTarget={["arrived", "transporting", "delivered"].includes(assignedEmergency.status) ? "hospital" : "patient"} showRoutes followMarkerType="ambulance" /></div>
            </section>
            {["arrived", "transporting", "delivered"].includes(assignedEmergency.status) ? (assignedEmergency.hospitalLocation ? <div className="flex flex-wrap gap-2"><a className="rounded bg-blue-600 px-4 py-2 text-white" target="_blank" rel="noreferrer" href={googleMapsLocationUrl(assignedEmergency.hospitalLocation.latitude, assignedEmergency.hospitalLocation.longitude)}>Show hospital location in Google Maps</a><a className="rounded border border-blue-600 px-4 py-2 text-blue-700" target="_blank" rel="noreferrer" href={googleMapsDirectionsUrl(assignedEmergency.hospitalLocation.latitude, assignedEmergency.hospitalLocation.longitude, currentLocation)}>Get directions to hospital</a></div> : <p className="text-amber-700">Hospital location is not configured. Contact dispatch.</p>) : <div className="flex flex-wrap gap-2"><a className="rounded bg-blue-600 px-4 py-2 text-white" target="_blank" rel="noreferrer" href={googleMapsLocationUrl(assignedEmergency.latitude, assignedEmergency.longitude)}>Show patient location in Google Maps</a><a className="rounded border border-blue-600 px-4 py-2 text-blue-700" target="_blank" rel="noreferrer" href={googleMapsDirectionsUrl(assignedEmergency.latitude, assignedEmergency.longitude, currentLocation)}>Get directions to patient</a></div>}
            <RouteGuidance emergency={assignedEmergency} currentLocation={currentLocation} autoRefresh />
          </CardContent>
        </Card>}

        <Card className="border-emerald-100 bg-white/80 shadow-xl dark:border-emerald-900/40 dark:bg-gray-800/80">
          <CardHeader><CardTitle>Hospital Trip History</CardTitle><CardDescription>Successful hospital arrivals recorded for this ambulance.</CardDescription></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[180px_1fr]">
            <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30"><p className="text-sm text-emerald-800 dark:text-emerald-300">Successful hospital trips</p><p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-200">{tripHistory.total}</p></div>
            {tripHistory.trips.length === 0 ? <p className="self-center text-sm text-gray-500">No hospital trips recorded yet.</p> : <ol className="divide-y divide-gray-100 dark:divide-gray-700">{tripHistory.trips.slice(0, 5).map((trip) => <li key={trip.emergencyId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"><div><p className="font-medium">{trip.hospitalName || "Hospital"}</p><p className="text-sm text-gray-500">{trip.hospitalAddress || trip.emergencyType || "Emergency trip"}</p></div><time className="text-xs text-gray-500">{new Date(trip.reachedAt).toLocaleString()}</time></li>)}</ol>}
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white/80 shadow-xl dark:border-gray-700 dark:bg-gray-800/80">
          <CardHeader><CardTitle className="flex items-center gap-2"><Ambulance className="h-5 w-5 text-blue-600" />Available Emergency Requests</CardTitle><CardDescription>{assignedEmergency ? "Complete your current assignment before accepting new requests" : "Accept emergency requests in your area"}</CardDescription></CardHeader>
          <CardContent>
            {emergenciesLoading ? <p className="py-8 text-center" role="status">Loading emergency requests...</p> : emergencyLoadError ? <div className="rounded border border-amber-300 bg-amber-50 p-4" role="alert"><p className="font-semibold">Emergency requests could not be loaded</p><p>{emergencyLoadError}</p><Button className="mt-3" variant="outline" onClick={loadEmergencies}>Try again</Button></div> : pendingEmergencies.length === 0 ? <div className="py-8 text-center"><CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" /><p>{assignedEmergency ? "Complete your current assignment to see other requests." : "No new requests from the last 2 hours."}</p><p className="text-sm text-gray-500">{assignedEmergency ? "New requests will be available when you are free." : "Requests older than 2 hours remain available for admin review."}</p></div> : <div className="space-y-3">{pendingEmergencies.map((emergency) => <div key={emergency.emergencyId} data-emergency-id={emergency.emergencyId} className="rounded-lg border border-pink-100 bg-gradient-to-r from-pink-50 to-red-50 p-4 dark:border-pink-900/30 dark:from-pink-900/10 dark:to-red-900/10">
              <div className="mb-3 flex items-center gap-2"><Badge className="bg-yellow-500">New Request</Badge><Badge variant="outline">{emergency.severity}</Badge><Clock className="h-3 w-3" /><span className="text-sm">{new Date(emergency.createdAt).toLocaleTimeString()}</span></div>
              <h3 className="text-lg font-semibold">{emergency.emergencyType}</h3><p className="mb-3 text-sm text-gray-600">{emergency.notes || "Emergency assistance requested."}</p>
              <div className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-3"><div><p className="text-xs text-gray-500">Patient</p><p className="font-semibold">{emergency.patientName || "Patient"}</p></div><div><p className="text-xs text-gray-500">Blood Group</p><p className="font-semibold">{emergency.bloodGroup || "Not provided"}</p></div><div><p className="text-xs text-gray-500">Distance from ambulance</p><p className="font-semibold text-blue-600">{currentLocation ? distanceKm(currentLocation, [Number(emergency.latitude), Number(emergency.longitude)]).toFixed(1) + " km" : "Enable GPS to see distance"}</p></div></div>
              <div className="flex gap-2"><Button onClick={() => handleAcceptEmergency(emergency.emergencyId)} disabled={!!assignedEmergency} className="bg-green-600"><CheckCircle className="mr-2 h-4 w-4" />Accept</Button><Button variant="outline" onClick={() => navigate("/tracking/" + emergency.emergencyId)}><MapPin className="mr-2 h-4 w-4" />View Location</Button></div>
            </div>)}</div>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
export {
  AmbulanceDashboard
};
