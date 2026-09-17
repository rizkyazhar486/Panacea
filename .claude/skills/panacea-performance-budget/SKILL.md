---
name: panacea-performance-budget
description: Use when adding heavy visuals, WebGL, shaders, charts, large assets, AI streaming, data polling, or other Panaceamed behavior that can materially affect load time, memory, responsiveness, or mobile performance.
---

# Panacea Performance Budget

## Principle
Visual richness must be bounded by measured performance.

## Before implementation
Define the performance risk: bundle size, asset bytes, GPU cost, CPU work, memory, network frequency, hydration, or interaction latency.

## Budget method
1. Capture a baseline on the affected route/device class.
2. Add the feature behind the smallest measurable boundary.
3. Compare candidate to baseline using the same scenario.
4. Optimize the dominant bottleneck, not whichever code looks complex.
5. Prefer lazy loading, code splitting, asset LOD, visibility-driven work, memoization, batching, and bounded polling when evidence supports them.
6. Preserve reduced-motion and low-capability fallbacks for expensive effects.

## Body/3D specifics
Measure model/texture payload, scene object count, draw pressure, memory growth, camera interaction smoothness, and load/recovery behavior. Do not preload deep molecular or organ detail when the user is still at whole-body level.

## Release rule
A performance-sensitive change needs a before/after measurement or explicit documented reason measurement is unavailable. Never trade correctness, clinical safety, or accessibility for a synthetic speed score.