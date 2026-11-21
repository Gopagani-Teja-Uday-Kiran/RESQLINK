import React from 'react';
import { useNavigate } from "react-router";
function Logo({ size = "md", showText = true, variant = "default", clickable = true }) {
  const navigate = useNavigate();
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-3xl" }
  };
  const gradients = {
    patient: "from-orange-500 to-red-500",
    hospital: "from-green-500 to-emerald-600",
    ambulance: "from-blue-500 to-cyan-500",
    default: "from-pink-500 via-red-500 to-orange-500"
  };
  const iconSize = sizes[size].icon;
  const textSize = sizes[size].text;
  const gradient = gradients[variant];
  const handleClick = () => {
    if (clickable) {
      navigate("/");
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `flex items-center gap-3 ${clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`,
      onClick: handleClick,
      role: clickable ? "button" : void 0,
      tabIndex: clickable ? 0 : void 0
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `relative rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`,
        style: { width: iconSize, height: iconSize }
      },
      /* @__PURE__ */ React.createElement("div", { className: `absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-75 animate-pulse` }),
      /* @__PURE__ */ React.createElement(
        "svg",
        {
          width: iconSize * 0.6,
          height: iconSize * 0.6,
          viewBox: "0 0 24 24",
          fill: "none",
          className: "relative z-10"
        },
        /* @__PURE__ */ React.createElement(
          "path",
          {
            d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
            fill: "white",
            opacity: "0.9"
          }
        ),
        /* @__PURE__ */ React.createElement(
          "path",
          {
            d: "M13 8h-2v3H8v2h3v3h2v-3h3v-2h-3z",
            fill: "#ff0040",
            opacity: "0.95"
          }
        )
      ),
      /* @__PURE__ */ React.createElement("div", { className: "absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-60" }),
      /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-40" })
    ),
    showText && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col leading-tight" }, /* @__PURE__ */ React.createElement("span", { className: `font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${textSize}` }, "ResQLink"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wide" }, "Emergency Response"))
  );
}
export {
  Logo
};
