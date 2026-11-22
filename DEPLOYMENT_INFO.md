# ResQLink deployment

ResQLink runs a Node.js API backed by a local SQLite database. It does not require Supabase.

## Deploy as one web service

The Node server serves both the built React app and `/api` endpoints. Deploy them together as one service so session cookies and API requests stay same-origin.

One straightforward option is Render:

1. Push this repository to GitHub and create a **Web Service** in Render connected to it.
2. Set the runtime to Node.js 22.5 or newer.
3. Set the build command to `npm ci && npm run build`.
4. Set the start command to `npm run server`.
5. Add a persistent disk mounted at `/var/data`. Set `DATA_DIR=/var/data` in the service environment. SQLite and its daily backups are stored there.
6. Add the environment variables below, deploy, and open the service URL. Check `https://<your-service>.onrender.com/api/health`.

Use a host that supports a persistent disk for SQLite. Ephemeral storage can be erased during redeploys or restarts. Keep this as a single running instance; SQLite on a local disk is not suitable for multiple server instances.

## Required production environment

- `PUBLIC_APP_URL`: the full public site URL for hosts other than Render. Render's `RENDER_EXTERNAL_URL` is used automatically unless this override is set.
- `COOKIE_SECURE=true`: required for the HTTPS session cookie.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: set a unique, strong administrator password.
- `DATA_DIR=/var/data`: the persistent disk mount path in the example above.

The server uses the hosting provider's `PORT` automatically and binds to all network interfaces in production. `API_PORT` and `API_HOST` remain available for local/custom setups.

Configure Twilio, EmailJS, or Groq credentials only if those optional integrations are enabled. Store all secrets in the hosting provider's environment settings, not in Git or frontend variables.

For local development, copy `.env.example` to `.env` and run:

```sh
npm ci
npm run dev
```

For a local production-style build:

```sh
npm ci
npm run build
npm run server
```

## Persistent storage and security

The API stores `resqlink.sqlite` and daily backups in `DATA_DIR` (the project root by default). Production deployments need persistent storage and a separate backup/restore plan. Restrict access to the host and database, use HTTPS, and do not treat the built-in SQLite backups as an off-host backup.

This application handles emergency and location information. Before using it with real users, review privacy, access control, data retention, backup security, and applicable healthcare/legal requirements. Do not use a hobby deployment as a critical emergency-response service without appropriate operational safeguards.

Map tiles, geocoding, and road routing currently use public OpenStreetMap-related services. Check their usage policies and availability limits before relying on them for production traffic.

## Emergency workflow

Patient SOS → pending emergency → ambulance accepts → enroute → arrived → transporting → delivered → handover complete.
