# Tactical Performance Coach — from metrics to action

## Product rule

Panacea must not stop at a dashboard score.

Every meaningful analyzer should answer:

1. **What is limiting performance?**
2. **Why does it matter?**
3. **What should the athlete do next?**
4. **How should it progress?**
5. **When should the plan be modified or stopped?**
6. **When should the athlete be re-tested?**
7. **How confident are we in the recommendation?**

The coaching kernel lives in `src/lib/tacticalPerformanceCoach.ts`.

## Coaching domains

Current coaching playbooks cover:

- aerobic capacity;
- anaerobic/repeat high-intensity capacity;
- strength;
- power;
- loaded mobility;
- agility;
- movement quality;
- sleep/recovery;
- heat/environment;
- cognition;
- benign precision-under-fatigue;
- scuba diving technique;
- freediving technique/safety;
- motorsport human performance;
- consented team performance.

Each playbook contains:
- rationale;
- procedure;
- progression;
- reassessment rule;
- stop/modify criteria;
- evidence note.

## Recommendation priority

Signals are normalized 0–1 and confidence weighted.

A domain becomes higher priority when:
- its weighted score is low;
- trend is declining;
- multiple independent signals agree.

The engine does not create confident recommendations from invalid/sparse data.

## Loaded mobility example

Do not tell the user only:
> Loaded mobility 48/100.

Instead:
- document body mass, carried load, route, grade, surface, footwear and heat;
- compare matched loaded/unloaded sessions;
- progress one stressor at a time: duration, distance, load, terrain, or speed;
- re-test the same route after 2–4 weeks;
- reduce/modify when gait changes, pain develops, or heat/recovery cost becomes disproportionate.

## Cognitive resilience example

Do not call one fast tap “mental toughness.”

Use:
- standardized benign reaction/attention/decision tasks;
- repeated trials;
- median reaction time;
- accuracy/false-positive rate;
- fresh vs fatigued comparison;
- identical test protocol.

Objective task retention remains separate from psychometric mental-toughness/resilience instruments.

## Diving

Coaching may improve:
- trim;
- stable depth;
- efficient propulsion;
- hover control;
- task loading;
- environmental adaptation.

It must not prescribe decompression, gas strategy or weighting from guessed data.

## Freediving

Coaching emphasizes:
- efficiency;
- relaxation;
- conservative progression;
- surface recovery;
- buddy/safety-diver discipline.

No blackout-time prediction.

## Motorsport

Human-performance coaching can combine:
- HR/temperature;
- reaction;
- neck/trunk/grip endurance;
- lap/stint consistency;
- authorized brake/throttle/vehicle telemetry;
- heat and post-stint fatigue.

It does not control the vehicle or encourage unsafe driving.

## Safety boundary

The coach is for sport and human performance.

It excludes:
- weapon-use optimization;
- human targeting;
- covert surveillance;
- pursuit/evasion operations;
- operational mission planning.
