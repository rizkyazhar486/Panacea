# Universal Sport OS — scientific registry and graph contract

## Scope

Panacea now treats sport as one extensible operating model instead of a collection of isolated pages.

The runtime contract in `src/lib/universalSportOS.ts` covers more than 50 sport contexts across endurance, racquet, bat-and-ball, team sport, combat, strength, precision, water, mountain/winter, aerial, motorsport, equestrian, gymnastics and tactical domains.

Key requested profiles include tennis, baseball, F1, Daytona/endurance racing, MotoGP, scuba diving, freediving, triathlon/Ironman, cycling, HYROX, tactical fitness and skydiving.

A registry entry is a **capability schema**, not a claim that a wearable already measures every field.

## Universal scientific layers

Each sport can compose:

- physiology;
- biomechanics;
- technique;
- tactics;
- internal load;
- external load;
- recovery;
- environment;
- equipment;
- position;
- communications;
- safety.

Universal source-gated metrics include HR, HRV, respiratory rate, SpO₂, skin/core temperature, lactate, VO₂, RPE/sRPE load, speed, pace, distance, acceleration, angular velocity, power, terrain/elevation, wind/current/waves, ambient temperature, pressure, position and communications health.

## Scientific graph contract

Graphs are data contracts rather than decorative charts.

Core examples:

- HR vs time;
- duration/RPE/sRPE internal load;
- power vs HR for cycling/rowing;
- pace vs HR for running;
- tennis rally-work/recovery patterns;
- baseball velocity × spin and exit-velocity × launch-angle;
- motorsport speed/brake/throttle and driver HR/temperature/g-load;
- MotoGP lean-angle/g-load;
- diving depth/absolute pressure;
- diving hover/vertical-control profile;
- freediving depth/HR/SpO₂;
- current/wind vectors for outdoor and water sports.

Every graph needs synchronized timestamps and source identity. If a stream is estimated rather than directly measured, the graph must say so.

## Endurance physiology

A classic review by Joyner & Coyle identifies VO₂max, lactate threshold and efficiency/economy as major interacting determinants of endurance performance. A newer systematic review notes that exercise-intensity domains are commonly anchored to ventilatory/lactate thresholds and critical power/speed concepts; HRV-derived thresholds are a research/alternative approach rather than a drop-in equivalent.

Sources:
- https://pubmed.ncbi.nlm.nih.gov/17901124/
- https://pubmed.ncbi.nlm.nih.gov/37462761/
- https://pubmed.ncbi.nlm.nih.gov/41845944/

Panacea therefore keeps:
- measured VO₂ separate from wearable VO₂ estimates;
- measured lactate separate from HR-derived guesses;
- threshold protocol/version in provenance;
- economy/efficiency sport-specific rather than universal.

## Tennis

The ITF conditioning overview describes tennis as a sport with rallies that may end faster than a 100 m sprint while matches can extend for marathon-like durations. Players repeatedly start, stop, twist, turn, jump, slide and recover across multiple planes, with court surface and playing style altering physical demands.

Source:
- https://www.itftennis.com/media/2297/conditioning-overview.pdf

Panacea tennis layers should therefore combine:
- rally duration and work:rest structure;
- serve speed and stroke/shot tracking when a validated camera/radar source exists;
- court coverage and direction changes;
- HR/internal load and recovery;
- surface, wind and heat context;
- technique/tactical video analysis with confidence rather than invented labels.

## Baseball

MLB Statcast is the reference model for high-resolution baseball tracking. It measures pitch, hit, player and bat variables including pitch velocity, spin, exit velocity, launch angle, sprint speed, bat speed, swing path and other derived metrics.

Sources:
- https://www.mlb.com/glossary/statcast
- https://baseballsavant.mlb.com/csv-docs
- https://baseballsavant.mlb.com/leaderboard/bat-tracking

Panacea uses Statcast-like metric definitions only when an actual compatible tracking source exists. It must not imply access to MLB proprietary feeds.

## Motorsport — F1, Daytona/endurance, MotoGP, rally, karting

The FIA publishes current Formula 1 regulations and medical guidance for drivers. FIA safety research also uses in-ear accelerometers and accident data recorders to understand high-G crash dynamics.

Sources:
- https://www.fia.com/regulation/category/110
- https://www.fia.com/news/fia-launches-pioneering-medical-guidelines-support-driver-health-and-wellbeing
- https://www.fia.com/news/f1-safety-measures

Official MotoGP material describes more than 60 main bike sensors, including IMU orientation, brake pressure, suspension travel, RPM, air pressure/temperature, clutch/levers/throttle and other telemetry used by teams.

Source:
- https://www.motogp.com/en/news/2025/12/14/what-electronics-are-used-in-motogp-bikes/823661

Panacea separates:
- vehicle telemetry: speed, g-load, brake, throttle, steering/lean, suspension, RPM, tire/environment state when available;
- human telemetry: HR, HRV, respiration, temperature, hydration/recovery if measured;
- strategy/context: lap/stint, traffic, weather, track conditions;
- safety/medical decisions: external authority.

No Panacea module controls a race vehicle.

## Scuba diving

DAN emphasizes buoyancy/trim as important dive-safety and efficiency skills. Poor buoyancy can increase effort/gas use and contribute to uncontrolled ascents. DAN also explains that digital depth gauges derive depth from absolute pressure relative to stored surface pressure.

Sources:
- https://dan.org/alert-diver/article/the-importance-of-buoyancy-control/
- https://dan.org/alert-diver/article/mastering-neutral-buoyancy-and-trim/
- https://dan.org/alert-diver/article/establishing-a-baseline/
- https://dan.org/alert-diver/article/the-physiology-of-compressed-gas-diving/

Hydrostatic approximation:

`P_abs = P_surface + rho*g*h`

Ideal-gas Boyle approximation at roughly stable temperature:

`P1*V1 = P2*V2`

These physics formulas are educational/contextual. Panacea is not a decompression computer and does not prescribe ballast from inferred data.

## Freediving

Recent reviews describe freediving as an extreme integrative physiological challenge involving hypoxia, hypercapnia, hydrostatic pressure, bradycardia, vasoconstriction, splenic contraction, pulmonary compression and potential neurological/pulmonary/decompression risks.

Sources:
- https://pubmed.ncbi.nlm.nih.gov/41417060/
- https://pubmed.ncbi.nlm.nih.gov/29687909/
- https://pubmed.ncbi.nlm.nih.gov/34093221/
- https://pubmed.ncbi.nlm.nih.gov/33791844/

Panacea may graph measured depth, dive time, surface interval, HR and validated SpO₂ streams. It must **not predict blackout time** or imply that a wearable replaces a freediving buddy/safety diver.

## Formula set

Session load:

`sRPE load = durationMinutes × RPE`

Underwater pressure:

`P_abs = P_surface + rho*g*h`

Boyle approximation:

`V2 = V1 × P1/P2`

Resultant g-load:

`g_resultant = sqrt(ax² + ay² + az²) / g0`

Two-trial critical speed:

`CS = (D2 - D1)/(T2 - T1)`

These formulas are used only when their input assumptions and measurement sources are explicit.

## Future source adapters

The next source layer should be adapter-based and conformance-tested:

- sport wearables and HR/HRV sensors;
- running pods/foot pods and cycling power meters;
- tennis/baseball camera/radar tracking;
- event timing feeds;
- vehicle CAN/ECU telemetry only when explicitly authorized;
- dive computers/depth/pressure/air-integration adapters;
- environmental weather/current/terrain/bathymetry adapters;
- rescue/location/communications links already governed by the Adventure/Rescue OS.

The UI should then render scientific graphs from these contracts rather than building a different data model for every sport.
