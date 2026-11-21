import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { AboutPage } from "./pages/AboutPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { PatientDashboard } from "./pages/PatientDashboard";
import { HospitalDashboard } from "./pages/HospitalDashboard";
import { AmbulanceDashboard } from "./pages/AmbulanceDashboard";
import { DriverProfile } from "./pages/DriverProfile";
import { EmergencyTracking } from "./pages/EmergencyTracking";
import { Analytics } from "./pages/Analytics";
import { Chat } from "./pages/Chat";
import { NotFound } from "./pages/NotFound";
import { PublicEmergencyTracking } from "./pages/PublicEmergencyTracking";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ForgotPassword } from "./pages/ForgotPassword";
const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage
  },
  {
    path: "/about",
    Component: AboutPage
  },
  {
    path: "/features",
    Component: FeaturesPage
  },
  {
    path: "/home",
    Component: Home
  },
  {
    path: "/login",
    Component: Login
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword
  },
  {
    path: "/signup",
    Component: Signup
  },
  {
    path: "/patient",
    Component: PatientDashboard
  },
  {
    path: "/hospital",
    Component: HospitalDashboard
  },
  {
    path: "/ambulance",
    Component: AmbulanceDashboard
  },
  {
    path: "/admin",
    Component: AdminDashboard
  },
  {
    path: "/ambulance/profile",
    Component: DriverProfile
  },
  {
    path: "/tracking/:emergencyId",
    Component: EmergencyTracking
  },
  {
    path: "/public-tracking/:emergencyId",
    Component: PublicEmergencyTracking
  },
  {
    path: "/analytics",
    Component: Analytics
  },
  {
    path: "/chat/:emergencyId",
    Component: Chat
  },
  {
    path: "*",
    Component: NotFound
  }
]);
export {
  router
};
