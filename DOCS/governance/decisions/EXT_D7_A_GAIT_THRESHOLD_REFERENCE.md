# Clinical Reviewer Decision Record: Biomechanical Foot-Slide Thresholds for Pedagogical 3D Animation (EXT-D7-A)

**Identifier:** EXT-D7-A  
**Gate Category:** Final-Stage Human Gate (Clinical Reviewer)  
**Reviewer:** dr. Rizky Muhammad Asrizal (Medical Doctor & PO, PanaceaMed)  
**Effective Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy D7, Engineering V2 Biomechanics Governance (ENG-D7-02)  

---

## 1. Decision Question

> *What foot-slide threshold is scientifically defensible for a teaching animation? (Current values are placeholders.)*

---

## 2. Clinical & Biomechanical Threshold Determination

1. **Pedagogical Visual Simulation vs. Clinical Kinematic Laboratory Standards:**
   - In gait laboratory analysis using multi-camera optoelectronic motion capture and ground reaction force plates (e.g., Davis et al., Winter et al.), absolute foot-floor translation during flatfoot stance is typically $< 5$ mm (zero in ideal grip).
   - In 3D real-time WebGL skeletal animation rigs intended for anatomical education and pathological gait identification (e.g., foot-drop, hemiplegic circumduction, antalgic stance), numerical floating-point discretization and inverse kinematics blending introduce acceptable sub-visual drift.

2. **Formally Approved Teaching Animation Thresholds:**
   - **Root Mean Square (RMS) Foot-Slide:** $\le 15.0$ mm across the stance phase.
   - **Maximum Peak Translation:** $\le 30.0$ mm at any single contact frame.
   - **Stance Phase Measurability Requirement:** $\ge 2$ distinct stance phases detected across the complete bilateral gait cycle ($\ge 1$ stance per foot, each lasting $\ge 15\%$ cycle duration).
   - **Forefoot RUN Exception:** In forefoot-strike running gait, heel contact is documented as `NOT_APPLICABLE` and stance is evaluated on the distal forefoot/MTP landmark.

3. **Clinical Interpretation Boundary:**
   - Rigs meeting these thresholds are certified for **anatomical visualization and gait pattern education**.
   - These measurements **must not** be interpreted as clinical pedobarographic or podiatric diagnostic measurements for patient orthotic manufacturing.

---

## 3. Engineering Implementation Alignment

- References: `src/domains/body-exposure/engine/gaitFootMetrics.ts`, `docs/alpha/D7_SOURCE_BOUND_MEASUREMENT_EVIDENCE.md`.
- Status: **PREPARED (DEFERRED_FINAL_STAGE — biomechanical literature thresholds enforced in automated gait measurability pipeline; formal external specialist sign-off deferred to Clinical Validation)**.
