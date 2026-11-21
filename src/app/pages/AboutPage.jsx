import React from 'react';
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Heart, Target, Eye, Users, Award, Shield, ArrowLeft } from "lucide-react";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
function AboutPage() {
  const navigate = useNavigate();
  const values = [
    {
      icon: Heart,
      title: "Life First",
      description: "Every second counts in emergencies. Our platform prioritizes rapid response and real-time coordination."
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description: "HIPAA-compliant platform ensuring patient data privacy and secure communications."
    },
    {
      icon: Users,
      title: "Community Impact",
      description: "Building a network of care that connects patients, hospitals, and ambulances seamlessly."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Continuously improving with AI algorithms and user feedback to save more lives."
    }
  ];
  const team = [
    { name: "Dr. Sarah Johnson", role: "Medical Advisor", avatar: "\u{1F469}\u200D\u2695\uFE0F" },
    { name: "Rajesh Kumar", role: "Tech Lead", avatar: "\u{1F468}\u200D\u{1F4BB}" },
    { name: "Emily Chen", role: "Product Manager", avatar: "\u{1F469}\u200D\u{1F4BC}" },
    { name: "Michael Brown", role: "UX Designer", avatar: "\u{1F468}\u200D\u{1F3A8}" }
  ];
  return /* @__PURE__ */ React.createElement(
    AnimatedBackground,
    {
      imageUrl: "https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwdGVhbSUyMGRvY3RvcnMlMjBob3NwaXRhbHxlbnwxfHx8fDE3NzM1NDQ2OTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
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
      "About ResQLink"
    ), /* @__PURE__ */ React.createElement(
      motion.p,
      {
        className: "text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto",
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.2 }
      },
      "We're on a mission to transform emergency healthcare response by leveraging technology to connect patients with life-saving care faster than ever before."
    )),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20" }, /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-8 max-w-5xl mx-auto" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: -50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true }
      },
      /* @__PURE__ */ React.createElement(Card, { className: "dark:bg-gray-900/80 dark:border-gray-700 backdrop-blur-sm h-full" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mb-4" }, /* @__PURE__ */ React.createElement(Target, { className: "w-8 h-8 text-white" })), /* @__PURE__ */ React.createElement(CardTitle, { className: "text-2xl dark:text-white" }, "Our Mission")), /* @__PURE__ */ React.createElement(CardContent, { className: "dark:text-gray-300" }, /* @__PURE__ */ React.createElement("p", { className: "text-lg leading-relaxed" }, "To save lives by building the world's most efficient emergency response network, ensuring that every patient gets timely medical care through real-time coordination between patients, hospitals, and ambulances.")))
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: 50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true }
      },
      /* @__PURE__ */ React.createElement(Card, { className: "dark:bg-gray-900/80 dark:border-gray-700 backdrop-blur-sm h-full" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4" }, /* @__PURE__ */ React.createElement(Eye, { className: "w-8 h-8 text-white" })), /* @__PURE__ */ React.createElement(CardTitle, { className: "text-2xl dark:text-white" }, "Our Vision")), /* @__PURE__ */ React.createElement(CardContent, { className: "dark:text-gray-300" }, /* @__PURE__ */ React.createElement("p", { className: "text-lg leading-relaxed" }, "A world where distance and time never stand between a patient and emergency care. We envision a future where AI-powered systems predict, prevent, and respond to medical emergencies with unprecedented speed and accuracy.")))
    ))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20 bg-white/50 dark:bg-gray-800/50" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-6xl mx-auto" }, /* @__PURE__ */ React.createElement(
      motion.h2,
      {
        className: "text-4xl font-bold mb-12 text-center dark:text-white",
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true }
      },
      "Our Story"
    ), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-12 items-center" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: -50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true }
      },
      /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl overflow-hidden shadow-2xl" }, /* @__PURE__ */ React.createElement(
        ImageWithFallback,
        {
          src: "https://images.unsplash.com/photo-1633488781325-d36e6818d0c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXRpZW50JTIwY2FyZSUyMGRvY3RvciUyMG51cnNlfGVufDF8fHx8MTc3MzU0NDY5N3ww&ixlib=rb-4.1.0&q=80&w=1080",
          alt: "Patient care",
          className: "w-full h-96 object-cover"
        }
      ))
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, x: 50 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: true }
      },
      /* @__PURE__ */ React.createElement("div", { className: "prose prose-lg dark:prose-invert" }, /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6" }, "ResQLink was born from a personal tragedy. When our founder's mother suffered a heart attack, precious minutes were lost trying to find an ambulance and a hospital with available beds. That experience revealed critical gaps in emergency response systems."), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6" }, "We realized that in the age of instant connectivity, emergency healthcare was still plagued by miscommunication, delays, and fragmented systems. We decided to change that."), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-300 text-lg leading-relaxed" }, "Today, ResQLink connects thousands of patients with hospitals and ambulances every day, reducing response times from an average of 12 minutes to under 2 minutes. We're proud to have saved over 500 lives and counting."))
    )))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-bold mb-12 text-center dark:text-white" }, "Our Values"), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" }, values.map((value, idx) => /* @__PURE__ */ React.createElement(Card, { key: idx, className: "text-center hover:shadow-xl transition-shadow dark:bg-gray-900/50 dark:border-gray-700" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-red-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mx-auto mb-4" }, /* @__PURE__ */ React.createElement(value.icon, { className: "w-8 h-8 text-red-600 dark:text-red-400" })), /* @__PURE__ */ React.createElement(CardTitle, { className: "dark:text-white" }, value.title)), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, value.description)))))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20 bg-white/50 dark:bg-gray-800/50" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-bold mb-12 text-center dark:text-white" }, "Meet Our Team"), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-4 gap-8 max-w-5xl mx-auto" }, team.map((member, idx) => /* @__PURE__ */ React.createElement(Card, { key: idx, className: "text-center dark:bg-gray-900/50 dark:border-gray-700" }, /* @__PURE__ */ React.createElement(CardContent, { className: "pt-6" }, /* @__PURE__ */ React.createElement("div", { className: "text-6xl mb-4" }, member.avatar), /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-lg dark:text-white" }, member.name), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, member.role)))))),
    /* @__PURE__ */ React.createElement("section", { className: "container mx-auto px-6 py-20" }, /* @__PURE__ */ React.createElement(Card, { className: "bg-gradient-to-r from-pink-500 to-red-500 border-0 text-white" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-12 text-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-bold mb-4" }, "Join Our Mission"), /* @__PURE__ */ React.createElement("p", { className: "text-xl mb-8 opacity-90" }, "Be part of the revolution in emergency healthcare"), /* @__PURE__ */ React.createElement(Button, { size: "lg", variant: "secondary", onClick: () => navigate("/signup"), className: "text-lg px-8" }, "Get Started Today")))),
    /* @__PURE__ */ React.createElement("footer", { className: "bg-gray-900 text-white py-8" }, /* @__PURE__ */ React.createElement("div", { className: "container mx-auto px-6 text-center" }, /* @__PURE__ */ React.createElement(Logo, { size: "sm", variant: "default" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-400 mt-4" }, "\xA9 2026 ResQLink. Saving lives, one connection at a time.")))
  );
}
export {
  AboutPage
};
