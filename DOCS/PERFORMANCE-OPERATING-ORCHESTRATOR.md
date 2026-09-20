# Performance Operating Orchestrator

Panacea sport/performance decisions now follow one canonical sequence:

`Population Safety -> Objective Performance Resilience -> Coaching -> Scientific Graphs`

## Why

A high performance score cannot make an unsafe environment safe.

A strong objective resilience profile cannot override:
- an emergency;
- a high heat/weather hazard;
- a missing-person/lost-buddy event;
- degraded safety communications;
- unresolved location integrity;
- a qualified motorsport/aviation/marine safety stop;
- missing authoritative safety context in a high-consequence activity.

## Behavior

If Population Safety returns:
- `stop-and-escalate` -> coaching is suppressed;
- `suspend-activity` -> coaching is suppressed;
- `modify-activity` -> performance optimization is suppressed until safety clears;
- no valid safety data -> fail closed;
- `continue` -> coaching can run.

Objective resilience can still be calculated for retrospective analysis, but it never authorizes action.

Scientific graphs are explanatory/analytical surfaces; they do not override the safety gate.

File:
- `src/lib/performanceOperatingOrchestrator.ts`
