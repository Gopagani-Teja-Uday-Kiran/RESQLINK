import React from 'react';
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../contexts/ThemeContext";
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "ghost",
      size: "icon",
      onClick: toggleTheme,
      className: "relative",
      title: `Switch to ${theme === "light" ? "dark" : "light"} mode`
    },
    theme === "light" ? /* @__PURE__ */ React.createElement(Moon, { className: "w-5 h-5 text-gray-700" }) : /* @__PURE__ */ React.createElement(Sun, { className: "w-5 h-5 text-yellow-400" })
  );
}
export {
  ThemeToggle
};
