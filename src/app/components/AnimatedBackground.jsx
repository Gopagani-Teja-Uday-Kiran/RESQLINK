import React from 'react';
import { motion } from "motion/react";
function AnimatedBackground({
  children,
  imageUrl,
  gradient = "from-pink-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
  className = "",
  overlay = true,
  particles = false
}) {
  return /* @__PURE__ */ React.createElement("div", { className: `min-h-screen relative overflow-hidden ${className}` }, imageUrl && /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: "absolute inset-0 z-0",
      initial: { scale: 1.1 },
      animate: {
        scale: [1.1, 1.15, 1.1],
        y: [0, -20, 0]
      },
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
        type: "tween"
      }
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-full h-full bg-cover bg-center",
        style: {
          backgroundImage: `url(${imageUrl})`,
          filter: "blur(1px)"
        }
      }
    )
  ), overlay && /* @__PURE__ */ React.createElement("div", { className: `absolute inset-0 z-0 bg-gradient-to-br ${gradient} ${imageUrl ? "opacity-90" : "opacity-100"}` }), particles && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: "absolute inset-0 z-0 opacity-20 dark:opacity-10",
      style: {
        backgroundImage: "radial-gradient(circle, rgba(255, 59, 48, 0.3) 1px, transparent 1px)",
        backgroundSize: "50px 50px"
      },
      animate: {
        backgroundPosition: ["0px 0px", "50px 50px"]
      },
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  ), [...Array(5)].map((_, i) => /* @__PURE__ */ React.createElement(
    motion.div,
    {
      key: i,
      className: "absolute rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 blur-3xl",
      style: {
        width: `${200 + i * 50}px`,
        height: `${200 + i * 50}px`,
        left: `${i * 20}%`,
        top: `${i * 15}%`
      },
      animate: {
        x: [0, 100, 0],
        y: [0, -100, 0],
        scale: [1, 1.2, 1]
      },
      transition: {
        duration: 10 + i * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.5,
        type: "tween"
      }
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "relative z-10" }, children));
}
export {
  AnimatedBackground
};
