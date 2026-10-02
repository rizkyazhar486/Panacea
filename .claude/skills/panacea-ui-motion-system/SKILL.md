---
name: panacea-ui-motion-system
description: Use when designing or implementing Panaceamed interface layout, motion, gestures, responsive behavior, progressive disclosure, visual hierarchy, or interaction states.
---

# Panacea UI Motion System

## Principle
Motion communicates hierarchy, causality, continuity, and feedback. It is not decoration.

## UI rules
- One dominant focal point per viewport.
- Preserve generous whitespace even when capability density is high.
- Keep scrolling surfaces visual-first: numbers, charts, state, iconography, and short micro-labels.
- Put interpretation and long context behind explicit actions, drawers, sheets, or detail states.
- Prefer capability convergence: multiple related tools become modes within one coherent surface rather than duplicate pages.
- Important capabilities should remain reachable within the repository's navigation constraints.

## Motion rules
Animate only when motion explains one of:
- where an object came from or goes;
- state change;
- direct manipulation;
- hierarchy/progressive disclosure;
- success/error/loading feedback.

Respect reduced-motion preferences. Avoid permanent ambient motion that competes with clinical data. Use transform/opacity where possible and measure expensive blur, shader, canvas, and WebGL effects.

## Quality checks
Verify touch targets, keyboard/focus behavior, contrast, overflow, motion cancellation, loading/error states, and 390x844 rendering. Do not solve hierarchy problems by adding more glow, gradients, cards, or text.