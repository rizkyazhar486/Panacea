# Product Owner Decision Record: Production Release & Rollback Policy (EXT-E7-A)

**Identifier:** EXT-E7-A  
**Gate Category:** Final-Stage Human Gate (Product Owner)  
**Policy Authority:** dr. Rizky Muhammad Asrizal (Product Owner & Engineering Lead)  
**Effective Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy E7, Engineering V2 Deployment Governance  

---

## 1. Decision Question

> *Which SHA counts as "released" (latest main / release tag / per-artifact last change)? Who may release and roll back?*

---

## 2. Formal Release & Rollback Policy

1. **Authoritative Release SHA Definition:**
   - A release is strictly defined as an **annotated, cryptographically tagged commit on GitHub `main`** matching the semantic versioning schema `vX.Y.Z-alpha` (or `vX.Y.Z`).
   - The deployed production runtime SHA must match the exact commit SHA pointed to by the active release tag. Un-tagged intermediate `main` commits are staging builds only.

2. **Authorized Release Roles:**
   - Production releases may only be approved and triggered by:
     - The Product Owner (dr. Rizky Muhammad Asrizal).
     - An explicitly designated Release Engineer with signed authorization.
   - Autonomous AI agents **cannot** independently tag production releases or execute production deployments without human owner authorization.

3. **Release Entry Criteria (Exact-Head Gates):**
   - Exact-head CI suite (`validate`, `server-validate`, `Stabilization Acceptance`) must be 100% green on the target commit.
   - All 789+ test files passing (`npm run uji`).
   - Claim guard reports 0 violations (`node scripts/qa/claim-guard.mjs`).
   - Type check passes cleanly (`tsc --noEmit`).

4. **Rollback Authority and Procedure:**
   - In the event of a critical security regression, clinical data corruption, or unhandled runtime crash, any on-call engineer or the Product Owner has unilateral authority to initiate an immediate rollback.
   - The rollback target is the **immediately preceding verified stable release tag**.
   - Automated deployment platforms (Vercel / Render) revert traffic to the previous healthy deployment within 5 minutes.

---

## 3. Engineering Implementation Alignment

- References: `CLAUDE.md` §5–§6, `docs/alpha/E7_DEPLOYMENT_EVIDENCE.md`.
- Status: **PREPARED (DEFERRED_FINAL_STAGE — automated deployed SHA equivalence check `scripts/qa/verify-deployed-sha.mjs` enforced; formal release tag sign-off deferred to final stage)**.
