/**
 * Dua identitas pertukaran gas berbentuk aljabar murni (tanpa konstanta fisiologi, tanpa ambang interpretasi):
 *  - fraksi ruang rugi fisiologis (bentuk Bohr–Enghoff): VD/VT = (PaCO₂ − PēCO₂) / PaCO₂
 *  - fraksi shunt dari kandungan O₂: Qs/Qt = (CcO₂ − CaO₂) / (CcO₂ − CvO₂)
 * Masukan HARUS berupa nilai terukur milik pemanggil (kelas kebenaran `derived` dari data terukur); mesin tidak mengisi nilai hilang,
 * tidak menjepit hasil ke rentang yang tampak wajar, dan tidak menafsirkan angka. Sitasi buku/artikel untuk bentuk persamaan
 * WAJIB ditambahkan sebelum dipakai di UI: belum ada rujukan terverifikasi di berkas ini.
 */
export type IdentityResult =
  | { ok: true; fraction: number; truthClass: 'derived'; formula: string }
  | { ok: false; reason: 'invalid-input' | 'impossible-combination'; detail: string }

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** VD/VT. PaCO₂ dan PēCO₂ dalam satuan yang sama (mmHg atau kPa); PēCO₂ ≤ PaCO₂ pada gas campuran yang masuk akal. */
export function deadSpaceFraction(paco2: number, pecco2: number): IdentityResult {
  if (!finite(paco2) || !finite(pecco2) || paco2 <= 0 || pecco2 < 0) return { ok: false, reason: 'invalid-input', detail: 'PaCO₂ must be > 0 and mixed expired PCO₂ ≥ 0, both finite.' }
  if (pecco2 > paco2) return { ok: false, reason: 'impossible-combination', detail: 'Mixed expired PCO₂ above arterial PCO₂ gives a negative dead-space fraction; the inputs are inconsistent, not clamped.' }
  return { ok: true, fraction: (paco2 - pecco2) / paco2, truthClass: 'derived', formula: 'VD/VT = (PaCO2 - PeCO2) / PaCO2' }
}

/** Qs/Qt. Semua kandungan O₂ dalam satuan sama (mL O₂/dL). Syarat fisik: CvO₂ < CaO₂ ≤ CcO₂ (arteri tak melebihi kapiler paru ideal). */
export function shuntFraction(cc: number, ca: number, cv: number): IdentityResult {
  if (![cc, ca, cv].every(finite) || cc <= 0 || ca <= 0 || cv < 0) return { ok: false, reason: 'invalid-input', detail: 'Oxygen contents must be finite, CcO₂ and CaO₂ > 0, CvO₂ ≥ 0.' }
  if (cc <= cv) return { ok: false, reason: 'impossible-combination', detail: 'CcO₂ must exceed CvO₂ (zero or negative denominator).' }
  if (ca > cc) return { ok: false, reason: 'impossible-combination', detail: 'CaO₂ above end-capillary CcO₂ gives a negative shunt fraction; inputs are inconsistent, not clamped.' }
  if (ca < cv) return { ok: false, reason: 'impossible-combination', detail: 'CaO₂ below CvO₂ gives a shunt fraction above 1.' }
  return { ok: true, fraction: (cc - ca) / (cc - cv), truthClass: 'derived', formula: 'Qs/Qt = (CcO2 - CaO2) / (CcO2 - CvO2)' }
}
