# Panaceamed.id — Backend

Real **Google OAuth login** + **Midtrans payments** (QRIS / Virtual Account / Card)
for Panaceamed.id, with a **mock fallback** so it runs with zero configuration.

- No credentials set → mock mode (dev-login + simulated payments).
- Credentials set → live Google verification + live Midtrans transactions + webhook.

## Run

```bash
cd server
npm install
cp .env.example .env      # fill in keys to go live (optional)
npm run dev               # http://localhost:8787
```

Then run the frontend with the backend URL:

```bash
# repo root
echo "VITE_API_URL=http://localhost:8787" > .env.local
npm run dev
```

The login screen will show a green "Backend aktif" indicator. Sign in (real Google
button appears when `GOOGLE_CLIENT_ID` is set), then open **Billing & Token** — the
"Dompet Real (Backend)" card processes payments through the server.

## Going live

| Feature | What to set | Where to get it |
| --- | --- | --- |
| Google login | `GOOGLE_CLIENT_ID` (+ add your frontend origin to Authorized JS origins) | https://console.cloud.google.com/apis/credentials |
| Payments | `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` | https://dashboard.sandbox.midtrans.com/settings/config_info |

Set the Midtrans **Payment Notification URL** to `https://YOUR_BACKEND/api/payments/webhook`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Capability discovery (which features are live) |
| POST | `/api/auth/google` | Verify Google ID token → session cookie |
| POST | `/api/auth/dev-login` | Mock login (always available) |
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/wallet` | Balance + transactions (PNC) |
| POST | `/api/wallet/withdraw` | Withdraw PNC to bank |
| POST | `/api/payments/create` | Create a Midtrans (or mock) order |
| POST | `/api/payments/confirm` | Mock-only: simulate a paid callback |
| POST | `/api/payments/webhook` | Midtrans notification (verifies signature) |
| GET | `/api/payments/status/:orderId` | Order status |

> Persistence uses a local `data.json` file for the demo — swap for a real
> database (Postgres/SQLite) before production. AI support, not a replacement for
> a licensed clinician; verify doses against a current formulary.
