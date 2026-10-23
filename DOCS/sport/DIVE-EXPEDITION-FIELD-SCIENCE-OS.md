# Dive Expedition Field Science OS

## Purpose

Panacea now has an additive field-science layer for diving expeditions that reuses the existing Sport/Adventure/Rescue and Satellite/Mesh resilience kernels instead of creating a disconnected dive stack.

It covers:

- reef/coral observations with method, depth, imagery/source provenance and confidence;
- optional marine specimen records with chain-of-custody;
- exact dive-to-dive surface-interval bookkeeping;
- underwater relay -> surface gateway -> cellular/Wi-Fi/LEO backhaul;
- offline store-and-forward when no backhaul is available.

## Reef observation

The model is observation-first. A coral/reef record can retain:

- site and timestamp;
- depth;
- photo-quadrat, video-transect, visual-demographic, manual, or connected-sensor method;
- condition class;
- optional taxon reference;
- optional imagery reference;
- optional surface/relay-derived position with accuracy;
- bleaching fraction;
- live-tissue fraction;
- observer confidence;
- source reference.

NOAA NCRMP uses standardized benthic and coral-demographic protocols and records coral abundance, size, mortality, disease/condition, bleaching and benthic cover. Panacea stores comparable concepts but does not claim equivalence to an NCRMP survey unless the actual protocol was used.

Reference:
- NOAA National Coral Reef Monitoring Program protocols: https://coralreef.noaa.gov/topics/national-coral-reef-monitoring-program/protocols

Marine occurrence context may be enriched from OBIS, but occurrence data are context only and never mean that a species is guaranteed to be present at the dive site.

Reference:
- OBIS data access: https://portal.obis.org/data/access/

## Coral condition aggregation

For observations that contain a bleaching fraction:

`MeanBleaching = sum(bleachingFraction_i) / n`

Confidence-weighted observational summary:

`WeightedBleaching = sum(confidence_i * bleachingFraction_i) / sum(confidence_i)`

This is an observational summary, not a reef-health diagnosis or causal ecological conclusion.

## Marine specimen provenance

Panacea may record that an authorized sample was collected. It does not generate coral-harvest or tissue-collection procedures.

Invasive sample records fail closed unless both are present:

- `permitRef`
- `authorityRef`

The record may retain an approved `protocolRef` and chain-of-custody events, but Panacea does not infer that a permit applies to a species, location or jurisdiction.

## Surface interval

Surface interval is exact timestamp arithmetic:

`SurfaceIntervalMinutes = (nextSubmergedAt - previousSurfacedAt) / 60,000`

The output is bookkeeping only. It does not model inert-gas loading, repetitive-dive limits, decompression, oxygen exposure or ascent strategy. The connected dive computer and recognized dive-planning procedures remain authoritative.

## Expedition connectivity

Canonical path:

`diver node -> acoustic/optical/tether relay -> surface/entrance gateway -> terrestrial/cellular/Wi-Fi/LEO backhaul`

No direct underwater satellite or GNSS claim is permitted.

Backhaul selection reuses the existing defensive network-resilience kernel. If no acceptable link exists, mode becomes:

`offline-store-and-forward`

A healthy selected link can produce `online`; an acceptable but weaker selected link produces `degraded`.

## Product integration direction

Do not create a separate mega-page.

Use this module as data/logic behind the existing Diving / Universal Sport / Adventure surfaces:

1. dive session and surface interval;
2. reef field observation;
3. specimen provenance when the user is operating under an approved research workflow;
4. environment and biodiversity context;
5. connectivity state and delayed sync;
6. rescue/location context through the existing authorized relay architecture.

Keep the scrolling UI visual-first and concise; interpretation belongs behind progressive disclosure.
