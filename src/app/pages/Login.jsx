import React from 'react';
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Mail, Lock } from "lucide-react";
import { auth } from "../utils/auth";
import { toast } from "sonner";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Card3D } from "../components/Card3D";
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email first, then sign in.");
        } else {
          toast.error("Login failed: " + error.message);
        }
        setLoading(false);
        return;
      }
      if (data?.session) {
        toast.success("Login successful!");
        const { data: userData } = await auth.getUser();
        const role = userData?.user?.user_metadata?.role;
        if (role === "patient") {
          navigate("/patient");
        } else if (role === "hospital") {
          navigate("/hospital");
        } else if (role === "ambulance") {
          navigate("/ambulance");
        } else if (role === "admin") {
          navigate("/admin");
        }
      }
    } catch (error) {
      toast.error("Login error: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement(
    AnimatedBackground,
    {
      imageUrl: "https://images.unsplash.com/photo-1747224317356-6dd1a4a078fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwZGlnaXRhbCUyMGludGVyZmFjZSUyMGZ1dHVyaXN0aWN8ZW58MXx8fHwxNzczNTQzNjEwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      gradient: "from-orange-50/95 via-white/90 to-red-50/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95",
      particles: true
    },
    /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex items-center justify-center p-8" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "absolute top-4 right-4",
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 }
      },
      /* @__PURE__ */ React.createElement(ThemeToggle, null)
    ), /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-md" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "text-center mb-8 cursor-pointer",
        onClick: () => navigate("/"),
        initial: { opacity: 0, y: -50 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 100 },
        whileHover: { scale: 1.05 }
      },
      /* @__PURE__ */ React.createElement("div", { className: "inline-flex justify-center mb-4" }, /* @__PURE__ */ React.createElement(Logo, { size: "lg", variant: "patient", showText: false })),
      /* @__PURE__ */ React.createElement("h1", { className: "text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2" }, "ResQLink"),
      /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, "Emergency Response Platform")
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.2 }
      },
      /* @__PURE__ */ React.createElement(Card3D, { intensity: 15, disabled: true }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border-orange-100 dark:border-gray-700" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-2xl dark:text-gray-200" }, "Welcome Back"), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, "Sign in to your account to continue")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement("form", { onSubmit: handleLogin, className: "space-y-4" }, /* @__PURE__ */ React.createElement(
        motion.div,
        {
          className: "space-y-2",
          initial: { x: -20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { delay: 0.3 }
        },
        /* @__PURE__ */ React.createElement(Label, { htmlFor: "email" }, "Email"),
        /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
          Input,
          {
            id: "email",
            name: "email",
            type: "email",
            autoComplete: "username",
            placeholder: "Enter your email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            className: "pl-10",
            required: true
          }
        ))
      ), /* @__PURE__ */ React.createElement(
        motion.div,
        {
          className: "space-y-2",
          initial: { x: -20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { delay: 0.4 }
        },
        /* @__PURE__ */ React.createElement(Label, { htmlFor: "password" }, "Password"),
        /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
          Input,
          {
            id: "password",
            name: "password",
            type: "password",
            autoComplete: "current-password",
            placeholder: "Enter your password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            className: "pl-10",
            required: true
          }
        ))
      ), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => navigate("/forgot-password"), className: "text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400" }, "Forgot password?")), /* @__PURE__ */ React.createElement(
        motion.div,
        {
          initial: { y: 20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { delay: 0.5 }
        },
        /* @__PURE__ */ React.createElement(
          Button,
          {
            type: "submit",
            className: "w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 active:scale-95 transition-all",
            disabled: loading
          },
          loading ? "Signing in..." : "Sign In"
        )
      )), /* @__PURE__ */ React.createElement(
        motion.div,
        {
          className: "mt-6 text-center",
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.6 }
        },
        /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Don't have an account?", " ", /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => navigate("/signup"),
            className: "text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold"
          },
          "Sign Up"
        ))
      ))))
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "mt-8 text-center text-sm text-gray-500 dark:text-gray-400",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.7 }
      },
      /* @__PURE__ */ React.createElement("p", null, "Emergency? Call 911 immediately")
    )))
  );
}
export {
  Login
};
