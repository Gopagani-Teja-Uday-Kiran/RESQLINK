import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Heart,
  ArrowLeft,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Target
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { api } from "../utils/api";
import { auth } from "../utils/auth";
import { ThemeToggle } from "../components/ThemeToggle";
function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadAnalytics();
  }, []);
  const loadAnalytics = async () => {
    const { data } = await auth.getUser();
    const role = data?.user?.user_metadata?.role;
    if (role !== "hospital") {
      navigate(role === "patient" ? "/patient" : role === "ambulance" ? "/ambulance" : "/login", { replace: true });
      return;
    }
    try {
      const result = await api.getAnalytics();
      setAnalytics(result);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600" }, "Loading analytics...")));
  }
  const emergencyTypeData = Object.entries(analytics?.typeDistribution || {}).map(([name, value]) => ({
    name: name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value
  }));
  const dailyData = Object.entries(analytics?.dailyEmergencies || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    emergencies: count
  }));
  const COLORS = ["#ec4899", "#ef4444", "#f97316", "#eab308", "#8b5cf6", "#3b82f6"];
  const statusData = [
    { name: "Completed", value: analytics?.completedEmergencies || 0, color: "#10b981" },
    { name: "Active", value: analytics?.activeEmergencies || 0, color: "#3b82f6" },
    { name: "Pending", value: analytics?.pendingEmergencies || 0, color: "#eab308" }
  ];
  const responseTimeData = [
    { time: "0-5 min", count: 15 },
    { time: "5-10 min", count: 25 },
    { time: "10-15 min", count: 18 },
    { time: "15-20 min", count: 12 },
    { time: "20+ min", count: 8 }
  ];
  const monthlyData = [
    { month: "Jan", emergencies: 45, completed: 42, avgResponse: 11 },
    { month: "Feb", emergencies: 52, completed: 48, avgResponse: 12 },
    { month: "Mar", emergencies: 48, completed: 45, avgResponse: 10 },
    { month: "Apr", emergencies: 61, completed: 58, avgResponse: 9 },
    { month: "May", emergencies: 55, completed: 52, avgResponse: 11 },
    { month: "Jun", emergencies: 67, completed: 64, avgResponse: 12 }
  ];
  const successRateData = [
    { week: "Week 1", rate: 92.5 },
    { week: "Week 2", rate: 93.8 },
    { week: "Week 3", rate: 94.2 },
    { week: "Week 4", rate: 94.5 }
  ];
  const timeOfDayData = [
    { time: "00-06", emergencies: 12, avgResponse: 8 },
    { time: "06-12", emergencies: 28, avgResponse: 14 },
    { time: "12-18", emergencies: 35, avgResponse: 15 },
    { time: "18-24", emergencies: 25, avgResponse: 11 }
  ];
  const hospitalPerformanceData = [
    { hospital: "City General", responseTime: 10, successRate: 95, capacity: 85 },
    { hospital: "Medical Center", responseTime: 12, successRate: 94, capacity: 78 },
    { hospital: "Regional Hospital", responseTime: 14, successRate: 92, capacity: 72 },
    { hospital: "Community Health", responseTime: 11, successRate: 93, capacity: 80 }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-4 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", size: "icon", onClick: () => navigate(-1) }, /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-5 h-5" })), /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Heart, { className: "w-5 h-5 text-white fill-white" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent" }, "Analytics Dashboard"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600" }, "Emergency response insights"))), /* @__PURE__ */ React.createElement(ThemeToggle, null))), /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-8" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-pink-100" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-1" }, "Total Emergencies"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-pink-600" }, analytics?.totalEmergencies || 0), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-green-600 mt-1" }, "\u2191 12% from last month")), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Activity, { className: "w-6 h-6 text-pink-600" }))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-pink-100" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-1" }, "Completed"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-green-600" }, analytics?.completedEmergencies || 0), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-green-600 mt-1" }, "\u2191 8% success rate")), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-green-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(CheckCircle, { className: "w-6 h-6 text-green-600" }))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-pink-100" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-1" }, "Active Cases"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-blue-600" }, analytics?.activeEmergencies || 0), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 mt-1" }, "Currently in progress")), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-6 h-6 text-blue-600" }))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-lg border-pink-100" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-1" }, "Avg Response Time"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-purple-600" }, "12m"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-green-600 mt-1" }, "\u2193 15% faster")), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-6 h-6 text-purple-600" })))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, null, "Emergency Types Distribution"), /* @__PURE__ */ React.createElement(CardDescription, null, "Breakdown of emergency categories")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(PieChart, null, /* @__PURE__ */ React.createElement(
    Pie,
    {
      data: emergencyTypeData,
      cx: "50%",
      cy: "50%",
      labelLine: false,
      label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`,
      outerRadius: 100,
      fill: "#8884d8",
      dataKey: "value"
    },
    emergencyTypeData.map((entry, index) => /* @__PURE__ */ React.createElement(Cell, { key: `cell-${index}`, fill: COLORS[index % COLORS.length] }))
  ), /* @__PURE__ */ React.createElement(Tooltip, null))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, null, "Emergency Status Overview"), /* @__PURE__ */ React.createElement(CardDescription, null, "Current status distribution")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(PieChart, null, /* @__PURE__ */ React.createElement(
    Pie,
    {
      data: statusData,
      cx: "50%",
      cy: "50%",
      labelLine: false,
      label: ({ name, value }) => `${name}: ${value}`,
      outerRadius: 100,
      fill: "#8884d8",
      dataKey: "value"
    },
    statusData.map((entry, index) => /* @__PURE__ */ React.createElement(Cell, { key: `cell-${index}`, fill: entry.color }))
  ), /* @__PURE__ */ React.createElement(Tooltip, null)))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, null, "Daily Emergency Trend"), /* @__PURE__ */ React.createElement(CardDescription, null, "Emergency requests over time")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(LineChart, { data: dailyData }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "date" }), /* @__PURE__ */ React.createElement(YAxis, null), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null), /* @__PURE__ */ React.createElement(
    Line,
    {
      type: "monotone",
      dataKey: "emergencies",
      stroke: "#ec4899",
      strokeWidth: 2,
      dot: { fill: "#ec4899", r: 4 }
    }
  ))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, null, "Response Time Distribution"), /* @__PURE__ */ React.createElement(CardDescription, null, "Time taken to reach patients")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(BarChart, { data: responseTimeData }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "time" }), /* @__PURE__ */ React.createElement(YAxis, null), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null), /* @__PURE__ */ React.createElement(Bar, { dataKey: "count", fill: "#8b5cf6", radius: [8, 8, 0, 0] })))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mt-6" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-gradient-to-br from-pink-500 to-red-500 shadow-xl border-0 text-white" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement(TrendingUp, { className: "w-8 h-8 mb-3 opacity-80" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm opacity-90 mb-1" }, "Patient Survival Rate"), /* @__PURE__ */ React.createElement("p", { className: "text-4xl font-bold" }, "94.5%"), /* @__PURE__ */ React.createElement("p", { className: "text-xs opacity-75 mt-2" }, "\u2191 2.3% improvement"))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl border-0 text-white" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement(Users, { className: "w-8 h-8 mb-3 opacity-80" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm opacity-90 mb-1" }, "Active Ambulances"), /* @__PURE__ */ React.createElement("p", { className: "text-4xl font-bold" }, "24"), /* @__PURE__ */ React.createElement("p", { className: "text-xs opacity-75 mt-2" }, "3 currently on duty"))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-gradient-to-br from-green-500 to-emerald-500 shadow-xl border-0 text-white" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-6" }, /* @__PURE__ */ React.createElement(CheckCircle, { className: "w-8 h-8 mb-3 opacity-80" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm opacity-90 mb-1" }, "Hospital Capacity"), /* @__PURE__ */ React.createElement("p", { className: "text-4xl font-bold" }, "78%"), /* @__PURE__ */ React.createElement("p", { className: "text-xs opacity-75 mt-2" }, "22 beds available")))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Calendar, { className: "w-5 h-5 text-pink-600" }), /* @__PURE__ */ React.createElement(CardTitle, null, "Monthly Emergency Patterns")), /* @__PURE__ */ React.createElement(CardDescription, null, "Emergencies and completion rates by month")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(AreaChart, { data: monthlyData }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "month" }), /* @__PURE__ */ React.createElement(YAxis, null), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null), /* @__PURE__ */ React.createElement(
    Area,
    {
      type: "monotone",
      dataKey: "emergencies",
      stackId: "1",
      stroke: "#ec4899",
      fill: "#ec4899",
      fillOpacity: 0.6
    }
  ), /* @__PURE__ */ React.createElement(
    Area,
    {
      type: "monotone",
      dataKey: "completed",
      stackId: "2",
      stroke: "#10b981",
      fill: "#10b981",
      fillOpacity: 0.6
    }
  ))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Target, { className: "w-5 h-5 text-green-600" }), /* @__PURE__ */ React.createElement(CardTitle, null, "Success Rate Trends")), /* @__PURE__ */ React.createElement(CardDescription, null, "Weekly success rate improvements")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(AreaChart, { data: successRateData }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "week" }), /* @__PURE__ */ React.createElement(YAxis, { domain: [90, 100] }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null), /* @__PURE__ */ React.createElement(
    Area,
    {
      type: "monotone",
      dataKey: "rate",
      stroke: "#10b981",
      fill: "#10b981",
      fillOpacity: 0.3,
      strokeWidth: 3
    }
  )))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-5 h-5 text-purple-600" }), /* @__PURE__ */ React.createElement(CardTitle, null, "Performance by Time of Day")), /* @__PURE__ */ React.createElement(CardDescription, null, "Emergency volume and response time by hour")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(BarChart, { data: timeOfDayData }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "time" }), /* @__PURE__ */ React.createElement(YAxis, { yAxisId: "left" }), /* @__PURE__ */ React.createElement(YAxis, { yAxisId: "right", orientation: "right" }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null), /* @__PURE__ */ React.createElement(Bar, { yAxisId: "left", dataKey: "emergencies", fill: "#8b5cf6", radius: [8, 8, 0, 0] }), /* @__PURE__ */ React.createElement(Bar, { yAxisId: "right", dataKey: "avgResponse", fill: "#f97316", radius: [8, 8, 0, 0] }))))), /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Activity, { className: "w-5 h-5 text-blue-600" }), /* @__PURE__ */ React.createElement(CardTitle, null, "Hospital Performance Comparison")), /* @__PURE__ */ React.createElement(CardDescription, null, "Multi-metric performance analysis")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(RadarChart, { data: hospitalPerformanceData }, /* @__PURE__ */ React.createElement(PolarGrid, null), /* @__PURE__ */ React.createElement(PolarAngleAxis, { dataKey: "hospital" }), /* @__PURE__ */ React.createElement(PolarRadiusAxis, null), /* @__PURE__ */ React.createElement(Radar, { name: "Success Rate", dataKey: "successRate", stroke: "#10b981", fill: "#10b981", fillOpacity: 0.5 }), /* @__PURE__ */ React.createElement(Radar, { name: "Capacity", dataKey: "capacity", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.5 }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Legend, null))))))));
}
export {
  Analytics
};
