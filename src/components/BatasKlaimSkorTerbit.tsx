import { BatasKlaimKesehatan } from './BatasKlaimKesehatan'

/** Shared claim boundary for standalone published clinical score pages. */
export function BatasKlaimSkorTerbit() {
  return <BatasKlaimKesehatan permukaan="calculators.published-score" />
}
