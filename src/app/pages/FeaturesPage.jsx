import React from 'react';
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Zap,
  MapPin,
  Activity,
  Shield,
  Bell,
  Phone,
  Navigation,
  HeartPulse,
  Users,
  BarChart,
  MessageSquare,
  Clock,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
function FeaturesPage() {
  const navigate = useNavigate();
  const features = [
    {
      icon: Zap,
      title: "One-Tap SOS Emergency",
      description: "Activate emergency response instantly with a single tap. Location is automatically captured and shared.",
      benefits: ["Instant activation", "Auto-location sharing", "Priority routing"],
      color: "from-orange-500 to-red-500"
    },
    {
      icon: MapPin,
      title: "Real-Time GPS Tracking",
      description: "Track ambulances live on the map with accurate ETA calculations and distance updates.",
      benefits: ["Live ambulance location", "ETA estimation", "Route optimization"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Activity,
      title: "AI Hospital Matching",
      description: "Intelligent algorithm finds the nearest hospital with available beds based on emergency type.",
      benefits: ["Smart bed availability", "Specialty matching", "Distance optimization"],
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Shield,
      title: "Fall Detection System",
      description: "Automatic emergency trigger when a fall is detected, with 3-second countdown to cancel false alarms.",
      benefits: ["Auto-detection", "Smart countdown", "False alarm prevention"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Bell,
      title: "Emergency Contact Alerts",
      description: "Automatically notify your emergency contacts with real-time tracking links when SOS is activated.",
      benefits: ["Auto-notification", "Public tracking links", "Multiple contacts"],
      color: "from-pink-500 to-red-500"
    },
    {
      icon: MessageSquare,
      title: "Live Chat Communication",
      description: "In-app messaging between patients, hospitals, and ambulances for seamless coordination.",
      benefits: ["Real-time chat", "Multi-party support", "Message history"],
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Navigation,
      title: "Turn-by-Turn Navigation",
      description: "Ambulance drivers get precise directions to patient location and destination hospital.",
      benefits: ["GPS navigation", "Traffic updates", "Fastest routes"],
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: HeartPulse,
      title: "Medical Profile Management",
      description: "Store blood type, allergies, medications, and medical conditions for quick access during emergencies.",
      benefits: ["Complete medical history", "Quick access", "Secure storage"],
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Multi-Role System",
      description: "Separate dashboards for patients, hospitals, and ambulances with role-specific features.",
      benefits: ["Role-based access", "Custom workflows", "Optimized UX"],
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: BarChart,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics for hospitals and ambulances to track performance and response times.",
      benefits: ["Real-time stats", "Performance metrics", "Visual charts"],
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Clock,
      title: "Emergency Workflow Stages",
      description: "Track emergency progress through stages: Pending \u2192 Assigned \u2192 Enroute \u2192 Arrived \u2192 Completed.",
      benefits: ["Stage tracking", "Progress updates", "Status visibility"],
      color: "from-teal-500 to-green-500"
    },
    {
      icon: Phone,
      title: "Push Notifications",
      description: "Instant notifications for status updates, new emergencies, and important alerts.",
      benefits: ["Real-time alerts", "Custom preferences", "Critical updates"],
      color: "from-rose-500 to-red-500"
    }
  ];
  return /* @__PURE__ */ React.createElement(
    AnimatedBackground,
    {
      imageUrl: "https://images.unsplash.com/photo-1663153206213-d45285ce3fe2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwdGVjaG5vbG9neSUyMHNtYXJ0cGhvbmUlMjBhcHB8ZW58MXx8fHwxNzczNTQ0Njk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      gradient: "from-pink-50/95 via-white/90 to-red-50/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95"
    },
    /* @__PURE__ */ React.createElement(
      motion.nav,
      {
        className: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50",
        initial: { y: -100 },
        animate: { y: 0 }
      },
      /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement(Logo, { size: "md", variant: "default" }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: () => navigate("/") }, /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Home"), /* @__PURE__ */ React.createElement(ThemeToggle, null), /* @__PURE__ */ React.createElement(Button, { onClick: () => navigate("/signup"), className: "bg-gradient-to-r from-pink-500 to-red-500" }, "Sign Up"))))
    ),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20 text-center" }, /* @__PURE__ */ React.createElement(
      motion.h1,
      {
        className: "text-5xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent",
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
      },
      "Powerful Features"
    ), /* @__PURE__ */ React.createElement(
      motion.p,
      {
        className: "text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto",
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.2 }
      },
      "Everything you need for comprehensive emergency response, built with cutting-edge technology"
    )),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20" }, /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-20" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: -50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true },
        className: "order-2 md:order-1"
      },
      /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl overflow-hidden shadow-2xl" }, /* @__PURE__ */ React.createElement(
        ImageWithFallback,
        {
          src: "https://images.unsplash.com/photo-1597188558265-f0fb7428a243?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWJ1bGFuY2UlMjBlbWVyZ2VuY3klMjB2ZWhpY2xlfGVufDF8fHx8MTc3MzUwMTI0MHww&ixlib=rb-4.1.0&q=80&w=1080",
          alt: "Emergency ambulance",
          className: "w-full h-96 object-cover"
        }
      ))
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: 50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true },
        className: "order-1 md:order-2 flex flex-col justify-center"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-8 h-8 text-white" })),
      /* @__PURE__ */ React.createElement("h3", { className: "text-3xl font-bold mb-4 dark:text-white" }, "Real-Time Ambulance Tracking"),
      /* @__PURE__ */ React.createElement("p", { className: "text-lg text-gray-600 dark:text-gray-300 mb-6" }, "Track ambulances live on an interactive map with precise GPS coordinates. Get accurate ETA calculations and real-time route updates as the ambulance navigates to your location."),
      /* @__PURE__ */ React.createElement("ul", { className: "space-y-3" }, ["Live GPS positioning", "ETA calculations", "Traffic-aware routing", "Distance updates"].map((item, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(CheckCircle, { className: "w-4 h-4 text-blue-600 dark:text-blue-400" })), /* @__PURE__ */ React.createElement("span", { className: "text-gray-700 dark:text-gray-300" }, item))))
    )), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-20" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: -50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true },
        className: "flex flex-col justify-center"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6" }, /* @__PURE__ */ React.createElement(Activity, { className: "w-8 h-8 text-white" })),
      /* @__PURE__ */ React.createElement("h3", { className: "text-3xl font-bold mb-4 dark:text-white" }, "AI-Powered Hospital Matching"),
      /* @__PURE__ */ React.createElement("p", { className: "text-lg text-gray-600 dark:text-gray-300 mb-6" }, "Our intelligent algorithm analyzes nearby hospitals in real-time, checking bed availability, specializations, and distance to find the perfect match for your emergency."),
      /* @__PURE__ */ React.createElement("ul", { className: "space-y-3" }, ["Real-time bed availability", "Specialty matching", "Distance optimization", "ICU capacity tracking"].map((item, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(CheckCircle, { className: "w-4 h-4 text-green-600 dark:text-green-400" })), /* @__PURE__ */ React.createElement("span", { className: "text-gray-700 dark:text-gray-300" }, item))))
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: 50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true }
      },
      /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl overflow-hidden shadow-2xl" }, /* @__PURE__ */ React.createElement(
        ImageWithFallback,
        {
          src: "https://images.unsplash.com/photo-1710074213379-2a9c2653046a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGJlZCUyMG1lZGljYWwlMjBlcXVpcG1lbnR8ZW58MXx8fHwxNzczNTQyMjc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
          alt: "Hospital bed medical equipment",
          className: "w-full h-96 object-cover"
        }
      ))
    )), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-12 max-w-6xl mx-auto" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: -50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true },
        className: "order-2 md:order-1"
      },
      /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl overflow-hidden shadow-2xl" }, /* @__PURE__ */ React.createElement(
        ImageWithFallback,
        {
          src: "https://images.unsplash.com/photo-1766325693423-69e9fe20605b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbWVyZ2VuY3klMjBtZWRpY2FsJTIwc2VydmljZSUyMHBhcmFtZWRpY3xlbnwxfHx8fDE3NzM1NDQ2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
          alt: "Emergency medical service",
          className: "w-full h-96 object-cover"
        }
      ))
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: 50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true },
        className: "order-1 md:order-2 flex flex-col justify-center"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6" }, /* @__PURE__ */ React.createElement(Zap, { className: "w-8 h-8 text-white" })),
      /* @__PURE__ */ React.createElement("h3", { className: "text-3xl font-bold mb-4 dark:text-white" }, "Instant SOS Activation"),
      /* @__PURE__ */ React.createElement("p", { className: "text-lg text-gray-600 dark:text-gray-300 mb-6" }, "One tap triggers immediate emergency response. Your location is automatically captured and shared with the nearest ambulance and hospital, ensuring the fastest possible response time."),
      /* @__PURE__ */ React.createElement("ul", { className: "space-y-3" }, ["One-tap activation", "Auto location sharing", "Emergency contacts notified", "Immediate dispatch"].map((item, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(CheckCircle, { className: "w-4 h-4 text-orange-600 dark:text-orange-400" })), /* @__PURE__ */ React.createElement("span", { className: "text-gray-700 dark:text-gray-300" }, item))))
    ))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20 bg-white/50 dark:bg-gray-800/50" }, /* @__PURE__ */ React.createElement(
      motion.h2,
      {
        className: "text-4xl font-bold mb-12 text-center dark:text-white",
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true }
      },
      "All Features"
    ), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto" }, features.map((feature, idx) => /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: idx,
        initial: { opacity: 0, y: 50 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay: idx * 0.05 }
      },
      /* @__PURE__ */ React.createElement(
        Card,
        {
          className: "hover:shadow-2xl transition-all group dark:bg-gray-900/50 dark:border-gray-700 h-full"
        },
        /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(
          motion.div,
          {
            className: `w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`,
            whileHover: { rotate: 360 },
            transition: { duration: 0.5 }
          },
          /* @__PURE__ */ React.createElement(feature.icon, { className: "w-8 h-8 text-white" })
        ), /* @__PURE__ */ React.createElement(CardTitle, { className: "text-xl dark:text-white" }, feature.title), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, feature.description)),
        /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("ul", { className: "space-y-2" }, feature.benefits.map((benefit, i) => /* @__PURE__ */ React.createElement("li", { key: i, className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-red-500" }), benefit))))
      )
    )))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20 bg-white/50 dark:bg-gray-800/50" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-bold mb-12 text-center dark:text-white" }, "How It Works"), /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-8" }, [
      {
        step: "1",
        title: "Patient Activates SOS",
        description: "Patient presses emergency SOS button. Location is captured and sent to the system.",
        color: "from-orange-500 to-red-500"
      },
      {
        step: "2",
        title: "AI Finds Best Hospital",
        description: "Algorithm analyzes nearby hospitals, bed availability, and specializations to find the perfect match.",
        color: "from-green-500 to-emerald-600"
      },
      {
        step: "3",
        title: "Ambulance Assigned",
        description: "Nearest available ambulance gets the emergency request with patient location and destination.",
        color: "from-blue-500 to-cyan-500"
      },
      {
        step: "4",
        title: "Real-Time Tracking",
        description: "Patient, hospital, and contacts track ambulance location live with ETA updates.",
        color: "from-purple-500 to-pink-500"
      },
      {
        step: "5",
        title: "Arrival & Handoff",
        description: "Hospital receives patient data in advance. Seamless handoff with complete medical history.",
        color: "from-pink-500 to-red-500"
      }
    ].map((item, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex gap-6 items-start" }, /* @__PURE__ */ React.createElement("div", { className: `flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-2xl font-bold` }, item.step), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold mb-2 dark:text-white" }, item.title), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, item.description))))))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20" }, /* @__PURE__ */ React.createElement(Card, { className: "bg-gradient-to-r from-pink-500 to-red-500 border-0 text-white" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-12 text-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-bold mb-4" }, "Experience All Features"), /* @__PURE__ */ React.createElement("p", { className: "text-xl mb-8 opacity-90" }, "Sign up now and get access to all features completely free"), /* @__PURE__ */ React.createElement(Button, { size: "lg", variant: "secondary", onClick: () => navigate("/signup"), className: "text-lg px-8" }, "Start Free Trial")))),
    /* @__PURE__ */ React.createElement("footer", { className: "bg-gray-900 text-white py-8" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 text-center" }, /* @__PURE__ */ React.createElement(Logo, { size: "sm", variant: "default" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 mt-4" }, "\xA9 2026 ResQLink. Built to save lives.")))
  );
}
export {
  FeaturesPage
};
