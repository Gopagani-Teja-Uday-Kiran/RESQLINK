import React from 'react';
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Heart, Home, ArrowLeft } from "lucide-react";
function NotFound() {
  const navigate = useNavigate();
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 flex items-center justify-center p-6" }, /* @__PURE__ */ React.createElement(Card, { className: "max-w-md w-full backdrop-blur-sm bg-white/80 shadow-xl border-pink-100" }, /* @__PURE__ */ React.createElement(CardContent, { className: "p-12 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center mx-auto mb-6" }, /* @__PURE__ */ React.createElement(Heart, { className: "w-10 h-10 text-white fill-white" })), /* @__PURE__ */ React.createElement("h1", { className: "text-6xl font-bold text-gray-300 mb-4" }, "404"), /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold mb-2" }, "Page Not Found"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mb-8" }, "The page you're looking for doesn't exist or has been moved."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 justify-center" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      variant: "outline",
      onClick: () => navigate(-1)
    },
    /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-4 h-4 mr-2" }),
    "Go Back"
  ), /* @__PURE__ */ React.createElement(
    Button,
    {
      onClick: () => navigate("/"),
      className: "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
    },
    /* @__PURE__ */ React.createElement(Home, { className: "w-4 h-4 mr-2" }),
    "Home"
  )))));
}
export {
  NotFound
};
