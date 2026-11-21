import React from 'react';
import { X, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";
function FallDetectionAlert({ isVisible, countdown, onCancel }) {
  if (!isVisible) return null;
  return /* @__PURE__ */ React.createElement(AnimatePresence, null, isVisible && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
    }
  ), /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.8, y: -50 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.8, y: -50 },
      transition: { type: "spring", damping: 25, stiffness: 300 },
      className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md px-4"
    },
    /* @__PURE__ */ React.createElement(Card, { className: "bg-gradient-to-br from-red-600 to-red-700 border-red-500 border-2 shadow-2xl overflow-hidden" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-8 relative" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 opacity-10" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" })), /* @__PURE__ */ React.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center mb-6" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        animate: {
          scale: [1, 1.1, 1],
          rotate: [0, -5, 5, 0]
        },
        transition: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
          type: "tween",
          ease: "easeInOut"
        },
        className: "bg-white/20 p-4 rounded-full"
      },
      /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-12 h-12 text-white" })
    )), /* @__PURE__ */ React.createElement("h3", { className: "text-2xl font-bold text-white mb-2 text-center" }, "\u{1F6A8} Fall Detected!"), /* @__PURE__ */ React.createElement("p", { className: "text-white/90 text-center mb-6" }, "Auto-triggering emergency SOS in"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center mb-6" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        key: countdown,
        initial: { scale: 0.5, opacity: 0, rotate: -180 },
        animate: { scale: 1, opacity: 1, rotate: 0 },
        transition: {
          type: "spring",
          damping: 20,
          stiffness: 300
        },
        className: "relative"
      },
      /* @__PURE__ */ React.createElement(
        motion.div,
        {
          animate: {
            scale: [1, 1.2, 1]
          },
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          },
          className: "absolute inset-0 rounded-full bg-white/30 blur-xl"
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "relative w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-2xl" }, /* @__PURE__ */ React.createElement(
        motion.span,
        {
          key: `countdown-${countdown}`,
          initial: { scale: 1.5, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: 0.3 },
          className: "text-7xl font-black text-red-600"
        },
        countdown
      ))
    )), /* @__PURE__ */ React.createElement("div", { className: "mb-6 bg-white/20 rounded-full h-2 overflow-hidden" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "bg-white h-full rounded-full",
        initial: { width: "100%" },
        animate: { width: `${(countdown ?? 0) / 3 * 100}%` },
        transition: { duration: 0.3 }
      }
    )), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 }
      },
      /* @__PURE__ */ React.createElement(
        Button,
        {
          onClick: onCancel,
          className: "w-full bg-white text-red-600 hover:bg-gray-100 font-bold text-lg py-6 shadow-lg",
          size: "lg"
        },
        "\u270B I'm Okay - Cancel Alert"
      )
    ), /* @__PURE__ */ React.createElement("p", { className: "text-white/70 text-xs text-center mt-4" }, "Tap cancel if you don't need help")), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onCancel,
        className: "absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20"
      },
      /* @__PURE__ */ React.createElement(X, { className: "w-6 h-6" })
    )))
  )));
}
export {
  FallDetectionAlert
};
