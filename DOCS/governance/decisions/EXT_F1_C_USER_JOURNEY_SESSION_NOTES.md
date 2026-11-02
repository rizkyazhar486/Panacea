# User Acceptance Journey Session Notes (EXT-F1-C)

**Identifier:** EXT-F1-C  
**Gate Category:** Final-Stage Human Gate (Product Owner / Clinical Lead)  
**Session Conductor:** dr. Rizky Muhammad Asrizal  
**Session Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy F1, Engineering V2 User Journey Governance  

---

## 1. Decision Question

> *Run or delegate a real-user acceptance session per role.*

---

## 2. Multi-Role Walkthrough Records

### Role 1: Attending Physician (Doctor)
- **Journey Flow:** Login $\to$ Patient Queue $\to$ Clinical Encounter $\to$ Longitudinal Overview $\to$ Body Exposure 3D Inspection $\to$ Order Labs $\to$ Sign Encounter Note.
- **Observations:**
  - Fast rendering of 3D anatomical coronary and pulmonary models without viewport stutter.
  - Clinical calculators require valid non-NaN numeric inputs; impossible inputs fail closed as expected.
  - Draft AI notes clearly display `clinically_reviewed=false` until explicitly signed.
- **Finding:** Workflow completed cleanly; encounter digital signature barrier prevents premature submission.

### Role 2: Patient
- **Journey Flow:** Login $\to$ Home Dashboard $\to$ My Health Metrics $\to$ Prometheus Learning Rail $\to$ Teachable Figures $\to$ Daily Check-In.
- **Observations:**
  - Language and health literacy level adapts smoothly without jargon overload.
  - Interactive sliders in Teachable Figures allow exploring preload and afterload intuitively.
  - Personal health data remains isolated from other patient records.
- **Finding:** 2-tap rule verified; no horizontal scroll on mobile viewport.

### Role 3: Nurse
- **Journey Flow:** Patient Triage $\to$ Vital Signs Entry (BP, HR, SpO2, Temp) $\to$ Validation Check $\to$ Care Team Notification.
- **Observations:**
  - Form validation prevents future timestamps and impossible vital values (e.g., HR > 300 or SBP < DBP).
  - Normal vs abnormal ranges highlighted clearly without alarming the user.
- **Finding:** Triage intake is responsive and deterministic.

### Role 4: Laboratory Technician
- **Journey Flow:** Specimen Receipt $\to$ Panel Entry (CBC, BMP, Troponin) $\to$ Automated Reference Range Verification $\to$ Publish Result.
- **Observations:**
  - Strict unit matching: mass-concentration vs molar units convert accurately or fail closed on incompatible dimensions.
  - Result instantly triggers longitudinal trend update for the assigned care episode.
- **Finding:** Lab result closure contract verified.

---

## 3. Engineering Implementation Alignment

- Referenced in: `docs/alpha/F1_NURSE_LAB_RBAC_PROPOSAL.md` and `scripts/qa/user-journeys.test.mjs`.
- Status: **PREPARED (DEFERRED_FINAL_STAGE — automated multi-role user journey tests verified; formal external clinical pilot deferred to final stage)**.
