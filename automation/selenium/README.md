# ResQLink Selenium automation

Run the end-to-end suite from the project root with:

```sh
npm run test:e2e
```

The suite uses Selenium WebDriver with the installed Microsoft Edge browser. Selenium Manager resolves the matching Edge driver. It reuses the running app at `http://127.0.0.1:5173` and API at `http://127.0.0.1:3001`; if either is unavailable, the runner starts the app for the run.

The browser scenarios cover app startup, unauthenticated API rejection, invalid login, required signup validation, patient/hospital/ambulance account creation, duplicate signup rejection, patient emergency creation, anonymous tracking, chat, ambulance acceptance and every status transition, hospital bed capacity and analytics, and session revocation.

Each run creates uniquely named test accounts and one emergency in the local `resqlink.sqlite` database. Test records are kept so the suite does not erase existing user data. The latest JSON summary is written to `automation/selenium/results/latest.json`; a screenshot is saved there if a browser scenario fails.

Use `E2E_BASE_URL` and `E2E_API_URL` to target a different app/API pair.
