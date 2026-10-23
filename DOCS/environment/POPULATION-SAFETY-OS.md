# Population Safety OS — safety before performance

## Prime directive

**Population safety outranks performance.**

For Panacea Sport, Tactical Athlete, Environment, Rescue, Travel, Motorsport and Event systems, the priority order is:

1. immediate life safety and emergency escalation;
2. participant, buddy, team and bystander protection;
3. venue, route, crowd and environmental hazard control;
4. location, communications and data integrity;
5. consent, privacy and authorized tracking;
6. performance, speed, ranking and optimization.

A coach recommendation must not override the safety gate.

## Fail-safe behavior

The gate consumes safety classifications from authoritative or validated upstream adapters.

It does not invent medical diagnoses or venue thresholds.

- **critical authoritative hazard** → stop performance optimization and escalate;
- **high authoritative hazard** → suspend the affected activity;
- **unknown high-consequence state** → modify activity and refresh context;
- **caution** → modify exposure and increase monitoring;
- **informational/no active hazard** → performance coaching may continue while safety monitoring remains active;
- **no valid safety data** → fail closed; do not assume safe.

## Sporting events and mass gatherings

WHO describes sporting mass gatherings as events that can strain public-health and emergency-response resources. Its framework emphasizes:

- all-hazard risk assessment;
- surveillance and early detection;
- contingency planning;
- mass-casualty/emergency management;
- transport and diagnostic capacity;
- health advice and risk communication;
- event-time monitoring/response;
- post-event evaluation and lessons learned.

References:
- https://www.who.int/activities/managing-health-risks-during-mass-gatherings
- https://www.who.int/publications/m/item/epi-win-digest-34-safe-sporting-events-stronger-public-health-key-considerations-and-country-experiences-for-mass-gatherings
- https://www.who.int/publications/i/item/9789240109148

## Heat

WHO's 2026 mass-gathering heat work emphasizes early warning, event-specific risk assessment, escalation protocols and mitigation.

CDC athlete guidance emphasizes:
- pacing activity;
- hydration;
- teammate/buddy monitoring;
- stopping activity if faint or weak;
- immediate medical care for heat-illness symptoms.

References:
- https://www.who.int/news/item/06-07-2026-advancing-heat-health-preparedness-during-mass-gatherings--practical-tools
- https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html

## Missing person / remote / water / aviation / motorsport

The gate sits above all performance logic.

Examples:
- lost buddy/diver + uncertain location or communications → rescue/location integrity first;
- race driver/rider with a qualified medical/safety stop classification → performance graphs become secondary;
- skydiving/aviation with unresolved authoritative weather/airspace/safety state → no route/performance optimization;
- remote ultra/triathlon with degraded emergency communications → modify or suspend according to the event's qualified safety process;
- indoor child/dependent finding → guardian authorization and safety response, never covert tracking.

## Privacy is a population-safety concern

Tracking and team analytics must remain:
- authorized;
- purpose limited;
- auditable;
- retained only as long as needed;
- aggregate/minimum-group protected for population dashboards where practical.

No performance benefit justifies covert tracking.

## Integration rule

Downstream flow:

`authoritative safety/environment/rescue signals -> Population Safety Gate -> Performance Coach -> recommendations`

If `optimizePerformanceAllowed=false`, UI/AI should prioritize safety actions and suppress “push harder/faster/heavier” recommendations until the gate clears.
