/**
 * Dua identitas pertukaran gas berbentuk aljabar murni (tanpa konstanta fisiologi, tanpa ambang interpretasi):
 *  - fraksi ruang rugi fisiologis, modifikasi ENGHOFF dari persamaan Bohr (PaCO₂ menggantikan PCO₂ alveolar): VD/VT = (PaCO₂ − PēCO₂) / PaCO₂
 *  - fraksi shunt dari kandungan O₂: Qs/Qt = (CcO₂ − CaO₂) / (CcO₂ − CvO₂)
 * Masukan HARUS berupa nilai terukur milik pemanggil (kelas kebenaran `derived` dari data terukur); mesin tidak mengisi nilai hilang,
 * tidak menjepit hasil ke rentang yang tampak wajar, dan tidak menafsirkan angka.
 *
 * SUMBER (diperiksa dari ABSTRAK PubMed pada 2026-10-30, bukan dari ingatan; teks penuh belum dibaca):
 *  - PMID 28223465 (Bourgoin dkk., Respir Care 2017): Bohr memakai PCO₂ alveolar, modifikasi Enghoff memakai PaCO₂.
 *  - PMID 16126784 (Tang, Turner, Baker, Br J Anaesth 2005): shunt dan maldistribusi V/Q menaikkan dead space Bohr–Enghoff terhitung.
 *  - PMID 8599295 (Wandrup, Acta Anaesthesiol Scand Suppl 1995): Qs/Qt butuh kandungan O₂ arteri DAN campuran vena; pada FiO₂ < 100% hasilnya
 *    adalah venous admixture (Qsp/Qt), bukan shunt murni.
 *  - PMID 964271 (Stalder dkk., Eur J Intensive Care Med 1976): persamaan shunt "Leigh dkk. 1969" dirujuk; bentuk aljabarnya TIDAK tercetak di
 *    abstrak mana pun yang dibaca, jadi bentuk Qs/Qt di sini adalah bentuk baku yang BELUM diverifikasi dari teks sumber.
 */
export const GAS_EXCHANGE_IDENTITY_SOURCES = Object.freeze({
  deadSpace: Object.freeze({ pmids: Object.freeze(['28223465', '16126784']), verifiedFrom: 'abstract' as const, formVerified: false as const }),
  shunt: Object.freeze({ pmids: Object.freeze(['8599295', '964271']), verifiedFrom: 'abstract' as const, formVerified: false as const }),
})

const DEAD_SPACE_LIMITS = Object.freeze([
  'Enghoff modification: uses arterial PCO₂, so shunt and V/Q maldistribution inflate the apparent dead space (PMID 16126784).',
  'Not a diagnosis, not a ventilator target; interpretation needs the measurement method to be reported (PMID 28223465).',
])
const SHUNT_LIMITS = Object.freeze([
  'Needs arterial and mixed-venous oxygen content; below 100% inspired oxygen the result is venous admixture, not pure shunt (PMID 8599295).',
  'The algebraic form is the standard one but was not printed in any abstract read; verify against the source text before clinical use.',
  'Not a diagnosis; no interpretation bands are applied.',
])

export type IdentityResult =
  | { ok: true; fraction: number; truthClass: 'derived'; formula: string; sourcePmids: readonly string[]; limitations: readonly string[] }
  | { ok: false; reason: 'invalid-input' | 'impossible-combination'; detail: string }

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** VD/VT (Enghoff). PaCO₂ dan PēCO₂ dalam satuan yang sama (mmHg atau kPa); PēCO₂ ≤ PaCO₂ pada gas campuran yang masuk akal. */
export function deadSpaceFraction(paco2: number, pecco2: number): IdentityResult {
  if (!finite(paco2) || !finite(pecco2) || paco2 <= 0 || pecco2 < 0) return { ok: false, reason: 'invalid-input', detail: 'PaCO₂ must be > 0 and mixed expired PCO₂ ≥ 0, both finite.' }
  if (pecco2 > paco2) return { ok: false, reason: 'impossible-combination', detail: 'Mixed expired PCO₂ above arterial PCO₂ gives a negative dead-space fraction; the inputs are inconsistent, not clamped.' }
  return { ok: true, fraction: (paco2 - pecco2) / paco2, truthClass: 'derived', formula: 'VD/VT = (PaCO2 - PeCO2) / PaCO2 (Enghoff modification)', sourcePmids: GAS_EXCHANGE_IDENTITY_SOURCES.deadSpace.pmids, limitations: DEAD_SPACE_LIMITS }
}

/** Qs/Qt. Semua kandungan O₂ dalam satuan sama (mL O₂/dL). Syarat fisik: CvO₂ < CaO₂ ≤ CcO₂ (arteri tak melebihi kapiler paru ideal). */
export function shuntFraction(cc: number, ca: number, cv: number): IdentityResult {
  if (![cc, ca, cv].every(finite) || cc <= 0 || ca <= 0 || cv < 0) return { ok: false, reason: 'invalid-input', detail: 'Oxygen contents must be finite, CcO₂ and CaO₂ > 0, CvO₂ ≥ 0.' }
  if (cc <= cv) return { ok: false, reason: 'impossible-combination', detail: 'CcO₂ must exceed CvO₂ (zero or negative denominator).' }
  if (ca > cc) return { ok: false, reason: 'impossible-combination', detail: 'CaO₂ above end-capillary CcO₂ gives a negative shunt fraction; inputs are inconsistent, not clamped.' }
  if (ca < cv) return { ok: false, reason: 'impossible-combination', detail: 'CaO₂ below CvO₂ gives a shunt fraction above 1.' }
  return { ok: true, fraction: (cc - ca) / (cc - cv), truthClass: 'derived', formula: 'Qs/Qt = (CcO2 - CaO2) / (CcO2 - CvO2)', sourcePmids: GAS_EXCHANGE_IDENTITY_SOURCES.shunt.pmids, limitations: SHUNT_LIMITS }
}
