# ResQLink deployment

ResQLink runs a Node.js API backed by a local SQLite database. It does not require Supabase.

## Build and start

```sh
npm install
npm run build
npm run server
```

The API serves the built `dist/` app. For local development, `npm run dev` starts both the API and Vite.

## Environment

Copy `.env.example` to `.env` and configure the values needed for your deployment:

- Set `API_HOST`, `API_PORT`, `ALLOWED_ORIGINS`, and `PUBLIC_APP_URL`.
- Set `COOKIE_SECURE=true` when serving the application over HTTPS.
- Set a strong `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Configure Twilio, EmailJS, or Groq credentials only if those optional integrations are enabled.

Keep `.env` out of source control. Do not expose server credentials in frontend variables or source files.

## Persistent storage and security

The API creates `resqlink.sqlite` and a `backups/` directory in the project root. Production deployments must use persistent storage and a separate backup/restore plan. Restrict access to the host and database, use HTTPS, and configure allowed browser origins.

Map tiles, geocoding, and road routing currently use public OpenStreetMap-related services. Check their usage policies and availability limits before relying on them for production traffic.

## Emergency workflow

Patient SOS → pending emergency → ambulance accepts → enroute → arrived → transporting → delivered → handover complete.
