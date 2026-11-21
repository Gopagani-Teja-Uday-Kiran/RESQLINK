import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  LogOut,
  User,
  MapPin,
  AlertCircle,
  Phone,
  Shield,
  ShieldOff,
  Droplet,
  Pill,
  Activity,
  History,
  MessageSquare
} from "lucide-react";
import { EmergencyMap } from "../components/EmergencyMap";
import { auth } from "../utils/auth";
import { api } from "../utils/api";
import { toast } from "sonner";
import { ThemeToggle } from "../components/ThemeToggle";
import { FallDetectionAlert } from "../components/FallDetectionAlert";
import { useFallDetection } from "../hooks/useFallDetection";
import { InAppNotifications } from "../components/InAppNotifications";
import { EmergencyContactsManager } from "../components/EmergencyContactsManager";
import { EmailConfigStatus } from "../components/EmailConfigStatus";
import { Logo } from "../components/Logo";
function PatientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const {
    isFallDetected,
    countdown,
    cancelFallDetection
  } = useFallDetection({
    enabled: fallDetectionEnabled,
    onFallDetected: () => {
      toast.error("\u{1F6A8} Fall detected! Emergency will be triggered in 3 seconds...");
    },
    onCountdownComplete: () => {
      handleSOSClick();
      toast.success("Emergency SOS activated automatically due to fall detection");
    }
  });
  useEffect(() => {
    let interval;
    let cancelled = false;
    (async () => {
      const { data } = await auth.getUser();
      const role = data?.user?.user_metadata?.role;
      if (role !== "patient") {
        navigate(role === "hospital" ? "/hospital" : role === "ambulance" ? "/ambulance" : "/login", { replace: true });
        return;
      }
      if (cancelled) return;
      await Promise.all([loadProfile(), loadEmergencies()]);
      getCurrentLocation();
      interval = setInterval(loadEmergencies, 5e3);
    })();
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  useEffect(() => {
    if (!activeEmergency) return;
    const locationInterval = setInterval(() => {
      getCurrentLocation();
    }, 1e4);
    return () => clearInterval(locationInterval);
  }, [activeEmergency]);
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Geolocation error:", error.message);
        },
        {
          enableHighAccuracy: true,
          // Enable high accuracy for better GPS
          timeout: 1e4,
          maximumAge: 5e3
          // Allow cached position up to 5 seconds old
        }
      );
    }
  };
  const loadProfile = async () => {
    try {
      const { data: userData } = await auth.getUser();
      if (userData?.user?.user_metadata) {
        setProfile({
          name: userData.user.user_metadata.name,
          email: userData.user.email,
          phone: userData.user.user_metadata.phone,
          role: userData.user.user_metadata.role
        });
      }
      const result = await api.getProfile();
      if (result.profile && !result.error) {
        setProfile(result.profile);
      }
    } catch (error) {
    }
  };
  const loadEmergencies = async () => {
    try {
      const result = await api.getUserEmergencies();
      if (result.emergencies && !result.error) {
        setEmergencies(result.emergencies);
        const active = result.emergencies.find(
          (e) => ["pending", "assigned", "enroute", "arrived", "transporting", "delivered"].includes(e.status)
        );
        setActiveEmergency(active || null);
      }
    } catch (error) {
    }
  };
  const handleSOSClick = async () => {
    if (activeEmergency) return;
    setLoading(true);
    try {
      if (!navigator.geolocation) throw new Error("This device does not provide location access.");
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }));
      const location = [position.coords.latitude, position.coords.longitude];
      setUserLocation(location);
      const result = await api.createEmergency({ latitude: location[0], longitude: location[1], emergencyType: "medical-emergency", severity: "critical", notes: "Emergency SOS activated" });
      if (result.error) {
        toast.error("Failed to create emergency: " + result.error);
      } else {
        toast.success("?? Emergency activated! Help is on the way.");
        if (result.emergency?.emergencyId) {
          const notifyResult = await api.notifyEmergencyContacts(result.emergency.emergencyId);
          if (notifyResult.success && notifyResult.notified > 0) toast.success(`${notifyResult.notified} emergency contact alert(s) delivered`);
          const trackingUrl = `${window.location.origin}/public-tracking/${result.emergency.emergencyId}`;
          console.log("Share this tracking link with your contacts:", trackingUrl);
          loadEmergencies();
        }
      }
    } catch (error) {
      toast.error(error.code === 1 ? "Location permission is required to send an emergency alert." : "Could not get your current location: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "assigned":
        return "bg-blue-500";
      case "enroute":
        return "bg-purple-500";
      case "arrived":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };
  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  const getProgressValue = (status) => {
    switch (status) {
      case "pending":
        return 20;
      case "assigned":
        return 40;
      case "enroute":
        return 60;
      case "arrived":
        return 80;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" }, /* @__PURE__ */ React.createElement(
    FallDetectionAlert,
    {
      isVisible: isFallDetected,
      countdown,
      onCancel: cancelFallDetection
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10 dark:bg-gray-950/90 dark:border-orange-900/30" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-4 flex items-center justify-between" }, /* @__PURE__ */ React.createElement(Logo, { size: "sm", variant: "patient", showText: true }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(ThemeToggle, null), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "ghost",
      size: "icon",
      onClick: () => {
        setFallDetectionEnabled(!fallDetectionEnabled);
        toast.success(
          fallDetectionEnabled ? "\u{1F6E1}\uFE0F Fall Detection disabled" : "\u{1F6E1}\uFE0F Fall Detection enabled - Shake phone to test!"
        );
      },
      title: fallDetectionEnabled ? "Fall Detection enabled" : "Enable Fall Detection"
    },
    fallDetectionEnabled ? /* @__PURE__ */ React.createElement(Shield, { className: "w-5 h-5 text-green-600 dark:text-green-400" }) : /* @__PURE__ */ React.createElement(ShieldOff, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" })
  ), /* @__PURE__ */ React.createElement(InAppNotifications, null), /* @__PURE__ */ React.createElement("div", { className: "text-right mr-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold dark:text-gray-100" }, profile?.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, profile?.email)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "icon", onClick: handleLogout }, /* @__PURE__ */ React.createElement(LogOut, { className: "w-4 h-4" }))))), /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-8" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100 dark:bg-gray-900/90 dark:border-pink-900/40" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-8" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold mb-2 dark:text-gray-100" }, "Emergency SOS"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-400 mb-6" }, "Press button in case of emergency"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSOSClick,
      className: "w-48 h-48 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-2xl transform hover:scale-105 transition-all duration-200 mx-auto flex items-center justify-center group relative overflow-hidden",
      disabled: !!activeEmergency
    },
    /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-white/20 animate-ping rounded-full" }),
    /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-24 h-24 text-white relative z-10" })
  ), activeEmergency && /* @__PURE__ */ React.createElement("div", { className: "mt-6" }, /* @__PURE__ */ React.createElement(Badge, { className: "bg-green-500 text-white" }, "Emergency Active"))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100 dark:bg-gray-900/90 dark:border-pink-900/40" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(User, { className: "w-5 h-5 text-pink-600 dark:text-pink-400" }), "Medical Profile")), /* @__PURE__ */ React.createElement(CardContent, { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-red-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Droplet, { className: "w-5 h-5 text-red-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Blood Group"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-100" }, profile?.bloodGroup || "Not set"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0" }, /* @__PURE__ */ React.createElement(Pill, { className: "w-5 h-5 text-orange-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Allergies"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 mt-1" }, profile?.allergies && profile.allergies.length > 0 ? profile.allergies.map((allergy, idx) => /* @__PURE__ */ React.createElement(Badge, { key: idx, variant: "outline", className: "text-xs" }, allergy)) : /* @__PURE__ */ React.createElement("p", { className: "text-sm dark:text-gray-300" }, "None")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0" }, /* @__PURE__ */ React.createElement(Activity, { className: "w-5 h-5 text-blue-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Medical Conditions"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1 mt-1" }, profile?.medicalConditions && profile.medicalConditions.length > 0 ? profile.medicalConditions.map((condition, idx) => /* @__PURE__ */ React.createElement(Badge, { key: idx, variant: "outline", className: "text-xs" }, condition)) : /* @__PURE__ */ React.createElement("p", { className: "text-sm dark:text-gray-300" }, "None")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-green-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Phone, { className: "w-5 h-5 text-green-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Contact"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-100" }, profile?.phone || "Not set"))))), /* @__PURE__ */ React.createElement(EmergencyContactsManager, null), /* @__PURE__ */ React.createElement(EmailConfigStatus, null)), /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2 space-y-6" }, activeEmergency && /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-gradient-to-r from-pink-500/10 to-red-500/10 shadow-xl border-pink-200" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-3 h-3 bg-red-500 rounded-full animate-pulse" }), "Active Emergency"), /* @__PURE__ */ React.createElement(CardDescription, null, "Help is on the way!")), /* @__PURE__ */ React.createElement(CardContent, { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Emergency Type"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-100" }, activeEmergency.emergencyType)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Severity"), /* @__PURE__ */ React.createElement(Badge, { className: activeEmergency.severity === "critical" ? "bg-red-500" : activeEmergency.severity === "high" ? "bg-orange-500" : "bg-yellow-500" }, activeEmergency.severity))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2" }, "Status"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement(Badge, { className: getStatusColor(activeEmergency.status) }, getStatusLabel(activeEmergency.status)), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-600 dark:text-gray-400" }, new Date(activeEmergency.createdAt).toLocaleTimeString())), /* @__PURE__ */ React.createElement(Progress, { value: getProgressValue(activeEmergency.status), className: "h-2" })), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      size: "sm",
      onClick: () => navigate(`/tracking/${activeEmergency.emergencyId}`),
      className: "bg-gradient-to-r from-pink-500 to-red-500"
    },
    /* @__PURE__ */ React.createElement(MapPin, { className: "w-4 h-4 mr-2" }),
    "Track Ambulance"
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      size: "sm",
      variant: "outline",
      onClick: () => navigate(`/chat/${activeEmergency.emergencyId}`)
    },
    /* @__PURE__ */ React.createElement(MessageSquare, { className: "w-4 h-4 mr-2" }),
    "Chat"
  )))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100 dark:bg-gray-900/90 dark:border-pink-900/40" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-5 h-5 text-pink-600 dark:text-pink-400" }), "Live Tracking")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "h-96 rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement(
    EmergencyMap,
    {
      center: userLocation || [0, 0],
      markers: [
        ...(activeEmergency ? [{ position: [Number(activeEmergency.latitude), Number(activeEmergency.longitude)], label: "Patient pickup location", type: "patient" }] : userLocation ? [{ position: userLocation, label: "Your Location", type: "patient" }] : []),
        ...activeEmergency?.ambulanceLocation ? [{
          position: [
            activeEmergency.ambulanceLocation.latitude,
            activeEmergency.ambulanceLocation.longitude
          ],
          label: "Ambulance",
          type: "ambulance"
        }] : [],
        ...activeEmergency?.hospitalLocation && ["arrived", "transporting", "delivered"].includes(activeEmergency.status) ? [{
          position: [activeEmergency.hospitalLocation.latitude, activeEmergency.hospitalLocation.longitude],
          label: activeEmergency.hospitalName || "Assigned hospital",
          type: "hospital"
        }] : []
      ],
      showRadius: true,
      routeTarget: ["arrived", "transporting", "delivered"].includes(activeEmergency?.status) ? "hospital" : "patient",
      showRoutes: !!activeEmergency?.ambulanceLocation
    }
  )))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100 dark:bg-gray-900/90 dark:border-pink-900/40" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(History, { className: "w-5 h-5 text-pink-600 dark:text-pink-400" }), "Emergency History")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, emergencies.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-400 text-center py-4" }, "No emergency history") : emergencies.slice(0, 5).map((emergency) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: emergency.emergencyId,
      className: "flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `w-2 h-2 rounded-full ${getStatusColor(emergency.status)}` }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-sm dark:text-gray-100" }, emergency.emergencyType), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, new Date(emergency.createdAt).toLocaleDateString(), " at", " ", new Date(emergency.createdAt).toLocaleTimeString()))),
    /* @__PURE__ */ React.createElement(Badge, { variant: "outline", className: "text-xs" }, getStatusLabel(emergency.status))
  )))))))));
}
export {
  PatientDashboard
};
