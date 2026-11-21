import React from 'react';
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { User, Building2, Ambulance, Mail, Lock, Phone } from "lucide-react";
import { auth } from "../utils/auth";
import { api } from "../utils/api";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { HospitalLocationPicker } from "../components/HospitalLocationPicker";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Card3D } from "../components/Card3D";
function hospitalPrefix(name) {
  const firstWord = String(name || "").toUpperCase().match(/[A-Z0-9]+/)?.[0] || "AM";
  const consonants = firstWord.replace(/[AEIOU]/g, "");
  return (consonants.length >= 2 ? consonants.slice(0, 2) : firstWord.slice(0, 2)).padEnd(2, "X");
}
function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [hospitalCoordinates, setHospitalCoordinates] = useState(null);
  const [geocodedAddress, setGeocodedAddress] = useState("");
  const [hospitalLocationStatus, setHospitalLocationStatus] = useState("");
  const [hospitalLocationMessage, setHospitalLocationMessage] = useState("");
  const [geocodingHospital, setGeocodingHospital] = useState(false);
  const hospitalGeocodeKey = (address = hospitalAddress, name = hospitalName) => `${String(address).trim()}|${String(name).trim()}`;
  const geocodeRequestId = useRef(0);
  const geocodeInFlight = useRef(null);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState("");
  const [ambulanceNumber, setAmbulanceNumber] = useState("");
  const selectedHospital = hospitals.find((hospital) => hospital.id === hospitalId);
  const ambulancePrefix = hospitalPrefix(selectedHospital?.hospitalName);
  useEffect(() => {
    if (role !== "ambulance") return;
    let cancelled = false;
    const loadHospitals = () => {
      api.getSignupHospitals().then((result) => {
        if (cancelled) return;
        const latestHospitals = result.hospitals || [];
        setHospitals(latestHospitals);
        setHospitalId((currentId) => latestHospitals.some((hospital) => hospital.id === currentId) ? currentId : "");
      });
    };
    loadHospitals();
    window.addEventListener("focus", loadHospitals);
    return () => { cancelled = true; window.removeEventListener("focus", loadHospitals); };
  }, [role]);
  const locateHospitalAddress = async (addressToFind = hospitalAddress, nameToFind = hospitalName) => {
    const normalizedAddress = String(addressToFind || "").trim();
    const normalizedName = String(nameToFind || "").trim();
    const requestKey = hospitalGeocodeKey(normalizedAddress, normalizedName);
    if (normalizedAddress.length < 5) {
      setHospitalLocationStatus("error");
      setHospitalLocationMessage("Enter the hospital street address, city, and country.");
      return null;
    }
    if (geocodedAddress === requestKey && hospitalCoordinates) return hospitalCoordinates;
    if (geocodeInFlight.current?.key === requestKey) return geocodeInFlight.current.promise;
    const requestId = ++geocodeRequestId.current;
    setGeocodingHospital(true);
    setHospitalLocationStatus("loading");
    setHospitalLocationMessage("Finding this address on the map...");
    setHospitalCoordinates(null);
    const promise = (async () => {
      try {
        const result = await api.geocodeHospital(normalizedAddress, normalizedName);
        if (requestId !== geocodeRequestId.current) return null;
        if (!result.location) {
          setGeocodedAddress("");
          setHospitalLocationStatus("error");
          setHospitalLocationMessage(result.error || "Could not find this address. Check it and try again.");
          return null;
        }
        const coordinates = { ...result.location, attribution: result.attribution, latitude: Number(result.location.latitude), longitude: Number(result.location.longitude) };
        setHospitalCoordinates(coordinates);
        setGeocodedAddress(requestKey);
        setHospitalLocationStatus("found");
        setHospitalLocationMessage(result.location.label ? `Matched: ${result.location.label}` : "Matched from the hospital address.");
        return coordinates;
      } catch (error) {
        if (requestId !== geocodeRequestId.current) return null;
        setGeocodedAddress("");
        setHospitalLocationStatus("error");
        setHospitalLocationMessage(error.message || "Address lookup is temporarily unavailable.");
        return null;
      } finally {
        if (requestId === geocodeRequestId.current) {
          geocodeInFlight.current = null;
          setGeocodingHospital(false);
        }
      }
    })();
    geocodeInFlight.current = { key: requestKey, promise };
    return promise;
  };
  useEffect(() => {
    if (role !== "hospital") return;
    const address = hospitalAddress.trim();
    const requestKey = hospitalGeocodeKey(address, hospitalName);
    if (address.length < 5 || requestKey === geocodedAddress || geocodeInFlight.current?.key === requestKey) return;
    const timer = window.setTimeout(() => { void locateHospitalAddress(address); }, 900);
    return () => window.clearTimeout(timer);
  }, [role, hospitalAddress, hospitalName, geocodedAddress]);
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let hospitalLocation = hospitalCoordinates;
      if (role === "hospital" && (!hospitalLocation || geocodedAddress !== hospitalGeocodeKey())) {
        hospitalLocation = await locateHospitalAddress();
        if (!hospitalLocation) {
          toast.error("We could not locate this hospital address. Check the address and try again.");
          return;
        }
      }
      const metadata = {
        name,
        role
      };
      if (role === "patient") {
        metadata.phone = phone;
      } else if (role === "hospital") {
        metadata.hospitalName = hospitalName;
        metadata.hospitalAddress = hospitalAddress;
        metadata.latitude = hospitalLocation.latitude;
        metadata.longitude = hospitalLocation.longitude;
      } else if (role === "ambulance") {
        metadata.hospitalId = hospitalId;
        metadata.ambulanceNumber = `${ambulancePrefix}-${ambulanceNumber.trim()}`;
        metadata.phone = phone;
      }
      const { data, error } = await auth.signUp(email, password, metadata);
      if (error) {
        toast.error("Signup failed: " + error.message);
        setLoading(false);
        return;
      }
      if (data?.user?.identities?.length === 0) {
        toast.error("This email is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }
      toast.success("Account created successfully! You can now sign in.");
      navigate("/");
    } catch (error) {
      toast.error("Signup error: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement(
    AnimatedBackground,
    {
      imageUrl: "https://images.unsplash.com/photo-1758206523688-ad896d538cf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwdGVjaG5vbG9neSUyMGJsdWUlMjBsaWdodHxlbnwxfHx8fDE3NzM1NDM2MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      gradient: "from-orange-50/95 via-white/90 to-red-50/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95",
      particles: true
    },
    /* @__PURE__ */ React.createElement("div", { className: "min-h-screen flex" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex items-center justify-center p-8 overflow-y-auto" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "absolute top-4 right-4",
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 }
      },
      /* @__PURE__ */ React.createElement(ThemeToggle, null)
    ), /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-2xl py-8" }, /* @__PURE__ */ React.createElement(
      motion.div,
      {
        className: "text-center mb-8",
        initial: { opacity: 0, y: -50 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 100 }
      },
      /* @__PURE__ */ React.createElement("div", { className: "inline-flex items-center justify-center mb-4" }, /* @__PURE__ */ React.createElement(Logo, { size: "lg", variant: "patient", showText: false })),
      /* @__PURE__ */ React.createElement("h1", { className: "text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2" }, "Join ResQLink"),
      /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 dark:text-gray-400" }, "Create your account to get started")
    ), /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.2 }
      },
      /* @__PURE__ */ React.createElement(Card3D, { intensity: 15, disabled: true }, /* @__PURE__ */ React.createElement(Card, { className: "backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl border-orange-100 dark:border-gray-700" }, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-2xl dark:text-gray-200" }, "Sign Up"), /* @__PURE__ */ React.createElement(CardDescription, { className: "dark:text-gray-400" }, "Choose your role and fill in the details")), /* @__PURE__ */ React.createElement(CardContent, null, /* @__PURE__ */ React.createElement(Tabs, { value: role, onValueChange: (val) => setRole(val), className: "mb-6" }, /* @__PURE__ */ React.createElement(TabsList, { className: "grid w-full grid-cols-3" }, /* @__PURE__ */ React.createElement(TabsTrigger, { value: "patient", className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(User, { className: "w-4 h-4" }), "Patient"), /* @__PURE__ */ React.createElement(TabsTrigger, { value: "hospital", className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Building2, { className: "w-4 h-4" }), "Hospital"), /* @__PURE__ */ React.createElement(TabsTrigger, { value: "ambulance", className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Ambulance, { className: "w-4 h-4" }), "Ambulance"))), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSignup, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "name" }, "Full Name"), /* @__PURE__ */ React.createElement(
        Input,
        {
          id: "name",
          placeholder: "Enter your full name",
          value: name,
          onChange: (e) => setName(e.target.value),
          required: true
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "email" }, "Email"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
        Input,
        {
          id: "email",
          name: "email",
          type: "email",
          autoComplete: "email",
          placeholder: "Enter your email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          className: "pl-10",
          required: true
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "password" }, "Password (10–128 characters)"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
        Input,
        {
          id: "password",
          name: "password",
          type: "password",
          autoComplete: "new-password",
          placeholder: "Create a password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          className: "pl-10",
          minLength: 10,
          maxLength: 128,
          required: true
        }
      ))), role === "patient" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "phone" }, "Phone Number"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Phone, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
        Input,
        {
          id: "phone",
          type: "tel",
          placeholder: "Enter your phone number",
          value: phone,
          onChange: (e) => setPhone(e.target.value),
          className: "pl-10"
        }
      )))), role === "hospital" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "hospitalName" }, "Hospital Name"), /* @__PURE__ */ React.createElement(
        Input,
        {
          id: "hospitalName",
          placeholder: "Enter hospital name",
          value: hospitalName,
          onChange: (e) => { const nextName = e.target.value; setHospitalName(nextName); if (hospitalGeocodeKey(hospitalAddress, nextName) !== geocodedAddress) { geocodeRequestId.current += 1; geocodeInFlight.current = null; setGeocodingHospital(false); setHospitalCoordinates(null); setGeocodedAddress(""); setHospitalLocationStatus(""); setHospitalLocationMessage(""); } },
          required: true
        }
      )),       /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "hospitalAddress" }, "Hospital Location / Address"), /* @__PURE__ */ React.createElement(Input, { id: "hospitalAddress", placeholder: "Full address, hospital name, Plus Code, or latitude,longitude", value: hospitalAddress, onChange: (e) => { const nextAddress = e.target.value; setHospitalAddress(nextAddress); if (hospitalGeocodeKey(nextAddress) !== geocodedAddress) { geocodeRequestId.current += 1; geocodeInFlight.current = null; setGeocodingHospital(false); setHospitalCoordinates(null); setGeocodedAddress(""); setHospitalLocationStatus(""); setHospitalLocationMessage(""); } }, onBlur: () => { if (hospitalAddress.trim() && hospitalGeocodeKey() !== geocodedAddress) void locateHospitalAddress(hospitalAddress); }, required: true }), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, "Examples: full address, \"Apollo Hospital Chandanagar\", \"17.496, 78.325\", or a Plus Code.")), /* @__PURE__ */ React.createElement(HospitalLocationPicker, { value: hospitalCoordinates, status: hospitalLocationStatus, message: hospitalLocationMessage, onMapClick: (selected) => { const coordinates = { latitude: Number(selected[0].toFixed(6)), longitude: Number(selected[1].toFixed(6)), label: "Map-selected hospital location" }; setHospitalCoordinates(coordinates); setGeocodedAddress(hospitalGeocodeKey()); setHospitalLocationStatus("found"); setHospitalLocationMessage("Location selected from map."); } })), role === "ambulance" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "ambulanceHospital" }, "Hospital"), /* @__PURE__ */ React.createElement("select", { id: "ambulanceHospital", value: hospitalId, onChange: (e) => setHospitalId(e.target.value), required: true, className: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" }, /* @__PURE__ */ React.createElement("option", { value: "" }, hospitals.length ? "Choose a hospital" : "No hospitals registered"), hospitals.map((hospital) => /* @__PURE__ */ React.createElement("option", { key: hospital.id, value: hospital.id }, hospital.hospitalName, hospital.hospitalAddress ? ` - ${hospital.hospitalAddress}` : "")))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "ambulanceNumber" }, `Ambulance Number (${ambulancePrefix}-)`), /* @__PURE__ */ React.createElement(
        Input,
        {
          id: "ambulanceNumber",
          placeholder: `Enter the number after ${ambulancePrefix}-`,
          value: ambulanceNumber,
          maxLength: 30,
          onChange: (e) => setAmbulanceNumber(e.target.value),
          required: true
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Label, { htmlFor: "phone" }, "Contact Number"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Phone, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), /* @__PURE__ */ React.createElement(
        Input,
        {
          id: "phone",
          type: "tel",
          placeholder: "Enter contact number",
          value: phone,
          onChange: (e) => setPhone(e.target.value),
          className: "pl-10"
        }
      )))), /* @__PURE__ */ React.createElement(
        Button,
        {
          type: "submit",
          className: "w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
          disabled: loading || geocodingHospital
        },
        loading ? "Creating Account..." : geocodingHospital ? "Locating Hospital..." : "Create Account"
      )), /* @__PURE__ */ React.createElement("div", { className: "mt-6 text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" }, "Already have an account?", " ", /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => navigate("/"),
          className: "text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold"
        },
        "Sign In"
      ))))))
    ))), /* @__PURE__ */ React.createElement("div", { className: "hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 to-red-600 items-center justify-center p-12" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-lg text-white" }, /* @__PURE__ */ React.createElement(
      ImageWithFallback,
      {
        src: "https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwc3RldGhvc2NvcGV8ZW58MXx8fHwxNzczMzMzMjEzfDA&ixlib=rb-4.1.0&q=80&w=1080",
        alt: "Medical Professional",
        className: "rounded-2xl shadow-2xl mb-8 w-full object-cover h-96"
      }
    ), /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-bold mb-4" }, "Join the Emergency Network"), /* @__PURE__ */ React.createElement("p", { className: "text-orange-100 text-lg mb-6" }, "Whether you're a patient, hospital, or ambulance service, ResQLink helps coordinate emergency response efficiently."), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1" }, /* @__PURE__ */ React.createElement(User, { className: "w-4 h-4" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-semibold" }, "For Patients"), /* @__PURE__ */ React.createElement("p", { className: "text-orange-100 text-sm" }, "Quick emergency SOS, real-time ambulance tracking"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1" }, /* @__PURE__ */ React.createElement(Building2, { className: "w-4 h-4" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-semibold" }, "For Hospitals"), /* @__PURE__ */ React.createElement("p", { className: "text-orange-100 text-sm" }, "Monitor incoming emergencies, manage capacity"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1" }, /* @__PURE__ */ React.createElement(Ambulance, { className: "w-4 h-4" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-semibold" }, "For Ambulances"), /* @__PURE__ */ React.createElement("p", { className: "text-orange-100 text-sm" }, "Receive assignments, navigate efficiently")))))))
  );
}
export {
  Signup
};
