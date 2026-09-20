/**
 * Panacea Universal Sport OS
 *
 * One extensible contract for sport science, physiology, biomechanics,
 * technique, tactics, environment, equipment, telemetry and rescue context.
 *
 * Sport-specific metrics remain source-aware. A registry entry describes what
 * Panacea CAN model; it does not imply that a connected device actually
 * provides every metric.
 */

export type SportFamily =
  | 'endurance'
  | 'racquet'
  | 'bat-ball'
  | 'team-field'
  | 'court-team'
  | 'combat'
  | 'strength'
  | 'precision'
  | 'water'
  | 'mountain-winter'
  | 'aerial'
  | 'motorsport'
  | 'equestrian'
  | 'gymnastics'
  | 'tactical'

export type SportScienceLayer =
  | 'physiology'
  | 'biomechanics'
  | 'technique'
  | 'tactics'
  | 'internal-load'
  | 'external-load'
  | 'recovery'
  | 'environment'
  | 'equipment'
  | 'position'
  | 'communications'
  | 'safety'

export type MeasurementAuthority =
  | 'wearable'
  | 'sport-equipment'
  | 'vehicle-telemetry'
  | 'camera-radar'
  | 'manual'
  | 'lab'
  | 'environment-model'
  | 'official-event-feed'
  | 'certified-safety-system'

export interface SportMetric {
  id: string
  label: string
  unit: string
  layer: SportScienceLayer
  authority: MeasurementAuthority
  notes: string
  requiresSource: true
}

export interface UniversalSportProfile {
  id: string
  label: string
  family: SportFamily
  layers: readonly SportScienceLayer[]
  metricPacks: readonly string[]
  environmentDependencies: readonly string[]
  safetyNotes?: readonly string[]
}

const metric = (
  id: string,
  label: string,
  unit: string,
  layer: SportScienceLayer,
  authority: MeasurementAuthority,
  notes: string,
): SportMetric => Object.freeze({ id, label, unit, layer, authority, notes, requiresSource: true as const })

export const UNIVERSAL_SPORT_METRICS = Object.freeze([
  metric('heart-rate', 'Heart rate', 'bpm', 'physiology', 'wearable', 'Prefer raw or high-resolution HR with device/source identity.'),
  metric('hrv', 'Heart-rate variability', 'ms', 'recovery', 'wearable', 'Use source-specific HRV metric and personal baseline; do not mix RMSSD and SDNN silently.'),
  metric('respiratory-rate', 'Respiratory rate', 'breaths/min', 'physiology', 'wearable', 'Only expose when actually measured or source-documented as estimated.'),
  metric('spo2', 'Peripheral oxygen saturation', '%', 'physiology', 'wearable', 'Sensor context matters; motion, perfusion, altitude and water exposure can degrade validity.'),
  metric('skin-temperature', 'Skin temperature', '°C', 'physiology', 'wearable', 'Skin temperature is not core temperature.'),
  metric('core-temperature', 'Core temperature', '°C', 'physiology', 'lab', 'Use only validated core-temperature source/model and retain method.'),
  metric('lactate', 'Blood lactate', 'mmol/L', 'physiology', 'lab', 'Requires measured blood lactate; never fabricate from HR alone.'),
  metric('vo2', 'Oxygen uptake', 'mL/kg/min', 'physiology', 'lab', 'Measured VO₂ and wearable VO₂ estimates are different evidence classes.'),
  metric('rpe', 'Rating of perceived exertion', '0-10', 'internal-load', 'manual', 'Explicit athlete self-report.'),
  metric('srpe-load', 'Session RPE load', 'AU', 'internal-load', 'manual', 'durationMinutes × sessionRPE.'),
  metric('speed', 'Speed', 'm/s', 'external-load', 'wearable', 'Preserve GNSS/track/camera source and sampling quality.'),
  metric('pace', 'Pace', 'time/distance', 'external-load', 'wearable', 'Use moving vs elapsed pace explicitly.'),
  metric('distance', 'Distance', 'm', 'external-load', 'wearable', 'GPS distance and wheel/track distance are separate sources.'),
  metric('acceleration', 'Acceleration', 'm/s²', 'biomechanics', 'wearable', 'Sensor frame and gravity removal must be defined.'),
  metric('angular-velocity', 'Angular velocity', 'deg/s', 'biomechanics', 'wearable', 'IMU axis/frame must be retained.'),
  metric('mechanical-power', 'Mechanical power', 'W', 'external-load', 'sport-equipment', 'Meter/device algorithm and calibration matter.'),
  metric('elevation', 'Elevation', 'm', 'environment', 'environment-model', 'GNSS altitude and mapped terrain elevation are distinct.'),
  metric('slope', 'Slope', 'degrees', 'environment', 'environment-model', 'Computed from elevation change over horizontal distance.'),
  metric('wind-vector', 'Wind vector', 'm/s + bearing', 'environment', 'environment-model', 'Preserve meteorological source and direction convention.'),
  metric('current-vector', 'Water current vector', 'm/s + bearing', 'environment', 'environment-model', 'Measured/modelled current with time/depth/uncertainty.'),
  metric('wave-state', 'Wave state', 'm / s', 'environment', 'environment-model', 'Wave height/period/direction require source and forecast age.'),
  metric('air-temperature', 'Air temperature', '°C', 'environment', 'environment-model', 'Environmental, not body temperature.'),
  metric('water-temperature', 'Water temperature', '°C', 'environment', 'sport-equipment', 'Source may be dive computer, buoy or model.'),
  metric('barometric-pressure', 'Surface pressure', 'Pa', 'environment', 'environment-model', 'Important for altitude/weather and pressure-referenced activities.'),
  metric('position', 'Position', 'lat/lon', 'position', 'wearable', 'Measured and derived positions must remain distinguishable.'),
  metric('communication-quality', 'Communication quality', 'index', 'communications', 'sport-equipment', 'Transport health only; not clinical severity.'),
] satisfies readonly SportMetric[])

export interface MetricPack {
  id: string
  metricIds: readonly string[]
}

export const SPORT_METRIC_PACKS = Object.freeze([
  { id: 'endurance-core', metricIds: ['heart-rate', 'hrv', 'rpe', 'srpe-load', 'speed', 'pace', 'distance', 'mechanical-power', 'vo2', 'lactate', 'air-temperature', 'wind-vector'] },
  { id: 'team-gps', metricIds: ['heart-rate', 'speed', 'distance', 'acceleration', 'rpe', 'srpe-load', 'position', 'air-temperature'] },
  { id: 'racquet-court', metricIds: ['heart-rate', 'speed', 'distance', 'acceleration', 'angular-velocity', 'rpe', 'position', 'air-temperature'] },
  { id: 'strength-core', metricIds: ['heart-rate', 'rpe', 'srpe-load', 'acceleration', 'angular-velocity', 'mechanical-power'] },
  { id: 'water-core', metricIds: ['heart-rate', 'distance', 'speed', 'water-temperature', 'current-vector', 'wave-state', 'position', 'communication-quality'] },
  { id: 'diving-core', metricIds: ['heart-rate', 'respiratory-rate', 'water-temperature', 'current-vector', 'barometric-pressure', 'position', 'communication-quality'] },
  { id: 'freedive-core', metricIds: ['heart-rate', 'spo2', 'water-temperature', 'current-vector', 'barometric-pressure', 'position', 'communication-quality'] },
  { id: 'motorsport-driver', metricIds: ['heart-rate', 'hrv', 'respiratory-rate', 'skin-temperature', 'core-temperature', 'rpe', 'acceleration', 'position', 'communication-quality', 'air-temperature'] },
  { id: 'aerial-core', metricIds: ['heart-rate', 'acceleration', 'angular-velocity', 'barometric-pressure', 'wind-vector', 'position', 'communication-quality', 'air-temperature'] },
] satisfies readonly MetricPack[])

export const SPORT_UNIVERSE = Object.freeze([
  { id: 'running-road', label: 'Road running', family: 'endurance', layers: ['physiology','biomechanics','technique','tactics','internal-load','external-load','recovery','environment','position'], metricPacks: ['endurance-core'], environmentDependencies: ['temperature','humidity','wind','elevation'] },
  { id: 'track-field', label: 'Track & field', family: 'endurance', layers: ['physiology','biomechanics','technique','external-load','recovery'], metricPacks: ['endurance-core'], environmentDependencies: ['temperature','wind'] },
  { id: 'ultramarathon', label: 'Ultramarathon', family: 'endurance', layers: ['physiology','tactics','internal-load','external-load','recovery','environment','position','safety'], metricPacks: ['endurance-core'], environmentDependencies: ['terrain','weather','altitude','navigation'] },
  { id: 'road-cycling', label: 'Road cycling', family: 'endurance', layers: ['physiology','biomechanics','technique','tactics','external-load','equipment','environment','position'], metricPacks: ['endurance-core'], environmentDependencies: ['gradient','wind','temperature','altitude'] },
  { id: 'mountain-bike', label: 'Mountain biking', family: 'endurance', layers: ['physiology','biomechanics','technique','tactics','equipment','environment','position','safety'], metricPacks: ['endurance-core'], environmentDependencies: ['terrain','surface','gradient','weather'] },
  { id: 'swimming-pool', label: 'Pool swimming', family: 'water', layers: ['physiology','biomechanics','technique','external-load','recovery'], metricPacks: ['water-core'], environmentDependencies: ['water-temperature','pool-length'] },
  { id: 'open-water-swimming', label: 'Open-water swimming', family: 'water', layers: ['physiology','technique','tactics','environment','position','communications','safety'], metricPacks: ['water-core'], environmentDependencies: ['current','wind','waves','water-temperature'] },
  { id: 'triathlon', label: 'Triathlon / Ironman', family: 'endurance', layers: ['physiology','technique','tactics','internal-load','external-load','recovery','environment','position','safety'], metricPacks: ['endurance-core','water-core'], environmentDependencies: ['current','wind','temperature','terrain'] },
  { id: 'rowing', label: 'Rowing', family: 'water', layers: ['physiology','biomechanics','technique','external-load','environment'], metricPacks: ['endurance-core','water-core'], environmentDependencies: ['wind','current','water-temperature'] },
  { id: 'kayak-canoe', label: 'Kayak / canoe', family: 'water', layers: ['physiology','biomechanics','technique','tactics','environment','position','safety'], metricPacks: ['water-core'], environmentDependencies: ['current','wind','waves'] },
  { id: 'tennis', label: 'Tennis', family: 'racquet', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','environment','position'], metricPacks: ['racquet-court'], environmentDependencies: ['court-surface','temperature','wind'] },
  { id: 'padel', label: 'Padel', family: 'racquet', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','position'], metricPacks: ['racquet-court'], environmentDependencies: ['court-surface','temperature'] },
  { id: 'badminton', label: 'Badminton', family: 'racquet', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery'], metricPacks: ['racquet-court'], environmentDependencies: ['indoor-temperature'] },
  { id: 'squash', label: 'Squash', family: 'racquet', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery'], metricPacks: ['racquet-court'], environmentDependencies: ['indoor-temperature'] },
  { id: 'pickleball', label: 'Pickleball', family: 'racquet', layers: ['physiology','biomechanics','technique','tactics','external-load'], metricPacks: ['racquet-court'], environmentDependencies: ['court-surface','temperature'] },
  { id: 'baseball', label: 'Baseball', family: 'bat-ball', layers: ['physiology','biomechanics','technique','tactics','external-load','equipment','position'], metricPacks: ['team-gps'], environmentDependencies: ['temperature','wind','venue'] },
  { id: 'softball', label: 'Softball', family: 'bat-ball', layers: ['physiology','biomechanics','technique','tactics','external-load','equipment','position'], metricPacks: ['team-gps'], environmentDependencies: ['temperature','wind','venue'] },
  { id: 'football-soccer', label: 'Football / soccer', family: 'team-field', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','position'], metricPacks: ['team-gps'], environmentDependencies: ['surface','temperature','weather'] },
  { id: 'futsal', label: 'Futsal', family: 'court-team', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery'], metricPacks: ['team-gps'], environmentDependencies: ['surface','indoor-temperature'] },
  { id: 'basketball', label: 'Basketball', family: 'court-team', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','position'], metricPacks: ['team-gps'], environmentDependencies: ['surface','indoor-temperature'] },
  { id: 'volleyball', label: 'Volleyball', family: 'court-team', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery'], metricPacks: ['team-gps'], environmentDependencies: ['surface','indoor-temperature'] },
  { id: 'rugby', label: 'Rugby', family: 'team-field', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','position','safety'], metricPacks: ['team-gps'], environmentDependencies: ['surface','weather'] },
  { id: 'american-football', label: 'American football', family: 'team-field', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','position','safety'], metricPacks: ['team-gps'], environmentDependencies: ['surface','weather'] },
  { id: 'ice-hockey', label: 'Ice hockey', family: 'team-field', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','position'], metricPacks: ['team-gps'], environmentDependencies: ['ice-surface','arena-temperature'] },
  { id: 'boxing', label: 'Boxing', family: 'combat', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','safety'], metricPacks: ['strength-core'], environmentDependencies: ['venue-temperature'] },
  { id: 'mma', label: 'MMA', family: 'combat', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','safety'], metricPacks: ['strength-core'], environmentDependencies: ['venue-temperature'] },
  { id: 'wrestling', label: 'Wrestling', family: 'combat', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','safety'], metricPacks: ['strength-core'], environmentDependencies: ['venue-temperature'] },
  { id: 'judo', label: 'Judo', family: 'combat', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery','safety'], metricPacks: ['strength-core'], environmentDependencies: ['venue-temperature'] },
  { id: 'taekwondo', label: 'Taekwondo', family: 'combat', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery'], metricPacks: ['strength-core'], environmentDependencies: ['venue-temperature'] },
  { id: 'fencing', label: 'Fencing', family: 'precision', layers: ['physiology','biomechanics','technique','tactics','external-load','recovery'], metricPacks: ['racquet-court'], environmentDependencies: ['venue-temperature'] },
  { id: 'strength-training', label: 'Strength training', family: 'strength', layers: ['physiology','biomechanics','technique','internal-load','external-load','recovery','equipment'], metricPacks: ['strength-core'], environmentDependencies: ['temperature'] },
  { id: 'olympic-weightlifting', label: 'Olympic weightlifting', family: 'strength', layers: ['physiology','biomechanics','technique','external-load','recovery','equipment'], metricPacks: ['strength-core'], environmentDependencies: ['platform'] },
  { id: 'powerlifting', label: 'Powerlifting', family: 'strength', layers: ['physiology','biomechanics','technique','external-load','recovery','equipment'], metricPacks: ['strength-core'], environmentDependencies: ['platform'] },
  { id: 'crossfit', label: 'CrossFit', family: 'strength', layers: ['physiology','biomechanics','technique','tactics','internal-load','external-load','recovery'], metricPacks: ['strength-core','endurance-core'], environmentDependencies: ['temperature'] },
  { id: 'hyrox', label: 'HYROX', family: 'endurance', layers: ['physiology','biomechanics','technique','tactics','internal-load','external-load','recovery'], metricPacks: ['endurance-core','strength-core'], environmentDependencies: ['venue-temperature'] },
  { id: 'golf', label: 'Golf', family: 'precision', layers: ['biomechanics','technique','tactics','external-load','environment','equipment'], metricPacks: ['racquet-court'], environmentDependencies: ['wind','temperature','course-topography'] },
  { id: 'archery', label: 'Archery', family: 'precision', layers: ['physiology','biomechanics','technique','tactics','environment','equipment'], metricPacks: ['strength-core'], environmentDependencies: ['wind','temperature'] },
  { id: 'sport-shooting', label: 'Sport shooting', family: 'precision', layers: ['physiology','biomechanics','technique','tactics','environment','equipment','safety'], metricPacks: ['strength-core'], environmentDependencies: ['wind','temperature'] },
  { id: 'climbing', label: 'Climbing', family: 'mountain-winter', layers: ['physiology','biomechanics','technique','tactics','external-load','environment','position','safety'], metricPacks: ['strength-core'], environmentDependencies: ['terrain','weather','altitude'] },
  { id: 'mountaineering', label: 'Mountaineering', family: 'mountain-winter', layers: ['physiology','tactics','internal-load','external-load','environment','position','communications','safety'], metricPacks: ['endurance-core'], environmentDependencies: ['terrain','weather','altitude','temperature'] },
  { id: 'skiing', label: 'Skiing', family: 'mountain-winter', layers: ['physiology','biomechanics','technique','tactics','environment','position','safety'], metricPacks: ['endurance-core'], environmentDependencies: ['snow','slope','weather','altitude'] },
  { id: 'snowboarding', label: 'Snowboarding', family: 'mountain-winter', layers: ['physiology','biomechanics','technique','environment','position','safety'], metricPacks: ['endurance-core'], environmentDependencies: ['snow','slope','weather','altitude'] },
  { id: 'surfing', label: 'Surfing', family: 'water', layers: ['physiology','biomechanics','technique','tactics','environment','position','safety'], metricPacks: ['water-core'], environmentDependencies: ['waves','wind','current','water-temperature'] },
  { id: 'sailing', label: 'Sailing', family: 'water', layers: ['physiology','technique','tactics','environment','position','communications','equipment','safety'], metricPacks: ['water-core'], environmentDependencies: ['wind','current','waves','weather'] },
  { id: 'scuba-diving', label: 'Scuba diving', family: 'water', layers: ['physiology','technique','environment','equipment','position','communications','safety'], metricPacks: ['diving-core'], environmentDependencies: ['surface-pressure','depth-pressure','current','water-temperature','visibility'] },
  { id: 'freediving', label: 'Freediving', family: 'water', layers: ['physiology','technique','environment','position','communications','safety'], metricPacks: ['freedive-core'], environmentDependencies: ['surface-pressure','depth-pressure','current','water-temperature'] },
  { id: 'skydiving', label: 'Skydiving', family: 'aerial', layers: ['physiology','biomechanics','technique','environment','position','communications','equipment','safety'], metricPacks: ['aerial-core'], environmentDependencies: ['wind','weather','altitude','airspace'] },
  { id: 'paragliding', label: 'Paragliding', family: 'aerial', layers: ['physiology','technique','tactics','environment','position','communications','equipment','safety'], metricPacks: ['aerial-core'], environmentDependencies: ['wind','thermals','weather','terrain'] },
  { id: 'f1', label: 'Formula 1', family: 'motorsport', layers: ['physiology','biomechanics','technique','tactics','external-load','environment','equipment','position','communications','safety'], metricPacks: ['motorsport-driver'], environmentDependencies: ['track-temperature','weather','wind'] },
  { id: 'daytona-endurance', label: 'Daytona / endurance racing', family: 'motorsport', layers: ['physiology','technique','tactics','external-load','recovery','environment','equipment','position','communications','safety'], metricPacks: ['motorsport-driver'], environmentDependencies: ['track-temperature','weather','night-day-cycle'] },
  { id: 'motogp', label: 'MotoGP', family: 'motorsport', layers: ['physiology','biomechanics','technique','tactics','external-load','environment','equipment','position','communications','safety'], metricPacks: ['motorsport-driver'], environmentDependencies: ['track-temperature','weather','wind','grip'] },
  { id: 'rally', label: 'Rally', family: 'motorsport', layers: ['physiology','technique','tactics','external-load','environment','equipment','position','communications','safety'], metricPacks: ['motorsport-driver'], environmentDependencies: ['surface','weather','terrain','visibility'] },
  { id: 'karting', label: 'Karting', family: 'motorsport', layers: ['physiology','biomechanics','technique','tactics','external-load','environment','equipment','safety'], metricPacks: ['motorsport-driver'], environmentDependencies: ['track-temperature','weather'] },
  { id: 'equestrian', label: 'Equestrian', family: 'equestrian', layers: ['physiology','biomechanics','technique','tactics','environment','equipment','safety'], metricPacks: ['racquet-court'], environmentDependencies: ['surface','temperature','weather'] },
  { id: 'gymnastics', label: 'Gymnastics', family: 'gymnastics', layers: ['physiology','biomechanics','technique','external-load','recovery','equipment','safety'], metricPacks: ['strength-core'], environmentDependencies: ['apparatus'] },
  { id: 'tactical-fitness', label: 'Tactical fitness', family: 'tactical', layers: ['physiology','biomechanics','technique','tactics','internal-load','external-load','recovery','environment','equipment','position','communications','safety'], metricPacks: ['endurance-core','strength-core'], environmentDependencies: ['terrain','weather','heat','load-carriage'] },
] satisfies readonly UniversalSportProfile[])

export interface SpecializedMetricDefinition {
  id: string
  sportIds: readonly string[]
  label: string
  unit: string
  layer: SportScienceLayer
  authority: MeasurementAuthority
  sourceDefinition: string
}

export const SPECIALIZED_SPORT_METRICS = Object.freeze([
  { id: 'tennis-serve-speed', sportIds: ['tennis'], label: 'Serve speed', unit: 'km/h', layer: 'technique', authority: 'camera-radar', sourceDefinition: 'Radar/camera measured serve velocity.' },
  { id: 'tennis-rally-duration', sportIds: ['tennis','padel'], label: 'Rally duration', unit: 's', layer: 'tactics', authority: 'camera-radar', sourceDefinition: 'Video/event segmentation.' },
  { id: 'tennis-direction-change', sportIds: ['tennis','padel','badminton','squash'], label: 'Direction changes', unit: 'count', layer: 'external-load', authority: 'wearable', sourceDefinition: 'Validated court-position/IMU event detector.' },

  { id: 'baseball-pitch-velocity', sportIds: ['baseball','softball'], label: 'Pitch velocity', unit: 'mph', layer: 'technique', authority: 'camera-radar', sourceDefinition: 'MLB Statcast-style tracked pitch velocity.' },
  { id: 'baseball-spin-rate', sportIds: ['baseball','softball'], label: 'Pitch spin rate', unit: 'rpm', layer: 'technique', authority: 'camera-radar', sourceDefinition: 'Tracked release spin.' },
  { id: 'baseball-exit-velocity', sportIds: ['baseball','softball'], label: 'Exit velocity', unit: 'mph', layer: 'technique', authority: 'camera-radar', sourceDefinition: 'Tracked batted-ball exit velocity.' },
  { id: 'baseball-launch-angle', sportIds: ['baseball','softball'], label: 'Launch angle', unit: 'deg', layer: 'technique', authority: 'camera-radar', sourceDefinition: 'Tracked vertical launch angle.' },
  { id: 'baseball-bat-speed', sportIds: ['baseball','softball'], label: 'Bat speed', unit: 'mph', layer: 'biomechanics', authority: 'camera-radar', sourceDefinition: 'Tracked bat sweet-spot speed.' },
  { id: 'baseball-sprint-speed', sportIds: ['baseball','softball'], label: 'Sprint speed', unit: 'ft/s', layer: 'external-load', authority: 'camera-radar', sourceDefinition: 'Tracked running-speed metric.' },

  { id: 'motorsport-lap-time', sportIds: ['f1','daytona-endurance','motogp','rally','karting'], label: 'Lap/stage time', unit: 's', layer: 'tactics', authority: 'official-event-feed', sourceDefinition: 'Official or vehicle timing source.' },
  { id: 'motorsport-speed', sportIds: ['f1','daytona-endurance','motogp','rally','karting'], label: 'Vehicle speed', unit: 'km/h', layer: 'external-load', authority: 'vehicle-telemetry', sourceDefinition: 'Authorized vehicle telemetry.' },
  { id: 'motorsport-g-load', sportIds: ['f1','daytona-endurance','motogp','rally','karting'], label: 'Resultant g-load', unit: 'g', layer: 'external-load', authority: 'vehicle-telemetry', sourceDefinition: 'IMU/acceleration-derived resultant load.' },
  { id: 'motorsport-brake-pressure', sportIds: ['f1','daytona-endurance','motogp','rally','karting'], label: 'Brake pressure', unit: 'source unit', layer: 'technique', authority: 'vehicle-telemetry', sourceDefinition: 'Authorized brake-pressure sensor.' },
  { id: 'motorsport-throttle', sportIds: ['f1','daytona-endurance','motogp','rally','karting'], label: 'Throttle position', unit: '%', layer: 'technique', authority: 'vehicle-telemetry', sourceDefinition: 'Authorized throttle-position sensor.' },
  { id: 'motogp-lean-angle', sportIds: ['motogp'], label: 'Lean angle', unit: 'deg', layer: 'biomechanics', authority: 'vehicle-telemetry', sourceDefinition: 'Bike IMU orientation.' },
  { id: 'motorsport-suspension-travel', sportIds: ['f1','daytona-endurance','motogp','rally'], label: 'Suspension travel', unit: 'mm', layer: 'equipment', authority: 'vehicle-telemetry', sourceDefinition: 'Authorized suspension-position sensor.' },

  { id: 'dive-depth', sportIds: ['scuba-diving','freediving'], label: 'Depth', unit: 'm', layer: 'environment', authority: 'sport-equipment', sourceDefinition: 'Pressure-derived depth from dive computer/depth sensor.' },
  { id: 'dive-ambient-pressure', sportIds: ['scuba-diving','freediving'], label: 'Ambient absolute pressure', unit: 'Pa', layer: 'environment', authority: 'sport-equipment', sourceDefinition: 'Absolute pressure with surface-pressure provenance.' },
  { id: 'dive-ascent-rate', sportIds: ['scuba-diving','freediving'], label: 'Vertical ascent rate', unit: 'm/min', layer: 'safety', authority: 'sport-equipment', sourceDefinition: 'Depth time-series derivative; actual dive-computer authority remains separate.' },
  { id: 'dive-hover-score', sportIds: ['scuba-diving'], label: 'Hover stability', unit: '0-1', layer: 'technique', authority: 'sport-equipment', sourceDefinition: 'Educational motion-control proxy from depth/IMU samples.' },
  { id: 'freedive-dive-time', sportIds: ['freediving'], label: 'Breath-hold dive duration', unit: 's', layer: 'physiology', authority: 'sport-equipment', sourceDefinition: 'Measured elapsed dive time.' },
  { id: 'freedive-surface-interval', sportIds: ['freediving'], label: 'Surface interval', unit: 's', layer: 'recovery', authority: 'sport-equipment', sourceDefinition: 'Measured time between dives.' },
] satisfies readonly SpecializedMetricDefinition[])

export type ScientificGraphKind = 'line' | 'scatter' | 'phase' | 'profile'

export interface ScientificGraphDefinition {
  id: string
  title: string
  kind: ScientificGraphKind
  xMetric: string
  yMetrics: readonly string[]
  appliesTo: readonly string[]
  interpretation: string
  safetyBoundary?: string
}

export const SCIENTIFIC_SPORT_GRAPHS = Object.freeze([
  {
    id: 'physiology-hr-time',
    title: 'Heart-rate response',
    kind: 'line',
    xMetric: 'elapsed-time',
    yMetrics: ['heart-rate'],
    appliesTo: ['*'],
    interpretation: 'Internal cardiovascular response across the session; interpret against sport, heat, hydration, altitude and prior load.',
  },
  {
    id: 'load-rpe-duration',
    title: 'Internal training load',
    kind: 'scatter',
    xMetric: 'duration-min',
    yMetrics: ['rpe','srpe-load'],
    appliesTo: ['*'],
    interpretation: 'sRPE load = durationMinutes × RPE; compare longitudinally rather than across unrelated sports.',
  },
  {
    id: 'endurance-power-hr',
    title: 'External output vs cardiovascular response',
    kind: 'scatter',
    xMetric: 'mechanical-power',
    yMetrics: ['heart-rate'],
    appliesTo: ['road-cycling','triathlon','rowing'],
    interpretation: 'Useful for durability/decoupling analysis when effort is sufficiently steady and sources are synchronized.',
  },
  {
    id: 'running-pace-hr',
    title: 'Pace vs cardiovascular response',
    kind: 'scatter',
    xMetric: 'pace',
    yMetrics: ['heart-rate'],
    appliesTo: ['running-road','ultramarathon','triathlon'],
    interpretation: 'Compare similar terrain/weather; hills, heat and wind materially alter the relationship.',
  },
  {
    id: 'tennis-work-rest',
    title: 'Rally / recovery demand',
    kind: 'phase',
    xMetric: 'elapsed-time',
    yMetrics: ['tennis-rally-duration','heart-rate'],
    appliesTo: ['tennis','padel'],
    interpretation: 'Repeated high-intensity work with recovery phases; court surface and match style change demands.',
  },
  {
    id: 'baseball-pitch-shape',
    title: 'Pitch velocity and spin',
    kind: 'scatter',
    xMetric: 'baseball-pitch-velocity',
    yMetrics: ['baseball-spin-rate'],
    appliesTo: ['baseball','softball'],
    interpretation: 'Tracking relationship only; pitch effectiveness also depends on movement, location, release and game context.',
  },
  {
    id: 'baseball-batted-ball',
    title: 'Batted-ball quality',
    kind: 'scatter',
    xMetric: 'baseball-exit-velocity',
    yMetrics: ['baseball-launch-angle'],
    appliesTo: ['baseball','softball'],
    interpretation: 'MLB Statcast-style exit velocity × launch angle view; retain tracking-source definitions.',
  },
  {
    id: 'motorsport-driver-load',
    title: 'Driver/rider physiological load',
    kind: 'line',
    xMetric: 'elapsed-time',
    yMetrics: ['heart-rate','core-temperature','motorsport-g-load'],
    appliesTo: ['f1','daytona-endurance','motogp','rally','karting'],
    interpretation: 'Overlay human and vehicle load only after clock synchronization.',
    safetyBoundary: 'Wearable physiology does not determine fitness-to-drive or replace motorsport medical decisions.',
  },
  {
    id: 'motorsport-control',
    title: 'Speed / brake / throttle',
    kind: 'line',
    xMetric: 'distance-or-time',
    yMetrics: ['motorsport-speed','motorsport-brake-pressure','motorsport-throttle'],
    appliesTo: ['f1','daytona-endurance','motogp','rally','karting'],
    interpretation: 'Technique/vehicle telemetry graph from authorized data only.',
  },
  {
    id: 'motogp-orientation',
    title: 'Lean angle and vehicle load',
    kind: 'line',
    xMetric: 'distance-or-time',
    yMetrics: ['motogp-lean-angle','motorsport-g-load'],
    appliesTo: ['motogp'],
    interpretation: 'Bike IMU context aligned to speed/braking and circuit location.',
  },
  {
    id: 'dive-depth-pressure',
    title: 'Depth and absolute pressure profile',
    kind: 'profile',
    xMetric: 'elapsed-time',
    yMetrics: ['dive-depth','dive-ambient-pressure'],
    appliesTo: ['scuba-diving','freediving'],
    interpretation: 'Pressure/depth visualization using actual samples and surface-pressure provenance.',
    safetyBoundary: 'Not a decompression schedule or freedive blackout predictor.',
  },
  {
    id: 'dive-motion-control',
    title: 'Dive hovering / vertical control',
    kind: 'line',
    xMetric: 'elapsed-time',
    yMetrics: ['dive-depth','vertical-speed','dive-hover-score'],
    appliesTo: ['scuba-diving'],
    interpretation: 'Technique graph for depth stability and vertical motion.',
    safetyBoundary: 'Do not use to prescribe ballast, gas strategy, ascent profile or decompression.',
  },
  {
    id: 'freedive-physiology',
    title: 'Freedive physiological response',
    kind: 'line',
    xMetric: 'elapsed-time',
    yMetrics: ['dive-depth','heart-rate','spo2'],
    appliesTo: ['freediving'],
    interpretation: 'Displays measured physiology and depth; breath-hold diving causes major cardiovascular/respiratory adaptations and hypoxic risk.',
    safetyBoundary: 'No blackout-time prediction. A buddy/safety diver and recognized freediving safety procedures remain primary.',
  },
  {
    id: 'environment-vector',
    title: 'Wind/current vector context',
    kind: 'line',
    xMetric: 'elapsed-time',
    yMetrics: ['wind-vector','current-vector'],
    appliesTo: ['open-water-swimming','triathlon','rowing','kayak-canoe','surfing','sailing','scuba-diving','freediving','skydiving','paragliding'],
    interpretation: 'Measured/modelled environmental vectors with timestamp, depth/altitude and uncertainty.',
  },
] satisfies readonly ScientificGraphDefinition[])

export const UNIVERSAL_SPORT_SOURCE_REGISTRY = Object.freeze([
  {
    id: 'pubmed-endurance-physiology',
    scope: ['endurance'],
    reference: 'Joyner & Coyle. Endurance exercise performance: the physiology of champions.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17901124/',
  },
  {
    id: 'itf-conditioning',
    scope: ['tennis'],
    reference: 'International Tennis Federation conditioning overview: repeated multidirectional movement and sport-specific physical demands.',
    url: 'https://www.itftennis.com/media/2297/conditioning-overview.pdf',
  },
  {
    id: 'mlb-statcast',
    scope: ['baseball'],
    reference: 'MLB Statcast glossary: pitch, hit, player and bat tracking definitions.',
    url: 'https://www.mlb.com/glossary/statcast',
  },
  {
    id: 'fia-medical',
    scope: ['motorsport'],
    reference: 'FIA medical guidance and motorsport safety framework.',
    url: 'https://www.fia.com/news/fia-launches-pioneering-medical-guidelines-support-driver-health-and-wellbeing',
  },
  {
    id: 'motogp-telemetry',
    scope: ['motogp'],
    reference: 'MotoGP official overview of ECU/IMU, brake, suspension, throttle and other telemetry.',
    url: 'https://www.motogp.com/en/news/2025/12/14/what-electronics-are-used-in-motogp-bikes/823661',
  },
  {
    id: 'dan-buoyancy',
    scope: ['scuba-diving'],
    reference: 'Divers Alert Network buoyancy-control and trim safety education.',
    url: 'https://dan.org/alert-diver/article/the-importance-of-buoyancy-control/',
  },
  {
    id: 'dan-pressure',
    scope: ['scuba-diving'],
    reference: 'Divers Alert Network pressure/depth baseline and altitude discussion.',
    url: 'https://dan.org/alert-diver/article/establishing-a-baseline/',
  },
  {
    id: 'pubmed-freediving-2025',
    scope: ['freediving'],
    reference: 'State-of-the-art review of breath-hold diving physiology and technology.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41417060/',
  },
])

export const UNIVERSAL_SPORT_OS_POLICY = Object.freeze({
  allMetricsRequireRealSource: true as const,
  separateMeasuredFromEstimated: true as const,
  noUniversalMentalToughnessScore: true as const,
  noMedicalDiagnosisFromPerformanceTelemetry: true as const,
  noAutonomousVehicleControl: true as const,
  noCertifiedNavigationReplacement: true as const,
  noDecompressionPlanner: true as const,
  noFreediveBlackoutPrediction: true as const,
  physiologyGraphsRequireSynchronizedTime: true as const,
})

export function getSportProfile(id: string) {
  return SPORT_UNIVERSE.find((sport) => sport.id === id) ?? null
}

export function listSportMetrics(id: string) {
  const sport = getSportProfile(id)
  if (!sport) return []

  const packIds = new Set(sport.metricPacks)
  const baseIds = new Set(
    SPORT_METRIC_PACKS
      .filter((pack) => packIds.has(pack.id))
      .flatMap((pack) => pack.metricIds),
  )

  return {
    base: UNIVERSAL_SPORT_METRICS.filter((m) => baseIds.has(m.id)),
    specialized: SPECIALIZED_SPORT_METRICS.filter((m) => m.sportIds.includes(id)),
  }
}

export function listScientificGraphs(id: string) {
  return SCIENTIFIC_SPORT_GRAPHS.filter(
    (graph) => graph.appliesTo.includes('*') || graph.appliesTo.includes(id),
  )
}

/** sRPE load = durationMinutes × RPE */
export function sessionRpeLoad(durationMinutes: number, rpe: number): number | null {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(rpe) || rpe < 0 || rpe > 10) {
    return null
  }
  return durationMinutes * rpe
}

/**
 * Hydrostatic absolute pressure:
 * P_abs = P_surface + rho*g*h
 */
export function underwaterAbsolutePressurePa(
  depthM: number,
  surfacePressurePa: number,
  waterDensityKgM3 = 1025,
  gravityMps2 = 9.80665,
): number | null {
  if (
    !Number.isFinite(depthM) || depthM < 0 ||
    !Number.isFinite(surfacePressurePa) || surfacePressurePa <= 0 ||
    !Number.isFinite(waterDensityKgM3) || waterDensityKgM3 <= 0 ||
    !Number.isFinite(gravityMps2) || gravityMps2 <= 0
  ) return null

  return surfacePressurePa + waterDensityKgM3 * gravityMps2 * depthM
}

/**
 * Boyle approximation for a fixed amount of ideal gas at roughly stable temperature:
 * P1*V1 = P2*V2 -> V2 = V1*(P1/P2)
 */
export function boyleRelativeGasVolume(
  initialVolume: number,
  initialAbsolutePressurePa: number,
  finalAbsolutePressurePa: number,
): number | null {
  if (
    !Number.isFinite(initialVolume) || initialVolume <= 0 ||
    !Number.isFinite(initialAbsolutePressurePa) || initialAbsolutePressurePa <= 0 ||
    !Number.isFinite(finalAbsolutePressurePa) || finalAbsolutePressurePa <= 0
  ) return null
  return initialVolume * initialAbsolutePressurePa / finalAbsolutePressurePa
}

/** Resultant acceleration normalized to standard gravity. */
export function resultantG(
  axMps2: number,
  ayMps2: number,
  azMps2: number,
  gravityMps2 = 9.80665,
): number | null {
  if (![axMps2, ayMps2, azMps2, gravityMps2].every(Number.isFinite) || gravityMps2 <= 0) return null
  return Math.hypot(axMps2, ayMps2, azMps2) / gravityMps2
}

/**
 * Critical speed from two valid maximal efforts:
 * CS = (D2-D1)/(T2-T1)
 * where D2>D1 and T2>T1.
 */
export function criticalSpeedMps(
  distance1M: number,
  time1S: number,
  distance2M: number,
  time2S: number,
): number | null {
  if (
    ![distance1M, time1S, distance2M, time2S].every(Number.isFinite) ||
    distance1M <= 0 || distance2M <= distance1M ||
    time1S <= 0 || time2S <= time1S
  ) return null
  return (distance2M - distance1M) / (time2S - time1S)
}
