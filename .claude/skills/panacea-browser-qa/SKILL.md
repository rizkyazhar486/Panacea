---
name: panacea-browser-qa
description: Use when a Panaceamed change affects user-visible behavior, navigation, responsive layout, interaction, rendering, charts, WebGL, or browser-dependent runtime behavior.
---

# Panacea Browser QA

## Rule
A user-visible change is not verified by TypeScript/build success alone.

## Minimum browser pass
1. Open the affected route from a clean load.
2. Check console and network failures.
3. Exercise the primary interaction and one failure/empty/loading state when applicable.
4. Verify back/forward or state restoration if navigation changed.
5. Check 390x844 first; add desktop coverage for layout-sensitive changes.
6. Confirm focus, keyboard access, touch targets, scroll/overflow, and reduced-motion behavior where relevant.
7. For Body/3D verify renderer initialization, camera controls, layer state, labels, and recovery from unsupported WebGL or asset failure.

## Evidence
Record route, viewport, tested action, observed result, and any console/network errors. Prefer screenshots or automated assertions when tooling supports them.

## Stop conditions
Do not call a surface complete if:
- the route loads but its primary action is dead;
- console errors occur on normal use;
- content is clipped or unreachable on mobile;
- a hidden fallback masks missing data;
- visual verification was skipped for a visual change.