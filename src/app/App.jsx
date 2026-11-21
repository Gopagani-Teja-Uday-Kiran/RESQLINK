import React from 'react';
import { useEffect } from "react";
import "./utils/errorSuppression";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { auth } from "./utils/auth";
function SessionExpiredRedirect() {
  useEffect(() => {
    let redirecting = false;
    const handleExpiredSession = () => {
      if (redirecting) return;
      redirecting = true;
      auth.signOut().finally(() => window.location.replace("/login"));
    };
    window.addEventListener("resqlink:session-expired", handleExpiredSession);
    return () => window.removeEventListener("resqlink:session-expired", handleExpiredSession);
  }, []);
  return null;
}
function App() {
  return /* @__PURE__ */ React.createElement(ThemeProvider, null, /* @__PURE__ */ React.createElement(RouterProvider, { router }), /* @__PURE__ */ React.createElement(SessionExpiredRedirect, null), /* @__PURE__ */ React.createElement(Toaster, { position: "top-right" }));
}
var App_default = App;
export {
  App_default as default
};
