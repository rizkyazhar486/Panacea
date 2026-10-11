// API publik domain Sport: satu-satunya pintu impor dari luar domain.
export {
  validateHeatExposure, validateAltitude, validateAltitudeExposure,
  HEAT_TEMP_C, HEAT_MINUTES, ALTITUDE_M, ALTITUDE_HOURS,
} from './engine/acclimatisationLog'
export type { LogCheck } from './engine/acclimatisationLog'
export { parseNumberField } from '../clinical-calculators/engine/inputs'
