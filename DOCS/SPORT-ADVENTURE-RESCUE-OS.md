# Panacea Sport Science + Adventure / Rescue OS

## Product intent

This layer extends the existing Training, Dive Log, Medical Device Fabric and satellite/mesh resilience work into one device-neutral operating model for:

- running, cycling, swimming, triathlon/Ironman;
- tennis and padel;
- HYROX, gym/strength and tactical fitness;
- diving, exploration, travel and rescue;
- authorized maritime and aviation connectivity context.

The core rule is **measured truth first**. A wearable, dive computer, acoustic network, vehicle system or environmental source may contribute data, but Panacea must preserve source identity, timestamp, accuracy, confidence and whether a location is measured or estimated.

## Underwater communication architecture

GNSS and ordinary satellite links are not treated as direct underwater links.

Open-water concept:

`diver node -> acoustic/optical link -> surface buoy/boat gateway -> cellular/LEO satellite -> Panacea`

Cave / overhead concept:

`diver -> acoustic breadcrumb/repeater -> repeater ... -> entrance gateway -> surface gateway -> cellular/LEO satellite -> Panacea`

Store-and-forward remains available when a hop is temporarily blocked.

WHOI demonstrates underwater acoustic communication and navigation, including boat-to-vehicle, buoy-to-vehicle and buoy-to-node-to-vehicle relay topologies. Its Micromodem documentation reports supported acoustic data rates in the tens to thousands of bits per second, illustrating why the underwater channel should carry compact telemetry/messages rather than pretend to be broadband.

References:
- https://acomms.whoi.edu/
- https://acomms.whoi.edu/micro-modem/
- https://acomms.whoi.edu/micro-modem/usage-scenarios/

## Rescue position model

Panacea distinguishes:

1. `measured` — direct position from an authorized position source;
2. `relay-derived` — position obtained through an acoustic/surface relay chain;
3. `drift-estimated` — calculated search aid after the last trusted fix.

For a current vector:

`distance = speed × elapsed_time`

`north = distance × cos(bearing)`

`east = distance × sin(bearing)`

`dLat = north / EarthRadius`

`dLon = east / (EarthRadius × cos(latitude))`

Search-radius uncertainty:

`R = sqrt(accuracy² + (t × σ_current)² + (t × σ_subject)²)`

The drift result is never relabeled as a measured GPS/acoustic fix.

## Maritime distress

Panacea is a companion layer, not a substitute for GMDSS. The certified distress path remains independent.

IMO describes 406 MHz EPIRBs as distress-alerting/locating equipment for SAR and maintains GMDSS guidance for EPIRB registration, testing and shipborne radiocommunication.

References:
- https://www.imo.org/en/ourwork/safety/pages/radiacommunicationssearchrescue-default.aspx
- https://www.imo.org/en/ourwork/safety/pages/imo-circulars-related-to-the-gmdss.aspx
- https://www.imo.org/en/ourwork/safety/pages/docs-shipbornerc-navigationequipment.aspx

Panacea may fuse wearable/crew positions, vessel GNSS/AIS context, network status and drift estimates, but it may not suppress or replace EPIRB/AIS-SART emergency signaling.

## Aviation distress and in-flight connectivity

For aircraft, Panacea may consume authorized wearable and aircraft connectivity/location context and may use permitted satellite backhaul. It does not control the aircraft and does not replace ATC or the aircraft's emergency locator transmitter.

FAA guidance notes the role of 406 MHz ELTs for search-and-rescue locating and that newer ELTs can include position data.

Reference:
- https://www.faa.gov/air_traffic/publications/atpubs/aip_html/part1_gen_section_3.6.html

Starlink may be treated only as one replaceable connectivity provider where the service, hardware, plan and local regulation authorize maritime or aviation use. It is not the emergency-location authority.

## Sport-science analysis

Sport profiles are stored in `src/lib/sportAdventureRescueOS.ts`. The analysis model separates:

- physiology;
- biomechanics;
- technique;
- tactics;
- internal and external load;
- recovery;
- environment;
- equipment;
- safety.

Examples:

- running: pace, cadence, ground-contact time, vertical oscillation, power, threshold;
- cycling: power, FTP, W/kg, cadence, torque-related metrics, aerobic decoupling;
- swimming: pace/100 m, stroke rate, distance/stroke, SWOLF, CSS;
- triathlon/Ironman: per-discipline load, transition time, bike-to-run decoupling, fueling;
- tennis/padel: court coverage, accelerations/decelerations, serve/shot and tactical position metrics;
- HYROX: run splits, station splits, Roxzone and compromised running;
- strength: volume load, RIR, velocity and estimated 1RM;
- tactical: load carriage, loaded pace, environmental stress and recovery;
- diving: real depth profile, ascent-rate samples, temperature, surface interval, current vector and connected gas data.

A metric is exposed only when its source really exists; no invented wearable capability.

## Safety boundary

The Adventure / Rescue OS deliberately does **not** provide:

- direct underwater satellite/GNSS claims;
- autonomous decompression schedules;
- aircraft or vessel control;
- replacement of 406 MHz ELT/EPIRB/PLB or AIS-SART;
- false precision when the last trusted fix is stale;
- fabricated wearable, environmental or rescue telemetry.

It is designed to make difficult environments more observable and searchable while keeping certified emergency systems independent.
