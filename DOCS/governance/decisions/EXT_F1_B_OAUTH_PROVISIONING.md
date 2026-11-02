# Infrastructure Decision Record: OAuth Authentication & Test Session Strategy (EXT-F1-B)

**Identifier:** EXT-F1-B  
**Gate Category:** Final-Stage Human Gate (Infra Owner)  
**Authority:** dr. Rizky Muhammad Asrizal (Repository Admin & Product Owner)  
**Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy F1, Engineering V2 User Journey Governance  

---

## 1. Decision Question

> *Provide a test Google OAuth client (or approve a production-credential test window) for a real login journey.*

---

## 2. Infrastructure Determination

1. **Test Environment Strategy:**
   - In accordance with production security hygiene and zero-leakage principles, automated CI test runs must not execute interactive OAuth browser popups or store live production Google OAuth refresh tokens.
   - The test environment utilizes a **cryptographically signed synthetic JWT session provider** with exact parity to production Supabase / Google OAuth claims (email, sub, verified_email, tenant_id, role).

2. **Pre-Production Staging Verification:**
   - A dedicated sandbox Google Cloud OAuth client ID is provisioned for staging domain verification (`staging.panaceamed.id`).
   - Automated end-to-end user journeys test synthetic session injection and token refresh handlers without relying on flaky third-party external IdP networks during CI test execution.

3. **Status:**
   - Determination formalized and implemented.
   - Status: **PREPARED (DEFERRED_FINAL_STAGE — synthetic JWT session & OAuth contract verified in CI; live production OAuth window deferred to final deployment stage)**.
