# Satellite / Mesh Network Resilience

Panacea may use a Starlink-like low-Earth-orbit plus terrestrial mesh model as a **connectivity-resilience pattern**, not as a target for intrusion.

## Scope

The kernel in `src/lib/satelliteMeshNetworkResilience.ts` provides:

- multi-path modeling across LEO satellite, terrestrial WAN, cellular, Wi-Fi and private LAN;
- link-health and risk scoring;
- deterministic failover ranking;
- telemetry-integrity and route-instability detection;
- synthetic fault/adversarial scenarios for link loss, latency, packet loss, route flapping, gateway/node isolation, jamming-like symptoms, spoofed telemetry and replayed telemetry.

It performs no active network I/O and cannot scan, exploit, inject packets, steal credentials or control external infrastructure.

## Engineering formulas

Latency normalization:

`LatencyScore = 1 / (1 + RTT_ms / targetRTT_ms)`

Jitter normalization:

`JitterScore = 1 / (1 + jitter_ms / targetJitter_ms)`

Composite link health:

`H = 0.30A + 0.20(1-L) + 0.18R + 0.12J + 0.12I + 0.08S`

where:

- `A` = availability ratio;
- `L` = packet-loss ratio;
- `R` = latency score;
- `J` = jitter score;
- `I` = telemetry-integrity confidence;
- `S` = route stability.

Composite risk:

`Risk = 0.30L + 0.25(1-I) + 0.20(1-S) + 0.15(1-R) + 0.10(1-A)`

These are internal engineering heuristics, not clinical, safety or service-level guarantees.

## Panacea integration

Use this kernel underneath Medical Device Fabric / Visit OS when connectivity may cross multiple transports. Device identity, clinical provenance and patient truth remain owned by existing Panacea contracts; a network path never becomes a clinical authority.

Recommended production flow:

`device -> normalized device adapter -> resilient transport monitor -> Visit OS / DICOM / waveform store -> clinician review -> longitudinal state`

Satellite connectivity is treated as one replaceable transport edge among several. The preferred path is selected only from observed/authorized telemetry. A failing or suspicious path should degrade or fail over without changing the clinical data model.

## Security boundary

Allowed: observability, fault injection in synthetic state, defensive anomaly detection, tabletop incident simulation, failover testing, replay/spoofing **detection**.

Not provided: target discovery, port scanning, exploit delivery, credential attacks, packet injection, command-and-control, bypassing authentication, jamming execution or interference with real satellite/telecom infrastructure.
