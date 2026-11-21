import React from 'react';
import { motion } from "motion/react";
const images = [
  "https://images.unsplash.com/photo-1613256168695-b13ed5ba9500?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZW1lcmdlbmN5JTIwYWJzdHJhY3QlMjBncmFkaWVudHxlbnwxfHx8fDE3NzM1NDQwODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1584884013345-88b9cf247c0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwdGVjaG5vbG9neSUyMGJsdWUlMjBnbG93fGVufDF8fHx8MTc3MzU0NDA4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1772295697403-a0efe5bf0aae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbWVyZ2VuY3klMjBsaWdodHMlMjBhbWJ1bGFuY2UlMjBuaWdodHxlbnwxfHx8fDE3NzM1NDQwODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
];
function DecorativeImages({
  variant = "patient",
  position = "top-right",
  size = "md"
}) {
  const imageIndex = variant === "patient" ? 0 : variant === "hospital" ? 1 : 2;
  const imageUrl = images[imageIndex];
  const sizeClasses = {
    sm: "w-40 h-40",
    md: "w-60 h-60",
    lg: "w-80 h-80"
  };
  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  };
  return /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: `fixed ${positionClasses[position]} z-0 pointer-events-none overflow-hidden`,
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 0.1, scale: 1 },
      transition: { duration: 1.5, ease: "easeOut" }
    },
    /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: `${sizeClasses[size]} rounded-full blur-3xl`,
        animate: {
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        },
        transition: {
          duration: 20,
          repeat: Infinity,
          ease: "linear",
          type: "tween"
        },
        style: {
          background: `linear-gradient(135deg, 
            ${variant === "patient" ? "rgba(236, 72, 153, 0.3), rgba(239, 68, 68, 0.3)" : variant === "hospital" ? "rgba(34, 197, 94, 0.3), rgba(20, 184, 166, 0.3)" : "rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3)"})`
        }
      }
    ),
    /* @__PURE__ */ React.createElement(
      "img",
      {
        src: imageUrl,
        alt: "Decorative background",
        className: `absolute inset-0 ${sizeClasses[size]} object-cover rounded-full mix-blend-overlay opacity-40 dark:opacity-20`
      }
    )
  );
}
export {
  DecorativeImages
};
