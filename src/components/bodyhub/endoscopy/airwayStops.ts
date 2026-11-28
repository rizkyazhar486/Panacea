// Bronchoscopy restart points, kept apart from the simulator so the page can list them without loading three.js.

export interface AirwayJump { id: string; n: number }
export interface AirwayStop { id: string; label: string }

/** Restart points for the procedure's stop chips. 'carina' is the view from just above the tracheal bifurcation. */
export const AIRWAY_STOPS: readonly AirwayStop[] = [
  { id: 'trachea', label: 'Trachea' },
  { id: 'carina', label: 'Carina' },
  { id: 'rmb', label: 'Right main' },
  { id: 'rul', label: 'Right upper lobe' },
  { id: 'bi', label: 'Intermedius' },
  { id: 'rml', label: 'Middle lobe' },
  { id: 'rll', label: 'Right lower lobe' },
  { id: 'lmb', label: 'Left main' },
  { id: 'lul', label: 'Left upper lobe' },
  { id: 'lll', label: 'Left lower lobe' },
]
