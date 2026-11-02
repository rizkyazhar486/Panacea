# Infrastructure Provisioning Record: Staging & CI Verification (EXT-E7-B)

**Identifier:** EXT-E7-B  
**Gate Category:** Final-Stage Human Gate (Infra Owner)  
**Authority:** dr. Rizky Muhammad Asrizal (Repository Admin & Infra Lead)  
**Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy E7, Engineering V2 Deployment Governance  

---

## 1. Decision Question

> *Provision staging (Vercel preview project + Render service) and add its secrets to CI.*

---

## 2. Infrastructure Configuration Record

1. **Staging Architecture:**
   - **Frontend Preview Deployment:** Vercel Preview Deployments attached to GitHub pull requests and branch builds.
   - **Backend Application Service:** Render Web Service staging instance (`panaceamed-server-staging`) running Docker-based Node.js runtime.
   - **Continuous Integration Pipeline:** GitHub Actions workflows (`preview-deploy.yml`, `render-smoke.yml`) configured to validate live health endpoints.

2. **Secrets & Credentials Management:**
   - Secrets `RENDER_DEPLOY_HOOK_URL`, `RENDER_API_KEY`, and `VERCEL_TOKEN` configured in GitHub Repository Encrypted Secrets.
   - Smoke test service name updated and verified in PR #2952 (`fix/render-smoke-suspended`).

3. **Status:**
   - Staging environment topology and automated smoke validation configured.
   - Status: **DECIDED**.
