---
name: panacea-two-step-navigation-audit
description: Use when adding, moving, consolidating, or reviewing Panaceamed navigation and a feature may become buried behind nested menus or unclear access paths.
---

# Panacea Two-Step Navigation Audit

## Goal
Keep important capability reachable from Home with minimal navigation depth while avoiding a visually overloaded interface.

## Audit
For every important feature, record:
- canonical destination;
- Home entry surface;
- interaction 1;
- interaction 2 if needed;
- whether authentication/context gates legitimately add steps;
- legacy deep-link behavior.

## Rules
- Prefer Home → domain/widget → feature/mode.
- Avoid submenu → submenu → detail chains.
- Progressive disclosure inside the destination does not count as navigation when it manipulates the current task context.
- Search, command palettes, and contextual quick actions may provide alternate access but should not hide the canonical route.
- Do not duplicate a feature across multiple pages solely to shorten navigation.

## Acceptance
Test the path using actual clickable UI, not route inspection alone. A feature fails the audit if a user must discover an undocumented nested menu, dead shortcut, or intermediate page with no meaningful function.