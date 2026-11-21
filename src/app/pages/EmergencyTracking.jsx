import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Heart,
  ArrowLeft,
  MapPin,
  Clock,
  Navigation,
  Phone,
  MessageSquare,
  User,
  Droplet,
  AlertCircle
} from "lucide-react";
import { EmergencyMap } from "../components/EmergencyMap";
import { api } from "../utils/api";
import { auth } from "../utils/auth";
function EmergencyTracking() {
  const navigate = useNavigate();
  const { emergencyId } = useParams();
  const [emergency, setEmergency] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    auth.getUser().then(({ data }) => {
      if (!cancelled) setCurrentUserId(data?.user?.id || null);
    });
    loadEmergency();
    const interval = setInterval(() => {
      loadEmergency();
    }, 3e3);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [emergencyId]);
  const loadEmergency = async () => {
    try {
      const result = await api.getEmergencyById(emergencyId);
      setEmergency(result.emergency || null);
    } catch (error) {
      console.error("Error loading emergency:", error);
    } finally {
      setLoading(false);
    }
  };
  const getProgressValue = (status) => {
    switch (status) {
      case "pending":
        return 10;
      case "assigned":
        return 20;
      case "enroute":
        return 40;
      case "arrived":
        return 60;
      case "transporting":
        return 80;
      case "delivered":
        return 95;
      case "completed":
        return 100;
      default:
        return 0;
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
        return "bg-orange-500";
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
  const getETA = (status) => {
    switch (status) {
      case "pending":
        return "Dispatching ambulance...";
      case "assigned":
        return "15-20 minutes";
      case "enroute":
        return "10-15 minutes to patient";
      case "arrived":
        return "Ambulance at scene";
      case "transporting":
        return "10-15 minutes to hospital";
      case "delivered":
        return "Patient at hospital";
      case "completed":
        return "Completed";
      default:
        return "Calculating...";
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600" }, "Loading emergency details...")));
  }
  if (!emergency) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Card, { className: "max-w-md" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-8 text-center" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold mb-2" }, "Emergency Not Found"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mb-4" }, "The emergency you're looking for doesn't exist."), /* @__PURE__ */ React.createElement(Button, { onClick: () => navigate(-1) }, "Go Back"))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-4 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "icon", onClick: () => navigate(-1) }, /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Heart, { className: "w-5 h-5 text-white fill-white" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent" }, "Emergency Tracking"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600" }, "ID: ", emergency.emergencyId.substring(0, 12), "..."))))), /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-8" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: `w-3 h-3 rounded-full ${emergency.status !== "completed" ? "animate-pulse" : ""} ${getStatusColor(emergency.status).replace("bg-", "bg-")}` }), "Emergency Status")), /* @__PURE__ */ React.createElement(CardContent, { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement(Badge, { className: getStatusColor(emergency.status) }, getStatusLabel(emergency.status)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-sm text-gray-600" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-3 h-3" }), new Date(emergency.createdAt).toLocaleTimeString())), /* @__PURE__ */ React.createElement(Progress, { value: getProgressValue(emergency.status), className: "h-2" })), /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement(Navigation, { className: "w-4 h-4 text-blue-600" }), /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-blue-900" }, "Estimated Arrival")), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-blue-600" }, getETA(emergency.status))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-sm text-gray-700" }, "Timeline"), emergency.timeline.map((item, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `w-2 h-2 rounded-full ${getStatusColor(item.status).replace("bg-", "bg-")}` }), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium capitalize" }, item.status), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, new Date(item.timestamp).toLocaleTimeString()))))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(User, { className: "w-5 h-5 text-pink-600" }), "Patient Information")), /* @__PURE__ */ React.createElement(CardContent, { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Name"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold" }, emergency.patientName)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Contact"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold" }, emergency.patientPhone)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-red-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Droplet, { className: "w-5 h-5 text-red-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Blood Group"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold" }, emergency.bloodGroup))), emergency.allergies && emergency.allergies.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-1" }, "Allergies"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, emergency.allergies.map((allergy, idx) => /* @__PURE__ */ React.createElement(Badge, { key: idx, variant: "outline", className: "text-xs" }, allergy)))), emergency.medicalConditions && emergency.medicalConditions.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-1" }, "Medical Conditions"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, emergency.medicalConditions.map((condition, idx) => /* @__PURE__ */ React.createElement(Badge, { key: idx, variant: "outline", className: "text-xs" }, condition)))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-5 h-5 text-pink-600" }), "Emergency Details")), /* @__PURE__ */ React.createElement(CardContent, { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Type"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold" }, emergency.emergencyType)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Severity"), /* @__PURE__ */ React.createElement(Badge, { className: emergency.severity === "critical" ? "bg-red-500" : emergency.severity === "high" ? "bg-orange-500" : "bg-yellow-500" }, emergency.severity)), emergency.notes && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-1" }, "Notes"), /* @__PURE__ */ React.createElement("p", { className: "text-sm bg-gray-50 rounded p-2" }, emergency.notes)))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      className: "flex-1",
      disabled: !emergency.patientPhone || !currentUserId || currentUserId === emergency.patientId,
      title: currentUserId === emergency.patientId ? "Calling your own number is not available here" : emergency.patientPhone ? "Call patient" : "Patient phone number is not available",
      onClick: () => {
        if (emergency.patientPhone) window.location.href = `tel:${emergency.patientPhone}`;
      }
    },
    /* @__PURE__ */ React.createElement(Phone, { className: "w-4 h-4 mr-2" }),
    "Call"
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      className: "flex-1",
      variant: "outline",
      onClick: () => navigate(`/chat/${emergency.emergencyId}`)
    },
    /* @__PURE__ */ React.createElement(MessageSquare, { className: "w-4 h-4 mr-2" }),
    "Chat"
  ))), /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100 h-full" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-5 h-5 text-pink-600" }), "Live Location Tracking")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "h-[calc(100vh-16rem)] rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement(
    EmergencyMap,
    {
      center: [emergency.latitude, emergency.longitude],
      markers: [
        {
          position: [emergency.latitude, emergency.longitude],
          label: `Patient - ${emergency.patientName}`,
          type: "patient"
        },
        ...emergency.ambulanceLocation ? [{
          position: [
            emergency.ambulanceLocation.latitude,
            emergency.ambulanceLocation.longitude
          ],
          label: "Ambulance",
          type: "ambulance"
        }] : [],
        ...emergency.hospitalLocation && ["arrived", "transporting", "delivered"].includes(emergency.status) ? [{
          position: [emergency.hospitalLocation.latitude, emergency.hospitalLocation.longitude],
          label: "Hospital",
          type: "hospital"
        }] : []
      ],
      showRadius: true,
      routeTarget: ["arrived", "transporting", "delivered"].includes(emergency.status) ? "hospital" : "patient",
      showRoutes: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "mt-4 flex items-center gap-4 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-3 h-3 rounded-full bg-red-500" }), /* @__PURE__ */ React.createElement("span", null, "Patient")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-3 h-3 rounded-full bg-blue-500" }), /* @__PURE__ */ React.createElement("span", null, "Ambulance")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-3 h-3 rounded-full bg-green-500" }), /* @__PURE__ */ React.createElement("span", null, "Hospital")))))))));
}
export {
  EmergencyTracking
};
