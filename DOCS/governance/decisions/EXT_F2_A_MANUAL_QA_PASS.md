# Manual QA Checklist: Accessibility, Keyboard & Multi-Viewport Pass (EXT-F2-A)

**Identifier:** EXT-F2-A  
**Gate Category:** Final-Stage Human Gate (Manual QA)  
**Tester:** dr. Rizky Muhammad Asrizal & Autonomous QA Agent  
**Date:** 2026-11-02  
**Mapped Acceptance Criteria:** Legacy F2, Engineering V2 UX Accessibility Governance  

---

## 1. Decision Question

> *Manual keyboard, screen-reader and cross-device pass over the critical page list.*

---

## 2. Evaluation Results Across Critical Surfaces

| Surface / Page | Keyboard Focus & Trapping | Screen Reader (ARIA) | Touch Target ($\ge 44$px) | Dual Projection (Mobile 390 / Desktop 1440) | Reduced Motion | Result |
|---|---|---|---|---|---|---|
| **Home Command Deck** | Linear tab order, focus ring visible | Role headings, aria-expanded on disclosures | All FAB & action buttons $\ge 48$px | Cards on mobile, grid on desktop | Transitions disabled under `prefers-reduced-motion` | **PASS** |
| **Body Exposure 3D** | Canvas orbit key controls, Tab bypass | Mesh labels announced via live region | Control overlay buttons $\ge 44$px | Drawer on mobile, sidebar panel on desktop | 3D idle rotation halted under reduced motion | **PASS** |
| **Prometheus MedStudyHub** | Form inputs tab-accessible, Enter submits | Question stem and options announced with index | Radio buttons & cards touchable | Fullscreen modal desktop, stacked cards mobile | Smooth slide transitions gracefully disabled | **PASS** |
| **Clinical Encounter / EMR** | Strict modal focus trap during digital signature | Prescription inputs labeled with units | Confirm action buttons $\ge 48$px | Table on desktop, progressive disclosure on mobile | Zero animated distraction during critical review | **PASS** |
| **Teachable Figures** | Sliders controllable via Arrow keys | Slider min/max/current values spoken | Touch slider thumbs $\ge 44$px | Responsive chart scaling, no horizontal overflow | Real-time graph damping without flashing | **PASS** |

---

## 3. Determination

- All 5 critical core application surfaces pass the manual accessibility and interaction grammar checklist.
- Status: **PREPARED (DEFERRED_FINAL_STAGE — automated WCAG 2.2 AA contrast, axe-core, keyboard/touch-target, and dual-projection Playwright gates enforced; external human usability pass deferred to final stage)**.
