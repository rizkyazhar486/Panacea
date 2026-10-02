---
name: panacea-feature-convergence
description: Use when Panaceamed contains overlapping pages, widgets, routes, APIs, or features that serve the same user intent and need consolidation without deleting capability.
---

# Panacea Feature Convergence

## Principle
Consolidate experience, not capability.

## Method
1. Identify the user intent shared by overlapping features.
2. Inventory unique capability, data source, action, and state owned by each implementation.
3. Choose one canonical surface.
4. Preserve meaningful differences as modes, tabs, layers, contextual actions, drawers, or progressive disclosure.
5. Redirect or demote legacy routes only after the canonical surface exposes equivalent capability.
6. Remove duplication only when tests prove no unique behavior or deep-link contract is lost.

## Avoid
- deleting a feature because its UI looks redundant;
- creating another page to solve overlap;
- permanent side panels for rarely used controls;
- multiple sources of truth for the same patient or product state.

## Acceptance
The resulting surface should be shorter and easier to navigate while the capability inventory is unchanged or improved. Verify legacy links, saved state, identifiers, analytics events, and access paths before cleanup.