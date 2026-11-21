import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Building2,
  Bed,
  Activity,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Ambulance,
  MapPin,
  Plus,
  Minus,
  Save
} from "lucide-react";
import { auth } from "../utils/auth";
import { api } from "../utils/api";
import { toast } from "sonner";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { InAppNotifications } from "../components/InAppNotifications";
import { HospitalLivePanel } from "../components/HospitalLivePanel";
function HospitalDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [tempCapacity, setTempCapacity] = useState(0);
  const [tempIcuBeds, setTempIcuBeds] = useState(0);
  const [tempAvailableBeds, setTempAvailableBeds] = useState(0);
  const [tempAvailableIcu, setTempAvailableIcu] = useState(0);
  useEffect(() => {
    let interval;
    let cancelled = false;
    (async () => {
      const { data } = await auth.getUser();
      const role = data?.user?.user_metadata?.role;
      if (role !== "hospital") {
        navigate(role === "patient" ? "/patient" : role === "ambulance" ? "/ambulance" : "/login", { replace: true });
        return;
      }
      if (cancelled) return;
      await Promise.all([loadProfile(), loadEmergencies(), loadAnalytics(), loadAmbulances()]);
      interval = setInterval(() => { loadEmergencies(); loadAnalytics(); loadAmbulances(); }, 5e3);
    })();
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  const loadProfile = async () => {
    try {
      const { data: userData } = await auth.getCurrentUser();
      if (userData?.user?.user_metadata) {
        const initialProfile = {
          name: userData.user.user_metadata.name,
          email: userData.user.email,
          hospitalName: userData.user.user_metadata.hospitalName,
          role: userData.user.user_metadata.role
        };
        setProfile(initialProfile);
      }
      const result = await api.getProfile();
      if (result.profile && !result.error) {
        setProfile(result.profile);
        setTempCapacity(result.profile.capacity || 0);
        setTempIcuBeds(result.profile.icuBeds || 0);
        setTempAvailableBeds(result.profile.availableBeds || 0);
        setTempAvailableIcu(result.profile.availableIcu || 0);
      }
    } catch (error) {
    }
  };
  const loadEmergencies = async () => {
    try {
      const result = await api.getAllEmergencies();
      if (result.emergencies && !result.error) {
        setEmergencies(result.emergencies);
      }
    } catch (error) {
    }
  };
  const loadAnalytics = async () => {
    try {
      const result = await api.getAnalytics();
      if (!result.error) {
        setAnalytics(result);
      }
    } catch (error) {
    }
  };
  const loadAmbulances = async () => {
    try {
      const result = await api.getHospitalAmbulances();
      if (!result.error && result.ambulances) setAmbulances(result.ambulances);
    } catch (error) {
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
  const pendingEmergencies = emergencies.filter((e) => e.status === "pending");
  const activeEmergencies = emergencies.filter((e) => ["assigned", "enroute", "arrived", "transporting", "delivered"].includes(e.status));
  const completedEmergencies = emergencies.filter((e) => e.status === "completed");
  const handleUpdateCapacity = async () => {
    try {
      const result = await api.updateProfile({
        capacity: tempCapacity,
        icuBeds: tempIcuBeds,
        availableBeds: tempAvailableBeds,
        availableIcu: tempAvailableIcu
      });
      if (result.error) {
        toast.error("Failed to update capacity: " + result.error);
      } else {
        toast.success("Bed capacity updated successfully!");
        setEditingCapacity(false);
        loadProfile();
      }
    } catch (error) {
      toast.error("Error updating capacity: " + error.message);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10 dark:bg-gray-950/90 dark:border-green-900/30" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-4 flex items-center justify-between" }, /* @__PURE__ */ React.createElement(Logo, { size: "sm", variant: "hospital", showText: true }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(ThemeToggle, null), /* @__PURE__ */ React.createElement(InAppNotifications, null), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "ghost",
      size: "icon",
      onClick: () => navigate("/analytics")
    },
    /* @__PURE__ */ React.createElement(TrendingUp, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold dark:text-gray-100" }, profile?.hospitalName), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, profile?.name)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "icon", onClick: handleLogout }, /* @__PURE__ */ React.createElement(LogOut, { className: "w-4 h-4" }))))), /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-8" }, React.createElement(HospitalLivePanel, { profile, ambulances }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-green-100 dark:bg-gray-900/90 dark:border-green-900/40" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1" }, "Total Beds"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400" }, profile?.capacity || 0), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-500 mt-1" }, "Available: ", profile?.availableBeds || 0)), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Bed, { className: "w-6 h-6 text-green-600 dark:text-green-400" }))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-green-100 dark:bg-gray-900/90 dark:border-green-900/40" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1" }, "ICU Beds"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-teal-600 dark:text-teal-400" }, profile?.icuBeds || 0), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-500 mt-1" }, "Available: ", profile?.availableIcu || 0)), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Activity, { className: "w-6 h-6 text-teal-600 dark:text-teal-400" }))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-green-100 dark:bg-gray-900/90 dark:border-green-900/40" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1" }, "Active Cases"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400" }, activeEmergencies.length)), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ambulance, { className: "w-6 h-6 text-green-600 dark:text-green-400" }))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-green-100 dark:bg-gray-900/90 dark:border-green-900/40" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-1" }, "Total Cases"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-teal-600 dark:text-teal-400" }, analytics?.totalEmergencies || 0)), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(CheckCircle, { className: "w-6 h-6 text-teal-600 dark:text-teal-400" })))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-green-100 mb-8 dark:bg-gray-900/90 dark:border-green-900/40" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Bed, { className: "w-5 h-5 text-green-600 dark:text-green-400" }), "Bed Capacity Management"), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, "Update available bed capacity in real-time")), !editingCapacity ? /* @__PURE__ */ React.createElement(
    Button,
    {
      onClick: () => setEditingCapacity(true),
      className: "bg-gradient-to-r from-green-500 to-teal-500"
    },
    "Edit Capacity"
  ) : /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      onClick: () => {
        setEditingCapacity(false);
        setTempCapacity(profile?.capacity || 0);
        setTempIcuBeds(profile?.icuBeds || 0);
        setTempAvailableBeds(profile?.availableBeds || 0);
        setTempAvailableIcu(profile?.availableIcu || 0);
      }
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      onClick: handleUpdateCapacity,
      className: "bg-gradient-to-r from-green-500 to-teal-500"
    },
    /* @__PURE__ */ React.createElement(Save, { className: "w-4 h-4 mr-2" }),
    "Save Changes"
  )))), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-lg dark:text-gray-200" }, "General Beds"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Label, { className: "dark:text-gray-300" }, "Total Capacity"), editingCapacity ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempCapacity(Math.max(0, tempCapacity - 10))
    },
    /* @__PURE__ */ React.createElement(Minus, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    Input,
    {
      type: "number",
      value: tempCapacity,
      onChange: (e) => setTempCapacity(parseInt(e.target.value) || 0),
      className: "w-24 text-center"
    }
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempCapacity(tempCapacity + 10)
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" })
  )) : /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-green-600 dark:text-green-400 mt-2" }, profile?.capacity || 0)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Label, { className: "dark:text-gray-300" }, "Currently Available"), editingCapacity ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempAvailableBeds(Math.max(0, tempAvailableBeds - 1))
    },
    /* @__PURE__ */ React.createElement(Minus, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    Input,
    {
      type: "number",
      value: tempAvailableBeds,
      onChange: (e) => setTempAvailableBeds(parseInt(e.target.value) || 0),
      className: "w-24 text-center"
    }
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempAvailableBeds(Math.min(tempCapacity, tempAvailableBeds + 1))
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" })
  )) : /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-green-600 dark:text-green-400 mt-2" }, profile?.availableBeds || 0)), !editingCapacity && /* @__PURE__ */ React.createElement("div", { className: "pt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "dark:text-gray-400" }, "Occupancy"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold dark:text-gray-200" }, profile?.capacity ? Math.round((profile.capacity - (profile.availableBeds || 0)) / profile.capacity * 100) : 0, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all",
      style: {
        width: `${profile?.capacity ? (profile.capacity - (profile.availableBeds || 0)) / profile.capacity * 100 : 0}%`
      }
    }
  ))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 p-4 bg-teal-50 dark:bg-teal-900/10 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-lg dark:text-gray-200" }, "ICU Beds"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Label, { className: "dark:text-gray-300" }, "Total ICU Capacity"), editingCapacity ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempIcuBeds(Math.max(0, tempIcuBeds - 5))
    },
    /* @__PURE__ */ React.createElement(Minus, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    Input,
    {
      type: "number",
      value: tempIcuBeds,
      onChange: (e) => setTempIcuBeds(parseInt(e.target.value) || 0),
      className: "w-24 text-center"
    }
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempIcuBeds(tempIcuBeds + 5)
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" })
  )) : /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2" }, profile?.icuBeds || 0)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Label, { className: "dark:text-gray-300" }, "Currently Available"), editingCapacity ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempAvailableIcu(Math.max(0, tempAvailableIcu - 1))
    },
    /* @__PURE__ */ React.createElement(Minus, { className: "w-4 h-4" })
  ), /* @__PURE__ */ React.createElement(
    Input,
    {
      type: "number",
      value: tempAvailableIcu,
      onChange: (e) => setTempAvailableIcu(parseInt(e.target.value) || 0),
      className: "w-24 text-center"
    }
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: () => setTempAvailableIcu(Math.min(tempIcuBeds, tempAvailableIcu + 1))
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-4 h-4" })
  )) : /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2" }, profile?.availableIcu || 0)), !editingCapacity && /* @__PURE__ */ React.createElement("div", { className: "pt-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "dark:text-gray-400" }, "Occupancy"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold dark:text-gray-200" }, profile?.icuBeds ? Math.round((profile.icuBeds - (profile.availableIcu || 0)) / profile.icuBeds * 100) : 0, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all",
      style: {
        width: `${profile?.icuBeds ? (profile.icuBeds - (profile.availableIcu || 0)) / profile.icuBeds * 100 : 0}%`
      }
    }
  )))))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-green-100 mb-8 dark:bg-gray-800/80 dark:border-gray-700" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Building2, { className: "w-5 h-5 text-green-600 dark:text-green-400" }), /* @__PURE__ */ React.createElement("span", { className: "dark:text-gray-200" }, "Hospital Information"))), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Hospital Name"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-lg dark:text-gray-200" }, profile?.hospitalName)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Address"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, profile?.hospitalAddress)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Contact Person"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, profile?.name)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Email"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, profile?.email))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-green-100 dark:bg-gray-800/80 dark:border-gray-700" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-5 h-5 text-pink-600 dark:text-pink-400" }), /* @__PURE__ */ React.createElement("span", { className: "dark:text-gray-200" }, "Emergency Requests")), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, "Monitor and manage incoming emergency cases")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(Tabs, { defaultValue: "pending" }, /* @__PURE__ */ React.createElement(TabsList, { className: "grid w-full grid-cols-3 mb-6" }, /* @__PURE__ */ React.createElement(TabsTrigger, { value: "pending" }, "Pending (", pendingEmergencies.length, ")"), /* @__PURE__ */ React.createElement(TabsTrigger, { value: "active" }, "Active (", activeEmergencies.length, ")"), /* @__PURE__ */ React.createElement(TabsTrigger, { value: "completed" }, "Completed (", completedEmergencies.length, ")")), /* @__PURE__ */ React.createElement(TabsContent, { value: "pending", className: "space-y-3" }, pendingEmergencies.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-600 dark:text-gray-400 py-8" }, "No pending emergencies") : pendingEmergencies.map((emergency) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: emergency.emergencyId,
      className: "p-4 rounded-lg border border-pink-100 dark:border-pink-900/30 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 hover:shadow-md transition-shadow"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement(Badge, { className: "bg-yellow-500" }, "Pending"), /* @__PURE__ */ React.createElement(Badge, { variant: "outline", className: emergency.severity === "critical" ? "border-red-500 text-red-500" : emergency.severity === "high" ? "border-orange-500 text-orange-500" : "border-yellow-500 text-yellow-500" }, emergency.severity)), /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-lg dark:text-gray-200" }, emergency.emergencyType), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, emergency.notes))),
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4 mb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, "Patient"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, emergency.patientName)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, "Blood Group"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, emergency.bloodGroup)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, "Contact"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, emergency.patientPhone)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, "Time"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, new Date(emergency.createdAt).toLocaleTimeString()))),
    emergency.allergies && emergency.allergies.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400 mb-1" }, "Allergies"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, emergency.allergies.map((allergy, idx) => /* @__PURE__ */ React.createElement(Badge, { key: idx, variant: "outline", className: "text-xs bg-red-50 dark:bg-red-900/20" }, allergy)))),
    emergency.medicalConditions && emergency.medicalConditions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400 mb-1" }, "Medical Conditions"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, emergency.medicalConditions.map((condition, idx) => /* @__PURE__ */ React.createElement(Badge, { key: idx, variant: "outline", className: "text-xs bg-blue-50 dark:bg-blue-900/20" }, condition)))),
    /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        onClick: () => navigate(`/tracking/${emergency.emergencyId}`),
        className: "bg-gradient-to-r from-pink-500 to-red-500"
      },
      /* @__PURE__ */ React.createElement(MapPin, { className: "w-4 h-4 mr-2" }),
      "View on Map"
    )
  ))), /* @__PURE__ */ React.createElement(TabsContent, { value: "active", className: "space-y-3" }, activeEmergencies.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-600 dark:text-gray-400 py-8" }, "No active emergencies") : activeEmergencies.map((emergency) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: emergency.emergencyId,
      className: "p-4 rounded-lg border border-pink-100 dark:border-pink-900/30 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 hover:shadow-md transition-shadow"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement(Badge, { className: getStatusColor(emergency.status) }, getStatusLabel(emergency.status)), /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, emergency.severity), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-3 h-3" }), new Date(emergency.createdAt).toLocaleTimeString())), /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-lg dark:text-gray-200" }, emergency.emergencyType))),
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-4 mb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, "Patient"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, emergency.patientName)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, "Blood Group"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold dark:text-gray-200" }, emergency.bloodGroup)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 dark:text-gray-400" }, "ETA"), /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-green-600 dark:text-green-400" }, "15-20 min"))),
    /* @__PURE__ */ React.createElement(
      Button,
      {
        size: "sm",
        onClick: () => navigate(`/tracking/${emergency.emergencyId}`),
        className: "bg-gradient-to-r from-pink-500 to-red-500"
      },
      /* @__PURE__ */ React.createElement(MapPin, { className: "w-4 h-4 mr-2" }),
      "Track Ambulance"
    )
  ))), /* @__PURE__ */ React.createElement(TabsContent, { value: "completed", className: "space-y-3" }, completedEmergencies.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-600 dark:text-gray-400 py-8" }, "No completed emergencies") : completedEmergencies.slice(0, 10).map((emergency) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: emergency.emergencyId,
      className: "p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition-shadow"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement(Badge, { className: "bg-gray-500" }, "Completed"), /* @__PURE__ */ React.createElement("h3", { className: "font-semibold dark:text-gray-200" }, emergency.emergencyType)), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, emergency.patientName)), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, new Date(emergency.createdAt).toLocaleDateString()), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 dark:text-gray-500" }, new Date(emergency.createdAt).toLocaleTimeString())))
  ))))))));
}
export {
  HospitalDashboard
};
