import React from 'react';
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
function SOSButton3D({ onClick, disabled = false }) {
  return /* @__PURE__ */ React.createElement("div", { className: "relative flex items-center justify-center" }, /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: "absolute w-64 h-64 rounded-full bg-red-500/30",
      animate: {
        scale: [1, 1.3, 1],
        opacity: [0.5, 0, 0.5]
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        type: "tween"
      }
    }
  ), /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: "absolute w-64 h-64 rounded-full bg-red-500/20",
      animate: {
        scale: [1, 1.5, 1],
        opacity: [0.3, 0, 0.3]
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5,
        type: "tween"
      }
    }
  ), /* @__PURE__ */ React.createElement(
    motion.button,
    {
      onClick,
      disabled,
      className: "relative w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-2xl border-8 border-white dark:border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
      style: {
        transformStyle: "preserve-3d"
      },
      whileHover: !disabled ? {
        scale: 1.1,
        rotateX: 10,
        rotateY: 10
      } : {},
      whileTap: !disabled ? {
        scale: 0.95,
        rotateX: -5,
        rotateY: -5
      } : {},
      animate: !disabled ? {
        y: [0, -10, 0],
        boxShadow: [
          "0 25px 50px -12px rgba(239, 68, 68, 0.5)",
          "0 35px 60px -15px rgba(239, 68, 68, 0.7)",
          "0 25px 50px -12px rgba(239, 68, 68, 0.5)"
        ]
      } : {},
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        type: "tween"
      }
    },
    /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "absolute inset-0 rounded-full bg-gradient-to-br from-red-400/50 to-transparent",
        animate: {
          opacity: [0.5, 1, 0.5]
        },
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          type: "tween"
        }
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "relative z-10 flex flex-col items-center justify-center h-full text-white" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        animate: {
          scale: [1, 1.2, 1]
        },
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          type: "tween"
        }
      },
      /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-16 h-16 mb-2" })
    ), /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-bold tracking-wider" }, "SOS"), /* @__PURE__ */ React.createElement("span", { className: "text-sm mt-1 opacity-90" }, "Emergency")),
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "absolute inset-0 rounded-full bg-black/20",
        style: {
          transform: "translateZ(-10px)"
        }
      }
    )
  ), /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: "absolute bottom-0 w-40 h-8 bg-black/30 rounded-full blur-xl",
      animate: {
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3]
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
        type: "tween"
      }
    }
  ));
}
export {
  SOSButton3D
};
