# Panacea Codex Operating Policy

## Objective
Work efficiently on Panacea while minimizing unnecessary model/credit usage. Prefer the least expensive capable mode for each task, and escalate only when complexity requires it.

## Default behavior
- Use the normal/default Codex model and medium reasoning for routine coding.
- Keep repository context narrow: inspect only files directly relevant to the task unless broader context is necessary.
- Prefer targeted edits over repo-wide refactors.
- Prefer targeted tests, lint, or type checks first; run full builds/tests only when justified.
- Avoid repeatedly re-reading unchanged files.
- Do not use expensive/highest-capability modes for routine Git operations, documentation, renaming, formatting, simple styling, CRUD, small refactors, or straightforward bug fixes.

## Escalation policy
Use progressively stronger reasoning only when needed:

1. **Routine / Medium reasoning**
   - Small bug fixes
   - CRUD/API wiring
   - TypeScript fixes
   - Simple React components
   - CSS/layout changes
   - Tests and documentation
   - Git operations

2. **High reasoning**
   - Multi-file dependency issues
   - Difficult debugging
   - Architectural decisions
   - Complex state/data-flow problems
   - Security-sensitive or clinically important implementation details

3. **Extra-high reasoning**
   - Use only when High reasoning is insufficient or the task has substantial correctness risk.

4. **Astra**
   Reserve Astra for tasks where its additional capability provides clear value, especially:
   - Complex interactive medical visualization
   - Three.js / WebGL / advanced 3D work
   - Advanced animated anatomy or physiology
   - Sophisticated SVG/canvas visualization
   - Highly complex visual UI/UX prototyping
   - Difficult end-to-end visual tasks that ordinary Codex modes cannot solve well

Do **not** use Astra for routine coding, styling, refactors, tests, documentation, Git operations, or simple charts/SVGs.

## Visual workflow
For complex visual features:
1. Use Astra only for the difficult visual/interactive design and implementation stage when necessary.
2. After the visual foundation works, return to the normal/default Codex model for integration, cleanup, responsive behavior, maintenance, tests, and bug fixes.
3. Re-escalate to Astra only if a genuinely hard visual problem remains.

## Cost-awareness rule
Before escalating model/reasoning level, ask internally:
- Can this task be solved reliably with the current mode?
- Is broader repository context actually necessary?
- Can a targeted test replace a full build/test cycle?
- Is Astra materially better for this specific task?

If the answer to the last question is no, do not use Astra.

## Priority
Correctness, clinical safety, maintainability, and security remain more important than saving credits. Escalate when lower-cost modes create meaningful risk, but avoid unnecessary escalation.
