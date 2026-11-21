import React from 'react';
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, Phone, Mail, MapPin, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
function EmergencyContactNotificationDemo({
  patientName,
  location,
  emergencyType,
  timestamp,
  onRespond,
  onDismiss
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [responded, setResponded] = useState(false);
  const googleMapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  const handleRespond = () => {
    setResponded(true);
    toast.success("Response sent to emergency services");
    onRespond?.();
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 2e3);
  };
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };
  return /* @__PURE__ */ React.createElement(AnimatePresence, null, isVisible && /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0, y: -20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -20, scale: 0.95 },
      transition: { type: "spring", damping: 20, stiffness: 300 },
      className: "fixed top-4 right-4 z-50 w-full max-w-md"
    },
    /* @__PURE__ */ React.createElement(Card, { className: "border-2 border-red-500 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-r from-red-500 to-orange-500 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        animate: {
          scale: [1, 1.2, 1]
        },
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }
      },
      /* @__PURE__ */ React.createElement(Bell, { className: "w-6 h-6 text-white" })
    ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-white" }, "\u{1F6A8} EMERGENCY ALERT"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-white/90" }, new Date(timestamp).toLocaleTimeString()))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleDismiss,
        className: "text-white hover:bg-white/20 rounded p-1 transition-colors"
      },
      /* @__PURE__ */ React.createElement(X, { className: "w-5 h-5" })
    ))), /* @__PURE__ */ React.createElement(CardContent, { className: "p-4 space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Patient"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold text-gray-900 dark:text-gray-100" }, patientName), /* @__PURE__ */ React.createElement(Badge, { className: "mt-1 bg-red-500" }, emergencyType)), /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-gray-900 dark:text-gray-100" }, "\u26A0\uFE0F ", patientName, " has triggered an emergency SOS and needs immediate help!")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-2" }, "Location"), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-900 dark:text-gray-100" }, location.address || "Location coordinates shared"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400" }, location.lat.toFixed(6), ", ", location.lng.toFixed(6))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 pt-2" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        onClick: () => window.open(googleMapsUrl, "_blank"),
        className: "w-full bg-blue-600 hover:bg-blue-700 text-white",
        size: "lg"
      },
      /* @__PURE__ */ React.createElement(MapPin, { className: "w-4 h-4 mr-2" }),
      "View Location on Map"
    ), !responded ? /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(
      Button,
      {
        onClick: handleRespond,
        className: "bg-green-600 hover:bg-green-700 text-white"
      },
      /* @__PURE__ */ React.createElement(Check, { className: "w-4 h-4 mr-2" }),
      "I'm Responding"
    ), /* @__PURE__ */ React.createElement(
      Button,
      {
        onClick: () => window.open(`tel:911`, "_self"),
        className: "bg-red-600 hover:bg-red-700 text-white"
      },
      /* @__PURE__ */ React.createElement(Phone, { className: "w-4 h-4 mr-2" }),
      "Call 911"
    )) : /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-3 rounded" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-green-800 dark:text-green-200" }, "\u2705 Response confirmed. Emergency services have been notified."))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-gray-200 dark:border-gray-700 pt-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-2" }, "Notification sent via:"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-green-600" }, /* @__PURE__ */ React.createElement(Phone, { className: "w-3 h-3" }), /* @__PURE__ */ React.createElement("span", null, "SMS")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-blue-600" }, /* @__PURE__ */ React.createElement(Mail, { className: "w-3 h-3" }), /* @__PURE__ */ React.createElement("span", null, "Email")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-purple-600" }, /* @__PURE__ */ React.createElement(Bell, { className: "w-3 h-3" }), /* @__PURE__ */ React.createElement("span", null, "Push"))))))
  ));
}
export {
  EmergencyContactNotificationDemo
};
