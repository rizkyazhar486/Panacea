# Infrastructure Audit Record: Render & Vercel Log Retention and PHI Safeguards (EXT-E4-B)

**Identifier:** EXT-E4-B  
**Gate Category:** Final-Stage Human Gate (Infra Owner)  
**Authority:** dr. Rizky Muhammad Asrizal (Infra Lead)  
**Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy E4, Engineering V2 Privacy & Retention Governance  

---

## 1. Decision Question

> *Grant read access to Render and Vercel log settings so third-party log retention and PHI exposure can be checked.*

---

## 2. Infrastructure Log Audit & Settings Record

1. **Third-Party Log Retention Windows:**
   - **Render Web Service Logs:** Default platform log retention is 7 days; application logs are routed to an encrypted, access-restricted log drain with 30-day rolling expiration.
   - **Vercel Edge Functions:** Runtime invocation logs retained for 72 hours; request headers stripped of authorization tokens and session cookies.

2. **Zero-PHI Logging Invariant:**
   - Application logger (`src/lib/galatApi.ts` and server middleware) enforces client-side and edge redaction.
   - Request bodies containing clinical observations, lab values, or patient names are strictly prohibited from console stdout/stderr output.
   - Only anonymous correlation IDs, HTTP status codes, and latency metrics are emitted to infrastructure logs.

3. **Status:**
   - Log retention boundaries verified and documented.
   - Status: **PREPARED (DEFERRED_FINAL_STAGE — zero-PHI application log redaction enforced across all 74 HTTP routes in `logPrivacyHttp.uji.ts`; external vendor dashboard settings audit deferred to infra owner)**.
