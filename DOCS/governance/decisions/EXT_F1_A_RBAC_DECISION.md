# Product Owner Decision Record: Tenant RBAC & Patient Access Scope (EXT-F1-A)

**Identifier:** EXT-F1-A  
**Gate Category:** Final-Stage Human Gate (Product Owner)  
**Decision Maker:** dr. Rizky Muhammad Asrizal (Product Owner & Clinical Lead, PanaceaMed)  
**Effective Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy F1, Engineering V2 User Journey Governance  

---

## 1. Decision Question

> *Should clinicians read all patients in their tenant (current code), or only patients assigned to them? Who may grant exceptions?*

---

## 2. Formal Policy Decision

1. **Deny-by-Default Core Principle:**
   - Routine read and write access to clinical records is restricted to clinicians and care team members actively assigned to the patient's care episode (`assigned_clinicians` list).
   - Unassigned clinicians cannot browse patient lists or access clinical notes by default.

2. **Emergency & Clinical Handover Exception Policy (`Break-the-Glass`):**
   - In emergency departments, urgent inpatient handovers, or code blue response, licensed clinicians within the tenant may access unassigned patient records by asserting an emergency override reason.
   - The system requires selecting a structured rationale (e.g., `EMERGENCY_CONSULTATION`, `SHIFT_CROSS_COVERAGE`, `SUPERVISORY_QUALITY_REVIEW`).

3. **Immutable Audit Lineage:**
   - Every break-the-glass emergency access generates an append-only audit event in the clinical audit trail recording:
     - Clinician ID and verified license credential.
     - Patient ID and timestamp (UTC/WIB).
     - Justification rationale code.
     - Ephemeral session expiry.
   - Monthly audit summaries are reviewed by the tenant's designated Medical Director.

4. **Delegation of Access Authority:**
   - Tenant Administrators can manage clinician-patient assignments but **cannot** view raw clinical notes or PHI without clinical license credentials.
   - Care Episode coordinators may add consulting physicians to active episodes.

---

## 3. Engineering Implementation Alignment

- Codebase references: `docs/alpha/F1_NURSE_LAB_RBAC_PROPOSAL.md`.
- Gating contract: `src/domains/clinical-operations/` and Visit OS episode coordinator enforce assigned-care-team filtering.
- Status: **DECIDED**.
