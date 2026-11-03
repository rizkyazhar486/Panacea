# Legal & Compliance Decision Record: Data Retention, Consent & Privacy Policy (EXT-E4-A)

**Identifier:** EXT-E4-A  
**Gate Category:** Final-Stage Human Gate (Legal Counsel / Compliance)  
**Governing Standard:** Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) & Permenkes No. 24 Tahun 2022 tentang Rekam Medis  
**Policy Version:** 1.0.0-governed  
**Effective Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy E4, Engineering V2 Privacy & Retention Governance  

---

## 1. Decision Question

> *Approve retention periods, deletion rights, consent text, backup/log retention and legal basis (UU PDP).*

---

## 2. Formal Privacy & Retention Policy

1. **Lawful Basis of Processing (UU PDP Pasal 20 & 22):**
   - General health data processing is grounded in explicit, informed, revocable consent (Pasal 20 ayat 2).
   - Clinical medical record processing in active care encounters is grounded in statutory medical obligation (Pasal 22 & Permenkes 24/2022).

2. **Standard Retention Periods:**
   - **Clinical Medical Records (EHR):** Retained for a mandatory statutory period of 25 years from the last patient encounter per clinical regulations.
   - **Continuous Device Telemetry & High-Frequency Wearables:** Retained in raw high-frequency resolution for 90 days, then downsampled to longitudinal statistical daily aggregates.
   - **Ephemeral Clinical Scratchpads / AI Drafts:** Automatically purged 30 days after encounter signing if uncommitted.
   - **Audit Trail & Access Logs:** Retained in immutable write-once storage for 10 years for medico-legal accountability.

3. **Data Subject Rights & Deletion Procedures (Right to Erasure / UU PDP Pasal 8):**
   - Patients may request erasure of non-clinical account data, self-tracked lifestyle logs, and revoked device telemetry.
   - Clinical medical record data mandated by health regulations cannot be prematurely erased; upon statutory expiry, secure cryptographic erasure is executed and certified.

4. **PHI Redaction & Export Boundaries:**
   - Diagnostic model telemetry, research datasets, and educational concept traces must strip all 18 HIPAA / UU PDP direct patient identifiers prior to aggregation.
   - Re-identification attacks are mitigated with k-anonymity ($\ge 5$) on longitudinal timestamps and geographical coordinates.

---

## 3. Engineering Implementation Alignment

- References: `docs/alpha/E4_RETENTION_CONSENT_POLICY_DRAFT.md`, `scripts/uji/privacy-*.mts`.
- Status: **PREPARED (DEFERRED_FINAL_STAGE — parameterized retention harness `server/src/modules/retention/domain/retentionPolicy.ts` verified; `governance/RETENTION_POLICY.json` remains `unset` until external legal counsel sign-off)**.
