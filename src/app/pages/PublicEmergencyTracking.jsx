import React from 'react';
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";
import {
  MapPin,
  Clock,
  AlertCircle,
  Activity,
  Home,
  User,
  Phone,
  Droplet
} from "lucide-react";
import { EmergencyMap } from "../components/EmergencyMap";
import { api } from "../utils/api";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
function PublicEmergencyTracking() {
  const { emergencyId } = useParams();
  const navigate = useNavigate();
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadEmergency();
    const interval = setInterval(() => {
      loadEmergency();
    }, 3e3);
    return () => clearInterval(interval);
  }, [emergencyId]);
  const loadEmergency = async () => {
    try {
      const result = await api.getEmergency(emergencyId);
      if (result) setEmergency(result);
    } catch (err) {
      console.error('Could not load public emergency tracking:', err);
    } finally {
      setLoading(false);
    }
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
      case "transporting":
        return "bg-indigo-500";
      case "delivered":
        return "bg-teal-500";
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
        return 10;
      case "assigned":
        return 25;
      case "enroute":
        return 40;
      case "arrived":
        return 55;
      case "transporting":
        return 75;
      case "delivered":
        return 90;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };
  const getStatusMessage = (status) => {
    switch (status) {
      case "pending":
        return "Searching for nearby ambulance...";
      case "assigned":
        return "Ambulance has been assigned";
      case "enroute":
        return "Ambulance is on the way to patient";
      case "arrived":
        return "Ambulance has reached the patient";
      case "transporting":
        return "Patient is being transported to hospital";
      case "delivered":
        return "Patient has been delivered to hospital";
      case "completed":
        return "Emergency completed successfully";
      default:
        return "Unknown status";
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement(Activity, { className: "w-12 h-12 text-pink-600 mx-auto mb-4 animate-pulse" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600" }, "Loading emergency information...")));
  }
  if (!emergency) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Card, { className: "max-w-md w-full mx-4" }, /* @__PURE__ */ React.createElement(CardContent, { className: "pt-6" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-12 h-12 text-red-500 mx-auto mb-4" }), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-center mb-2" }, "Emergency Not Found"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 text-center" }, "The emergency you're trying to access doesn't exist or has been removed."))));
  }
  const patientLocation = [emergency.latitude, emergency.longitude];
  const ambulanceLocation = emergency.ambulanceLocation ? [emergency.ambulanceLocation.latitude, emergency.ambulanceLocation.longitude] : null;
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10 dark:bg-gray-900/80 dark:border-gray-700" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-4 flex items-center justify-between" }, /* @__PURE__ */ React.createElement(Logo, { size: "sm", variant: "patient", showText: true }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(ThemeToggle, null), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      onClick: () => navigate("/")
    },
    /* @__PURE__ */ React.createElement(Home, { className: "w-4 h-4 mr-2" }),
    "Back to Home"
  )))), /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-8" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto space-y-6" }, /* @__PURE__ */ React.createElement(Alert, { className: "bg-gradient-to-r from-pink-500/10 to-red-500/10 border-pink-200" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "h-4 w-4 text-pink-600" }), /* @__PURE__ */ React.createElement(AlertDescription, { className: "text-pink-900" }, "You are viewing live emergency tracking for ", /* @__PURE__ */ React.createElement("strong", null, emergency.patientName), ". This page updates automatically.")), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(User, { className: "w-5 h-5 text-pink-600" }), "Patient Information")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Name"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold" }, emergency.patientName)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Blood Group"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Droplet, { className: "w-4 h-4 text-red-600" }), /* @__PURE__ */ React.createElement("p", { className: "font-semibold" }, emergency.bloodGroup || "Not specified"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Emergency Type"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold capitalize" }, emergency.emergencyType?.replace(/-/g, " "))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Severity"), /* @__PURE__ */ React.createElement(Badge, { className: emergency.severity === "critical" ? "bg-red-500" : emergency.severity === "high" ? "bg-orange-500" : "bg-yellow-500" }, emergency.severity))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Activity, { className: "w-5 h-5 text-pink-600" }), "Emergency Status"), /* @__PURE__ */ React.createElement(CardDescription, null, getStatusMessage(emergency.status))), /* @__PURE__ */ React.createElement(CardContent, { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Badge, { className: getStatusColor(emergency.status) }, getStatusLabel(emergency.status)), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-600 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-4 h-4" }), "Started ", new Date(emergency.createdAt).toLocaleString())), /* @__PURE__ */ React.createElement(Progress, { value: getProgressValue(emergency.status), className: "h-2" }), /* @__PURE__ */ React.createElement("div", { className: "mt-6" }, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold mb-3" }, "Timeline"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, emergency.timeline?.map((event, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `w-2 h-2 rounded-full mt-1.5 ${getStatusColor(event.status)}` }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-medium capitalize" }, event.status.replace(/-/g, " ")), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600" }, new Date(event.timestamp).toLocaleString())))))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-5 h-5 text-pink-600" }), "Live Location Tracking"), /* @__PURE__ */ React.createElement(CardDescription, null, ambulanceLocation ? "Tracking patient and ambulance in real-time" : "Showing patient location")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "h-96 rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement(
    EmergencyMap,
    {
      center: ambulanceLocation || patientLocation,
      markers: [
        {
          position: patientLocation,
          label: `Patient: ${emergency.patientName}`,
          type: "patient"
        },
        ...ambulanceLocation ? [{
          position: ambulanceLocation,
          label: "Ambulance",
          type: "ambulance"
        }] : [],
        ...emergency.hospitalLocation ? [{
          position: [emergency.hospitalLocation.latitude, emergency.hospitalLocation.longitude],
          label: emergency.hospitalName || "Hospital",
          type: "hospital"
        }] : []
      ],
      showRadius: false,
      routeTarget: ["arrived", "transporting", "delivered"].includes(emergency.status) ? "hospital" : "patient",
      showRoutes: !!ambulanceLocation
    }
  )))), emergency.patientPhone && /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Phone, { className: "w-5 h-5 text-pink-600" }), "Contact")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Patient Phone"), /* @__PURE__ */ React.createElement("a", { href: `tel:${emergency.patientPhone}`, className: "font-semibold text-pink-600 hover:underline" }, emergency.patientPhone))))));
}
export {
  PublicEmergencyTracking
};
