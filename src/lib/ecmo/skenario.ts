// Skenario krisis ECMO di atas mesin yang SAMA (sirkulasi + oksigen + organ).
//
// Tiap skenario: keadaan awal → pemicu (perubahan parameter) → keadaan terganggu.
// Petunjuk TIDAK ditulis tangan: dihitung dari besaran yang benar-benar bergeser
// antara keadaan awal dan keadaan terganggu. Penyelesaian dinilai dari keadaan saat
// ini terhadap kriteria fisiologis, bukan dari tombol "jawaban benar". Pembelajar
// memakai kendali yang sama (RPM, volume, sweep, kontraktilitas, ganti oksigenator).

import { simulasiSirkulasi, trombosisOksigenator, SKENARIO_SYOK_KARDIOGENIK, BILIK_RUJUKAN_LV, type ParameterSirkulasi, type HasilSirkulasi } from './sirkulasi'
import { simulasiVA, type MasukanVA, type KeadaanVA } from './mesin'

export interface KeadaanSkenario { hemo: ParameterSirkulasi; gas: Partial<Omit<MasukanVA, 'qLv' | 'qEcmo'>>; jamBekuan: number }

export interface HasilGabungan { h: HasilSirkulasi; v: KeadaanVA }

export const GAS_DASAR: Omit<MasukanVA, 'qLv' | 'qEcmo'> = { hb: 12, vo2: 250, shunt: 0.8, fio2: 0.4, va: 3, hco3: 24, fdo2: 1, sweep: 3, fungsiMembran: 1 }

/** Jalankan keadaan skenario lewat mesin yang sama dengan panel. */
export function jalankan(k: KeadaanSkenario): HasilGabungan {
  const b = trombosisOksigenator(k.jamBekuan)
  const h = simulasiSirkulasi({ ...k.hemo, ecmo: { ...k.hemo.ecmo, faktorBekuan: b.faktorBekuan } })
  const v = simulasiVA({ ...GAS_DASAR, ...k.gas, fungsiMembran: b.fungsiMembran, qLv: h.sah ? h.coAsli : 0, qEcmo: h.sah ? Math.max(h.qEcmo, 0.01) : 0.01 })
  return { h, v }
}

export interface Indikator { id: string; nama: string; satuan: string; ambang: number; baca: (g: HasilGabungan) => number }
export const INDIKATOR: Indikator[] = [
  { id: 'q', nama: 'ECMO flow', satuan: 'L/min', ambang: 0.3, baca: (g) => g.h.qEcmo },
  { id: 'map', nama: 'MAP', satuan: 'mmHg', ambang: 5, baca: (g) => g.h.map },
  { id: 'pdrain', nama: 'Drainage pressure', satuan: 'mmHg', ambang: 15, baca: (g) => g.h.sirkuit?.pDrainase ?? NaN },
  { id: 'dp', nama: 'Oxygenator ΔP', satuan: 'mmHg', ambang: 10, baca: (g) => g.h.sirkuit?.deltaP ?? NaN },
  { id: 'cvp', nama: 'CVP', satuan: 'mmHg', ambang: 1, baca: (g) => g.h.cvp },
  { id: 'pcwp', nama: 'PCWP', satuan: 'mmHg', ambang: 2, baca: (g) => g.h.pcwp },
  { id: 'pp', nama: 'Pulse pressure', satuan: 'mmHg', ambang: 3, baca: (g) => g.h.pulsePressure },
  { id: 'katup', nama: 'Aortic valve open (fraction of beat)', satuan: '', ambang: 0.03, baca: (g) => g.h.fraksiBukaKatupAorta },
  { id: 'spost', nama: 'Post-oxygenator SO₂', satuan: '', ambang: 0.03, baca: (g) => g.v.sPost },
  { id: 'paco2', nama: 'PaCO₂', satuan: 'mmHg', ambang: 3, baca: (g) => g.v.co2.paco2 },
  { id: 'radial', nama: 'Right radial SO₂', satuan: '', ambang: 0.03, baca: (g) => g.v.cabang.find((c) => c.id === 'brakiosefal')?.saturasi ?? NaN },
]

export interface Petunjuk { id: string; nama: string; dari: number; ke: number; satuan: string }
/** Petunjuk = indikator yang bergeser melampaui ambangnya (dihitung, bukan ditulis). */
export function petunjuk(a: HasilGabungan, b: HasilGabungan): Petunjuk[] {
  // Hilangnya keadaan tunak O2 adalah petunjuk tersendiri, bukan alasan menyembunyikan petunjuk.
  const o2: Petunjuk[] = a.v.status === 'tunak' && b.v.status === 'pasokan-o2-tak-cukup'
    ? [{ id: 'o2', nama: 'O₂ supply can no longer meet VO₂ (no steady state: O₂ debt accumulating)', dari: 1, ke: 0, satuan: '' }] : []
  return [...o2, ...INDIKATOR.flatMap((i) => {
    const x = i.baca(a), y = i.baca(b)
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(y - x) < i.ambang) return []
    return [{ id: i.id, nama: i.nama, dari: x, ke: y, satuan: i.satuan }]
  })]
}

export interface Skenario {
  id: string
  judul: string
  pemicu: string                  // apa yang berubah di tubuh/sirkuit (teks singkat)
  terapkan: (k: KeadaanSkenario) => KeadaanSkenario
  kendaliRelevan: string[]        // kendali panel yang dapat memperbaiki keadaan
  selesai: (dasar: HasilGabungan, kini: HasilGabungan, k: KeadaanSkenario) => boolean
  batas: string                   // yang tidak disimulasikan dalam skenario ini
}

export const DASAR: KeadaanSkenario = { hemo: { ...SKENARIO_SYOK_KARDIOGENIK, ecmo: { konfigurasi: 'VA-perifer', rpm: 4000 } }, gas: { sweep: 3, fdo2: 1 }, jamBekuan: 0 }

export const SKENARIO: Skenario[] = [
  {
    id: 'drainase', judul: 'Drainage insufficiency (hypovolaemia)',
    pemicu: 'Occult blood loss of 550 mL',
    terapkan: (k) => ({ ...k, hemo: { ...k.hemo, volumeDarah: k.hemo.volumeDarah - 550 } }),
    kendaliRelevan: ['volume', 'rpm'],
    selesai: (d, n) => n.h.qEcmo >= 0.9 * d.h.qEcmo && (n.h.sirkuit?.pDrainase ?? -999) >= (d.h.sirkuit?.pDrainase ?? 0) - 20,
    batas: 'Cannula chatter (oscillation) is not simulated; flow here is the beat-averaged value.',
  },
  {
    id: 'sweep', judul: 'Sweep gas failure',
    pemicu: 'Gas line disconnected: sweep falls to 0',
    terapkan: (k) => ({ ...k, gas: { ...k.gas, sweep: 0 } }),
    kendaliRelevan: ['sweep'],
    selesai: (_d, n) => n.v.status === 'tunak' && n.v.sPost > 0.95 && n.v.co2.paco2 < 50,
    batas: 'Gas-side pressures and oxygen-cylinder states are not simulated.',
  },
  {
    id: 'pompa', judul: 'Pump stop',
    pemicu: 'Pump speed falls to 0',
    terapkan: (k) => ({ ...k, hemo: { ...k.hemo, ecmo: { ...k.hemo.ecmo, rpm: 0 } } }),
    kendaliRelevan: ['rpm'],
    selesai: (d, n) => n.h.qEcmo >= 0.9 * d.h.qEcmo,
    batas: 'Retrograde flow through a stopped centrifugal pump is not simulated (shown as zero).',
  },
  {
    id: 'trombosis', judul: 'Progressive oxygenator thrombosis',
    pemicu: '48 h of clot formation in the membrane lung',
    terapkan: (k) => ({ ...k, jamBekuan: 48 }),
    kendaliRelevan: ['bekuan'],
    selesai: (_d, _n, k) => k.jamBekuan === 0,
    batas: 'Clot growth rate is illustrative; exchanging the oxygenator is represented as resetting clot time to 0.',
  },
  {
    id: 'distensi-lv', judul: 'LV distension on VA support',
    pemicu: 'Contractility falls further (15% of normal) while support is raised to 5500 rpm',
    terapkan: (k) => ({ ...k, hemo: { ...k.hemo, lv: { ...k.hemo.lv, ees: BILIK_RUJUKAN_LV.ees * 0.15 }, ecmo: { ...k.hemo.ecmo, rpm: 5500 } } }),
    kendaliRelevan: ['rpm', 'ees'],
    selesai: (_d, n) => n.h.fraksiBukaKatupAorta > 0.05 && n.h.pulsePressure > 5,
    batas: 'Unloading devices (IABP, Impella, venting, septostomy) are not simulated; only flow reduction and contractility are available.',
  },
]
