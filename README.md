# Crypto Tracker

A simple crypto tracker built with a React frontend and an Express + MongoDB backend. The app fetches live coin data from CoinGecko, stores current and historical snapshots in MongoDB, and exposes APIs for the frontend to render the dashboard and coin history. A cron job periodically saves history data.

---

## Tech stack

- Frontend: React (Vite), React Router, Ant Design, Axios, Recharts, dayjs
- Backend: Node.js (Express), Mongoose (MongoDB), Axios (server-side to CoinGecko), jsonwebtoken, bcryptjs
- Data store: MongoDB Atlas (or any MongoDB instance)
- Cron: node-cron

---

## Quick links

- Frontend (deployed): https://your-frontend-url.example.com  <!-- replace with actual URL -->
- Backend (deployed): https://your-backend-url.example.com   <!-- replace with actual URL -->

Replace the above URLs with your actual deployed URLs.

---

## Requirements

- Node 18+ recommended
- npm (or yarn)
- A MongoDB instance (MongoDB Atlas recommended)

---

## Repository structure

- client/ - React frontend (Vite + Ant Design)
- server/ - Express backend, routes, controllers, models, cron job

---

## Environment variables

Server (in `server/.env`):

```
PORT=5000
MONGO_URI=<your-mongo-uri>
JWT_SECRET=<jwt-secret>
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<admin-password>
```

Client: use Vite environment variable to point to backend (create `client/.env` or set in hosting):

```
VITE_API_URL=https://your-backend-url.example.com
```

Notes:
- Do not commit `.env` files. Keep secrets (JWT secret, DB credentials) safe.
- If you host frontend over HTTPS, make sure `VITE_API_URL` uses `https://` to avoid mixed-content blocking.

---

## Setup & installation (local)

1. Clone the repository

```powershell
git clone <repo-url>
cd crypto-tracker
```

2. Server setup

```powershell
cd server
npm install
# create .env and set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev   # starts with nodemon: server.js
```

3. Client setup

```powershell
cd ../client
npm install
# optional: create client/.env with VITE_API_URL set to your backend
npm run dev
```

Open the client dev server (Vite) in your browser (usually http://localhost:5173). Log in using the ADMIN_EMAIL and ADMIN_PASSWORD values from the server `.env`.

---

## How the cron job works

- The server includes a scheduled job (using `node-cron`) that periodically fetches the top coins from CoinGecko and saves their current state into two places:
  - `CurrentData` collection: upserts latest snapshot for each coin.
  - `HistoryData` collection: inserts a record for historical tracking.

- The cron schedule is started from `server/server.js` (or via `utils/cronJob.js`). On server start the cron job is activated; it will run at the configured interval (see `utils/cronJob.js`).

Usage and notes:
- You can trigger history collection manually by calling the backend route `POST /api/coins/history` if you want an on-demand snapshot.
- Make sure the server can reach CoinGecko (no firewall or networking restrictions).

---

## API overview

- `POST /api/auth/login` — Login with `{ email, password }` (admin credentials from `.env`) -> returns `{ token }` JWT
- `GET /api/coins` — Returns the current top coins data (used by the dashboard)
- `POST /api/coins/history` — (optional/manual) fetch current coins and save history records
- `GET /api/coins/history/:coinId` — Returns historical records for a given coin ID

All API endpoints are prefixed with `/api` in the server (e.g., `https://your-backend.example.com/api/coins`).

---

## Deployment notes

- Backend: host on a Node-capable host (Heroku, Render, Railway, DigitalOcean App Platform, etc.). Ensure `MONGO_URI` and other env vars are configured in the host.
- Frontend: host on static hosts (Vercel, Netlify, Surge). Set `VITE_API_URL` environment variable in the hosting dashboard to point to your backend.

Example Vercel / Netlify environment variables:

- `VITE_API_URL` -> https://your-backend.example.com

---

## Security & recommendations

- For production, consider issuing httpOnly secure cookies for authentication instead of storing JWTs in localStorage.
- Rotate JWT_SECRET for security and store secrets in the host's environment settings.
- Use HTTPS in production.

---

## API Optimization & Caching (Rate Limit Fix)

During deployment, the app was hitting CoinGecko’s public API directly, which caused a 429 “Too Many Requests” error due to rate limiting on shared hosting IPs (e.g., Render/Railway).

To solve this, I implemented server-side caching using the node-cache library in the backend (coinController.js).
This ensures:

Only one real API call per minute to CoinGecko.

All other requests within that period are served instantly from cache.

If CoinGecko is temporarily unavailable, the app automatically falls back to MongoDB data (local cache).

This approach improves reliability, reduces API dependency, and provides a faster user experience even on live deployment.

## Troubleshooting

- Mixed Content errors: If your frontend is HTTPS and backend is HTTP, requests will be blocked. Use HTTPS backend or update `VITE_API_URL`.
- CORS errors: Server uses CORS, but confirm hosting platform does not override. Check server console logs.
- No history data: Ensure the cron job is running or call `POST /api/coins/history` once to populate `HistoryData`.

---

## Contact / Contribution

If you'd like changes or improvements (e.g., secure cookie auth, better charting, pagination), open an issue or submit a PR.

Replace placeholders above (URLs, repo URL) with your project's real values.
