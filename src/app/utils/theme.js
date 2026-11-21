const roleThemes = {
  patient: {
    gradient: "from-orange-500 to-red-500",
    gradientHover: "from-orange-600 to-red-600",
    bgGradient: "from-orange-50 via-white to-red-50",
    primary: "orange-600",
    primaryLight: "orange-100",
    primaryDark: "orange-700",
    accent: "red-600",
    border: "orange-200",
    text: "orange-600",
    cardBorder: "border-orange-100",
    badge: "bg-orange-100 text-orange-700",
    alertBg: "bg-orange-50 border-orange-200"
  },
  hospital: {
    gradient: "from-green-500 to-teal-500",
    gradientHover: "from-green-600 to-teal-600",
    bgGradient: "from-green-50 via-white to-teal-50",
    primary: "green-600",
    primaryLight: "green-100",
    primaryDark: "green-700",
    accent: "teal-600",
    border: "green-200",
    text: "green-600",
    cardBorder: "border-green-100",
    badge: "bg-green-100 text-green-700",
    alertBg: "bg-green-50 border-green-200"
  },
  ambulance: {
    gradient: "from-blue-500 to-cyan-500",
    gradientHover: "from-blue-600 to-cyan-600",
    bgGradient: "from-blue-50 via-white to-cyan-50",
    primary: "blue-600",
    primaryLight: "blue-100",
    primaryDark: "blue-700",
    accent: "cyan-600",
    border: "blue-200",
    text: "blue-600",
    cardBorder: "border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    alertBg: "bg-blue-50 border-blue-200"
  }
};
function getTheme(role) {
  return roleThemes[role] || roleThemes.patient;
}
export {
  getTheme,
  roleThemes
};
