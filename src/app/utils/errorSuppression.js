window.addEventListener("unhandledrejection", (event) => {
  const errorString = event.reason?.toString().toLowerCase() || "";
  if (errorString.includes("failed to fetch") || errorString.includes("networkerror") || errorString.includes("fetch error")) {
    event.preventDefault();
  }
});
