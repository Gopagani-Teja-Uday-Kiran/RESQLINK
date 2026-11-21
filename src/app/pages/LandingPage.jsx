import React from 'react';
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Heart,
  Ambulance,
  Hospital,
  MapPin,
  Shield,
  Zap,
  Activity,
  Phone,
  Bell,
  HeartPulse
} from "lucide-react";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Card3D } from "../components/Card3D";
function LandingPage() {
  const navigate = useNavigate();
  const features = [
    {
      icon: Zap,
      title: "Instant SOS",
      description: "One-tap emergency activation with automatic location sharing",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: MapPin,
      title: "Real-Time Tracking",
      description: "Live GPS tracking of ambulances with ETA calculations",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Activity,
      title: "AI Hospital Matching",
      description: "Smart algorithm finds nearest hospital with available beds",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: Shield,
      title: "Fall Detection",
      description: "Automatic emergency trigger on fall detection with 3-sec countdown",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: Bell,
      title: "Emergency Contacts",
      description: "Auto-notify loved ones with real-time tracking links",
      color: "text-pink-600 dark:text-pink-400"
    },
    {
      icon: Phone,
      title: "Live Communication",
      description: "In-app chat between patients, hospitals, and ambulances",
      color: "text-cyan-600 dark:text-cyan-400"
    }
  ];
  const stats = [
    { value: "< 2 min", label: "Avg Response Time" },
    { value: "98%", label: "Success Rate" },
    { value: "24/7", label: "Availability" },
    { value: "500+", label: "Lives Saved" }
  ];
  const userTypes = [
    {
      icon: Heart,
      title: "For Patients",
      description: "Quick SOS, real-time ambulance tracking, emergency contacts",
      gradient: "from-orange-500 to-red-500",
      route: "/signup"
    },
    {
      icon: Hospital,
      title: "For Hospitals",
      description: "Manage emergency requests, bed capacity, patient data",
      gradient: "from-green-500 to-emerald-600",
      route: "/signup"
    },
    {
      icon: Ambulance,
      title: "For Ambulances",
      description: "Accept emergencies, navigate to patients, update status",
      gradient: "from-blue-500 to-cyan-500",
      route: "/signup"
    }
  ];
  return /* @__PURE__ */ React.createElement(
    AnimatedBackground,
    {
      imageUrl: "https://images.unsplash.com/photo-1758404958502-44f156617bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZW1lcmdlbmN5JTIwdGVjaG5vbG9neSUyMEFJfGVufDF8fHx8MTc3MzU0MzYxMHww&ixlib=rb-4.1.0&q=80&w=1080",
      gradient: "from-pink-50/95 via-white/90 to-red-50/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95",
      particles: true
    },
    /* @__PURE__ */ React.createElement(
      motion.nav,
      {
        className: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50",
        initial: { y: -100 },
        animate: { y: 0 },
        transition: { type: "spring", stiffness: 100 }
      },
      /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement(
        motion.div,
        {
          whileHover: { scale: 1.05 },
          transition: { type: "spring", stiffness: 400 }
        },
        /* @__PURE__ */ React.createElement(Logo, { size: "md", variant: "default" })
      ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(
        Button,
        {
          variant: "ghost",
          onClick: () => navigate("/about"),
          className: "hidden sm:inline-flex"
        },
        "About"
      ), /* @__PURE__ */ React.createElement(
        Button,
        {
          variant: "ghost",
          onClick: () => navigate("/features"),
          className: "hidden sm:inline-flex"
        },
        "Features"
      ), /* @__PURE__ */ React.createElement(ThemeToggle, null), /* @__PURE__ */ React.createElement(
        Button,
        {
          variant: "outline",
          onClick: () => navigate("/login")
        },
        "Login"
      ), /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: () => navigate("/signup"),
          className: "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
        },
        "Get Started"
      ))))
    ),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium mb-6",
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.2 }
      },
      /* @__PURE__ */ React.createElement(HeartPulse, { className: "w-4 h-4" }),
      /* @__PURE__ */ React.createElement("span", null, "Trusted Emergency Response Platform")
    ), /* @__PURE__ */ React.createElement(
      motion.h1,
      {
        className: "text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 bg-clip-text text-transparent",
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.3 }
      },
      "Save Lives with",
      /* @__PURE__ */ React.createElement("br", null),
      "Real-Time Emergency Care"
    ), /* @__PURE__ */ React.createElement(
      motion.p,
      {
        className: "text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto",
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.4 }
      },
      "ResQLink connects patients, hospitals, and ambulances instantly during medical emergencies with AI-powered hospital matching and live GPS tracking."
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "flex flex-wrap gap-4 justify-center",
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.5 }
      },
      /* @__PURE__ */ React.createElement(
        Button,
        {
          size: "lg",
          onClick: () => navigate("/signup"),
          className: "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-lg px-8"
        },
        /* @__PURE__ */ React.createElement(Zap, { className: "w-5 h-5 mr-2" }),
        "Start Now - It's Free"
      ),
      /* @__PURE__ */ React.createElement(
        Button,
        {
          size: "lg",
          variant: "outline",
          onClick: () => navigate("/about"),
          className: "text-lg px-8"
        },
        "Learn More"
      )
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto" }, stats.map((stat, idx) => /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: idx,
        className: "text-center",
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay: 0.6 + idx * 0.1 },
        whileHover: {
          scale: 1.1,
          rotateY: 10,
          transition: { type: "spring", stiffness: 400 }
        },
        style: { transformStyle: "preserve-3d" }
      },
      /* @__PURE__ */ React.createElement("div", { className: "text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent" }, stat.value),
      /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1" }, stat.label)
    )))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20 bg-white/50 dark:bg-gray-800/50" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-16" }, /* @__PURE__ */ React.createElement(
      motion.h2,
      {
        className: "text-4xl font-bold mb-4 dark:text-white",
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true }
      },
      "Powerful Features"
    ), /* @__PURE__ */ React.createElement(
      motion.p,
      {
        className: "text-gray-600 dark:text-gray-300 max-w-2xl mx-auto",
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true },
        transition: { delay: 0.2 }
      },
      "Everything you need for effective emergency response in one platform"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto" }, features.map((feature, idx) => /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: idx,
        initial: { opacity: 0, y: 50 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { delay: idx * 0.1 }
      },
      /* @__PURE__ */ React.createElement(Card3D, null, /* @__PURE__ */ React.createElement(Card, { className: "h-full hover:shadow-xl transition-shadow dark:bg-gray-900/50 dark:border-gray-700 backdrop-blur-sm" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(
        motion.div,
        {
          className: `w-12 h-12 rounded-lg bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-3`,
          whileHover: {
            rotate: 360,
            scale: 1.2
          },
          transition: { type: "spring", stiffness: 200 }
        },
        /* @__PURE__ */ React.createElement(feature.icon, { className: `w-6 h-6 ${feature.color}` })
      ), /* @__PURE__ */ React.createElement(CardTitle, { className: "dark:text-white" }, feature.title), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, feature.description))))
    )))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-16" }, /* @__PURE__ */ React.createElement(
      motion.h2,
      {
        className: "text-4xl font-bold mb-4 dark:text-white",
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true }
      },
      "Who We Serve"
    ), /* @__PURE__ */ React.createElement(
      motion.p,
      {
        className: "text-gray-600 dark:text-gray-300 max-w-2xl mx-auto",
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true },
        transition: { delay: 0.2 }
      },
      "Tailored solutions for every participant in emergency healthcare"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-3 gap-8 max-w-6xl mx-auto" }, userTypes.map((type, idx) => /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: idx,
        initial: { opacity: 0, scale: 0.8 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true },
        transition: { delay: idx * 0.2 }
      },
      /* @__PURE__ */ React.createElement(Card3D, { onClick: () => navigate(type.route) }, /* @__PURE__ */ React.createElement(
        Card,
        {
          className: "hover:shadow-2xl transition-all cursor-pointer group dark:bg-gray-900/50 dark:border-gray-700 backdrop-blur-sm"
        },
        /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(
          motion.div,
          {
            className: `w-16 h-16 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-4`,
            whileHover: {
              scale: 1.2,
              rotate: 10
            },
            transition: { type: "spring", stiffness: 300, damping: 20 }
          },
          /* @__PURE__ */ React.createElement(type.icon, { className: "w-8 h-8 text-white" })
        ), /* @__PURE__ */ React.createElement(CardTitle, { className: "dark:text-white" }, type.title), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, type.description)),
        /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(
          Button,
          {
            className: `w-full bg-gradient-to-r ${type.gradient}`,
            onClick: (e) => {
              e.stopPropagation();
              navigate(type.route);
            }
          },
          "Get Started"
        ))
      ))
    )))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, y: 50 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true }
      },
      /* @__PURE__ */ React.createElement(Card3D, null, /* @__PURE__ */ React.createElement(Card, { className: "bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 border-0 text-white shadow-2xl" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-12 text-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-bold mb-4" }, "Ready to Save Lives?"), /* @__PURE__ */ React.createElement("p", { className: "text-xl mb-8 opacity-90" }, "Join thousands of users who trust ResQLink for emergency care"), /* @__PURE__ */ React.createElement(
        Button,
        {
          size: "lg",
          variant: "secondary",
          onClick: () => navigate("/signup"),
          className: "text-lg px-8 hover:scale-105 active:scale-95 transition-transform"
        },
        "Sign Up Now - Free Forever"
      ))))
    )),
    /* @__PURE__ */ React.createElement("footer", { className: "bg-gray-900 text-white py-12" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-4 gap-8" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Logo, { size: "sm", variant: "default" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 mt-4 text-sm" }, "Real-time emergency response platform connecting patients with care.")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold mb-4" }, "Product"), /* @__PURE__ */ React.createElement("ul", { className: "space-y-2 text-sm text-gray-400" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "Features")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "Pricing")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "FAQ")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold mb-4" }, "Company"), /* @__PURE__ */ React.createElement("ul", { className: "space-y-2 text-sm text-gray-400" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "About")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "Blog")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "Contact")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-semibold mb-4" }, "Legal"), /* @__PURE__ */ React.createElement("ul", { className: "space-y-2 text-sm text-gray-400" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "Privacy")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "Terms")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { href: "#", className: "hover:text-white" }, "Security"))))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400" }, /* @__PURE__ */ React.createElement("p", null, "\xA9 2026 ResQLink. All rights reserved. Built to save lives."))))
  );
}
export {
  LandingPage
};
