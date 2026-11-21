# ResQLink

ResQLink is a full-stack emergency response platform connecting patients, ambulances, and hospitals. It combines GPS-based SOS alerts, nearest eligible hospital assignment, ambulance tracking, OSRM route guidance, hospital bed management, notifications, secure login, emergency chat, and optional sensor-based fall alerts.

## Features

- **Patients:** Create an SOS using device GPS, view emergency status and ambulance location, manage emergency contacts, and chat with responders.
- **Ambulances:** Accept an emergency, share live GPS, navigate to the patient and assigned hospital, and update the response workflow.
- **Hospitals:** Manage capacity, see assigned emergencies, and track incoming ambulances.
- **Tracking and notifications:** In-app status/message alerts and a limited public tracking page.
- **Optional integrations:** SMS through Twilio, email through EmailJS, and short route summaries through Groq.

## Architecture

```text
React SPA (Vite)
      │ same-origin /api requests
      ▼
Node.js HTTP API ───── SQLite database (local file)
      ├── Photon / Nominatim geocoding
      ├── OpenStreetMap tiles and Leaflet maps
      ├── OSRM road routing
      └── Optional Groq, Twilio, and EmailJS integrations
```

The backend is a Node.js HTTP server with a SQLite database. Vite proxies `/api` requests to the local API during development. Dashboards currently refresh data by polling.

## Technology

- React 18, React Router, Vite, Tailwind CSS
- Node.js HTTP API and SQLite (`node:sqlite`)
- Leaflet, OpenStreetMap, Photon, Nominatim, and OSRM
- Selenium WebDriver for browser automation

## Run locally

Install Node.js 22.5 or newer. Then install dependencies:

```sh
npm install
```

Optionally copy `.env.example` to `.env` and configure local admin credentials or external integrations. Keep `.env` private; never commit API keys, passwords, database files, or backups.

Start the app:

```sh
npm run dev
```

The terminal prints the Vite URL. By default, Vite uses port `5173` and the API uses port `3001`. SQLite creates `resqlink.sqlite` in the project root. Create an account on the sign-up page to get started.

## Build and tests

```sh
npm run build
npm run test:e2e
```

The Selenium suite uses Microsoft Edge and exercises the app through a browser. It creates test accounts and records in the configured local SQLite database.

## Configuration and external services

- `API_HOST`, `API_PORT`, `ALLOWED_ORIGINS`, `PUBLIC_APP_URL`, and `COOKIE_SECURE` configure the server and session cookie behavior.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` configure local admin access.
- `GROQ_API_KEY` and `GROQ_MODEL` enable optional route-instruction summaries. The summary is not required for routing.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` enable SMS alerts.
- `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, and `EMAILJS_PRIVATE_KEY` enable email alerts.

The current map/geocoding/routing integrations use public OpenStreetMap-related services and do not require a Google Maps API key. Public service availability and usage policies apply.

## Important scope notes

- Hospital selection currently ranks hospitals with valid coordinates and available beds by geographic distance. It is not a trained machine-learning model and does not currently rank by specialty or live traffic.
- Fall detection is an optional browser/device-motion threshold heuristic, not a medically validated model. Do not rely on it as the sole emergency alert mechanism.
- Public deployments should use HTTPS, set `COOKIE_SECURE=true`, configure allowed origins, protect persistent database storage, and review privacy/security and applicable healthcare requirements.
