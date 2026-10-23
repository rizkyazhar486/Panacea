# Environment Source Adapter Contract

## Purpose

Panacea's Environment OS now has one canonical admission contract for external environmental sources. The goal is to stop individual pages from ingesting weather, bathymetry, biodiversity, aviation or ocean data with incompatible assumptions.

Every admitted source must state:

- source identity and version/snapshot semantics;
- supported environment domains;
- measured/reference/modeled/forecast/occurrence truth class;
- payload type;
- spatial resolution;
- temporal resolution;
- unit semantics;
- uncertainty semantics;
- licensing/terms reference;
- authority/source reference;
- stale-data behavior;
- explicit failure semantics.

This contract extends `wearableEnvironmentOS.ts`; it does not replace it or create a second environment state model.

## Canonical sources

### GEBCO 2026

The GEBCO_2026 Grid is a global ocean/land terrain model at 15 arc-second intervals and is accompanied by a Type Identifier grid describing source-data class.

Panacea boundary:
- numeric grid values normalize to metres;
- grid resolution is not treated as measurement uncertainty;
- TID/source-data class should travel with the value when available;
- missing TID provenance fails explicitly rather than being silently upgraded to measured truth.

Reference:
- https://www.gebco.net/data-products-gridded-bathymetry-data/gebco2026-grid

### NOAA Operational Forecast Systems

NOAA OFS provides regional nowcast/forecast guidance for variables such as water level, currents, salinity, water temperature and winds, with model-specific spatial and temporal behavior.

Panacea boundary:
- modeled/forecast truth stays distinct from measured observations;
- originating OFS region/model cycle/valid time should be retained;
- values outside model domain or forecast horizon fail explicitly;
- the generic six-hour freshness threshold in the registry is an adapter default and must be overridden when a specific operational product has a different authoritative cycle.

Reference:
- https://oceanservice.noaa.gov/facts/ofs.html

### OBIS

OBIS records are biodiversity occurrence/reference context, not numeric environment telemetry.

Panacea boundary:
- occurrence != guaranteed present-time presence;
- occurrence data do not become a synthetic species-presence score;
- dataset, record, event time and coordinate precision stay attached when available.

Reference:
- https://obis.org/manual/access/

### Aviation Weather Center Data API

The AWC API exposes product families such as METAR and TAF for machine-to-machine aviation-weather access.

Panacea boundary:
- observation and forecast products stay distinct;
- product family, issue/valid time and location semantics are preserved;
- AWC information is context and does not make Panacea a certified flight-planning or ATC system.

Reference:
- https://aviationweather.gov/data/api/

## Freshness

For sources that declare an adapter stale threshold:

`ageMs = max(0, nowMs - observedAtMs)`

`state = stale if ageMs > staleAfterMs; otherwise fresh`

When the source has no universal stale threshold, the adapter returns `age-unknown` rather than inventing a freshness claim. Product-specific adapters should replace this with authoritative valid-time logic.

## Numeric observation conformance

A numeric environment observation is admitted only if:

1. the source adapter explicitly supports `numeric-observation`;
2. the domain belongs to the adapter's declared domains;
3. metric and unit are present;
4. timestamp is valid;
5. source reference is present;
6. confidence is finite in `[0,1]`;
7. any source-specific canonical unit constraint passes.

GEBCO currently constrains `elevation` and `depth` to metres at this boundary.

## Failure philosophy

No data is preferable to fabricated precision.

The adapter contract therefore treats unsupported domain, stale model cycle, missing provenance, missing valid time, unknown license/terms context and incompatible units as explicit states. Downstream UI may simplify presentation, but it must not erase these distinctions.

## Integration order

1. Source-specific read-only adapters produce provenance-safe records.
2. The environment contract validates source semantics.
3. Compatible numeric/vector observations may enter the Environment OS.
4. Time-series values intended for synchronized sport/body overlays flow through `performanceTelemetryEnvelope.ts`.
5. Population Safety and certified external systems retain authority for high-consequence decisions.
