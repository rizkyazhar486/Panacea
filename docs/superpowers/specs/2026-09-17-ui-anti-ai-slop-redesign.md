# Panaceamed UI Anti-AI-Slop Redesign Spec

## Objective
Rebuild the active Home/widget/Assistive Touch presentation so Panaceamed no longer reads as a generic AI-generated dashboard. Preserve existing functional capabilities, two-step access, accessibility, reduced-motion support, and current data sources while replacing template-like visual grammar with direct manipulation, strong hierarchy, calm spacing, and purpose-driven motion.

## Non-negotiable visual rules
1. No card-inside-card composition for primary Home health data.
2. No category-colored gradient tile system, decorative glow blobs, or arbitrary multicolor accents.
3. No generic greeting, capability-count badges, AI-style marketing copy, or decorative explanatory copy in the scrolling surface.
4. No emoji as production navigation glyphs in Home or Assistive Touch.
5. Glass/blur is allowed only when it communicates actual floating depth or modal separation; never as the default surface treatment.
6. One focal object or interaction cluster per viewport region; secondary information remains visually quieter.
7. Main scrolling UI copy is limited to metric names, values, short status labels, and action labels that fit on one line.
8. Motion must explain direct manipulation, state transition, focus, or continuity. Decorative looping motion is prohibited.
9. Every visible control must perform a real action; decorative pseudo-controls are prohibited.
10. Mobile-first touch targets remain >=44px for primary interactive controls, with reduced-motion behavior preserved.

## Home architecture
Home becomes a continuous canvas rather than a stack of independent dashboard cards.

### Health instrument strip
Replace the current liquid-glass health brief with an edge-to-edge health instrument rail. The primary metric receives dominant typography; secondary metrics are separated by hairlines/spacing rather than filled cards. Each metric is directly tappable and routes to the relevant detailed surface. No greeting, gradient blob, nested glass tile, footer button grid, or fake sparkline.

### Functional widget rail
Keep the existing live widget board and swipe mechanics, but remove decorative header-box treatment. Widget chrome should recede behind the data. Position controls remain direct, compact, and actionable. Widget content itself remains functional and data-backed.

### Capability command surface
Replace the current gradient capability mosaic with one calm command surface:
- search is first-class;
- domain switching is text/underline based rather than colored cards;
- default state exposes a small set of direct launch actions;
- full capability index appears only through progressive disclosure or active search;
- search results are plain rows with clear destination and optional one-line metadata;
- no “Welcome”, initials avatar, live-capability badge, gradient category surfaces, or glow fields.

## Assistive Touch architecture
The Assistive Touch orb remains draggable, edge-snapping, gesture-aware, persistent, haptic-capable, and route-aware.

When opened, it must not create a generic floating glass rectangle. Actions appear spatially around/adjacent to the orb as a compact orbit/fan, with consistent stroke icons and minimal labels. The orb remains the visual anchor. Extra actions can be paged through direct horizontal gesture without introducing a large panel. Customize remains available but does not occupy a prominent production action slot.

## Interaction rules
- Tap = primary configured action.
- Double tap, long press, and four-direction swipe mappings remain supported.
- Drag remains distinct from swipe and tap.
- Widget rails remain finger-draggable with programmatic navigation that does not fight user input.
- Focus-visible, keyboard fallback, and reduced-motion behavior remain intact.

## Technical boundaries
Primary files in the first redesign wave:
- `src/components/HomeHealthBrief.tsx`
- `src/components/HomeCommandDeck.tsx`
- `src/components/FabNavigasi.tsx`
- `src/components/RelWidgetRumah.tsx`
- `src/styles/rel-widget-rumah.css`
- new focused Home/Assistive CSS if required
- deterministic source-level acceptance test under `scripts/qa/`
- `package.json` build gate registration

Do not change Body Explorer rendering, clinical algorithms, backend APIs, patient-state models, or unrelated pages in this wave.

## Acceptance criteria
The redesign is accepted only when:
- targeted Home source contains no nested liquid-glass health dashboard pattern;
- Home command surface contains no gradient category-tile system, generic greeting, or capability-count badge;
- Assistive Touch open state is spatial/orb-anchored rather than a rectangular command panel;
- production action glyphs in these surfaces use the existing stroke icon system instead of emoji;
- existing widget swipe behavior and Assistive Touch gesture behavior remain covered by their deterministic tests;
- Validate, Stabilization Acceptance, Body 3D Render Acceptance, and both security gates pass on the same exact head before merge.
