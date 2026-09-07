# Panaceamed.id — Backend

Panaceamed.id uses this Node/Express service as its **backend on Render**. It handles real Google OAuth, payments, realtime communication, notifications, evidence APIs, and now the genomics compute control plane.

- No optional credentials set → the relevant integration reports unavailable/mock state rather than pretending to be live.
- Credentials set → the corresponding integration can operate against its real upstream service.

## Run

```bash
cd server
npm install
cp .env.example .env
npm run dev               # http://localhost:8787
```

Then run the frontend with the backend URL:

```bash
# repo root
echo "VITE_API_URL=http://localhost:8787" > .env.local
npm run dev
```

The production deployment uses the same API contract through the Render backend URL configured as `VITE_API_URL`.

## Render genomics control plane

The public Render backend is the **control plane** for heavy genomics jobs. It deliberately does not proxy multi-gigabyte FASTQ/BAM/POD5 payloads through Express and does not execute arbitrary shell commands from browser input.

A user first stages an input object in an allowed object location (`https://`, `s3://`, or `gs://`). The authenticated backend can then create one of these job kinds:

- `ont-basecalling` — raw Oxford Nanopore signal → upstream Dorado/basecalling worker.
- `pharmcat` — prepared PGx input → upstream PharmCAT pipeline.
- `sv-calling` — staged sequencing/alignment evidence → configured structural-variant worker.

Configure the worker on Render with:

```bash
GENOMICS_WORKER_URL=https://your-private-or-authenticated-worker.example
GENOMICS_WORKER_TOKEN=server-only-secret
GENOMICS_WORKER_PROVIDER=render-worker
GENOMICS_WORKER_TIMEOUT_MS=30000
```

The worker contract is intentionally small:

```text
POST /jobs
GET  /jobs/:id
POST /jobs/:id/cancel
```

If `GENOMICS_WORKER_URL` is empty or unreachable, Panacea returns an explicit unavailable/error response. It does **not** fabricate a queued or completed genomics job.

### Security boundary

Job submission/status/cancel requires an authenticated Panacea session. The Render backend forwards an opaque internal user id, not the user's email. The worker job id is never exposed directly to the browser; Panacea wraps it in a user-bound HMAC-signed `jobHandle`, so another account cannot use someone else's handle. Worker credentials remain server-only.

## Going live

| Feature | What to set | Where to get it |
| --- | --- | --- |
| Google login | `GOOGLE_CLIENT_ID` (+ add your frontend origin to Authorized JS origins) | Google Cloud Console |
| Payments | `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` | Midtrans Dashboard |
| Genomics compute | `GENOMICS_WORKER_URL`, optional `GENOMICS_WORKER_TOKEN` | Your configured Render/private compute worker |

Set the Midtrans **Payment Notification URL** to `https://YOUR_BACKEND/api/payments/webhook`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Backend capability discovery |
| POST | `/api/auth/google` | Verify Google ID token → session cookie/token |
| POST | `/api/auth/dev-login` | Development login |
| GET | `/api/auth/me` | Current session user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/wallet` | Balance + transactions (PNC) |
| POST | `/api/wallet/withdraw` | Withdraw PNC to bank |
| POST | `/api/payments/create` | Create a Midtrans (or mock) order |
| POST | `/api/payments/confirm` | Mock-only payment confirmation |
| POST | `/api/payments/webhook` | Midtrans notification (verifies signature) |
| GET | `/api/payments/status/:orderId` | Order status |
| GET | `/api/genomics/compute/capabilities` | Render genomics control-plane capability/status |
| POST | `/api/genomics/compute/jobs` | Submit authenticated staged genomics job |
| GET | `/api/genomics/compute/jobs/:jobHandle` | Read authenticated job status/result metadata |
| POST | `/api/genomics/compute/jobs/:jobHandle/cancel` | Cancel authenticated job |

## Genomics request example

```json
{
  "kind": "ont-basecalling",
  "input": {
    "uri": "s3://panacea-staging/run-001/input.pod5",
    "sha256": "<64-hex-sha256>",
    "sizeBytes": 123456789,
    "format": "pod5"
  },
  "parameters": {
    "model": "<current-compatible-ONT-model>"
  }
}
```

The backend validates only orchestration metadata. Scientific correctness still belongs to the configured upstream caller/annotator and its validated input requirements; Panacea must preserve provenance and must not convert job completion into an automatic diagnosis or treatment recommendation.
