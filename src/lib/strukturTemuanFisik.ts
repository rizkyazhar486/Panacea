// Temuan pemeriksaan fisik per sistem -> SATU struktur rujukan atlas yang BENAR-BENAR
// ada di GLB sumber (diperiksa gerbang struktur-temuan-fisik terhadap snapshot node).
// Ini wilayah pemeriksaan untuk NAVIGASI, bukan lokasi lesi, target prosedur,
// atau anatomi pasien. Kunci tanpa node sumber yang tepat (mis. kulit) tidak
// dipetakan — gagal tertutup, tidak ditebak.
import type { BodySystemId } from './bodySystemSourceWave'

export interface StrukturTemuan { name: string; file: string; systemId: BodySystemId }

export const STRUKTUR_TEMUAN: Readonly<Record<string, StrukturTemuan>> = {
  jantung: { name: 'Left ventricle', file: 'cardiovascular.glb', systemId: 'cardiovascular' },
  paru: { name: 'Superior lobe of right lung', file: 'visceral.glb', systemId: 'respiratory' },
  abdomen: { name: 'Liver', file: 'visceral.glb', systemId: 'digestive' },
  mata: { name: 'Cornea.r', file: 'nervous.glb', systemId: 'sensory-ent' },
  leher: { name: 'Thyroid gland', file: 'visceral.glb', systemId: 'endocrine' },
  tht: { name: 'Epiglottis', file: 'visceral.glb', systemId: 'respiratory' },
  kepala: { name: 'Frontal bone', file: 'skeletal.glb', systemId: 'musculoskeletal' },
  ekstremitas: { name: 'Femur.r', file: 'skeletal.glb', systemId: 'musculoskeletal' },
}

export function strukturUntukTemuan(key: string): StrukturTemuan | null {
  return STRUKTUR_TEMUAN[key] ?? null
}
