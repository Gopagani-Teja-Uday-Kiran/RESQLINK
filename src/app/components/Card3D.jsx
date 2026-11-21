import React from 'react';
import { motion } from "motion/react";
import { useState } from "react";
function Card3D({ children, className = "", intensity = 10, onClick, disabled = false }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const handleMouseMove = (e) => {
    if (disabled) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateXValue = (y - centerY) / centerY * -intensity;
    const rotateYValue = (x - centerX) / centerX * intensity;
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };
  const handleMouseLeave = () => {
    if (disabled) return;
    setRotateX(0);
    setRotateY(0);
  };
  if (disabled) {
    return /* @__PURE__ */ React.createElement("div", { className, onClick }, children);
  }
  return /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: `relative ${className}`,
      style: {
        perspective: "1000px"
      },
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onClick,
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 }
    },
    /* @__PURE__ */ React.createElement(
      motion.div,
      {
        style: {
          transformStyle: "preserve-3d"
        },
        animate: {
          rotateX,
          rotateY
        },
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30
        }
      },
      children
    )
  );
}
export {
  Card3D
};
