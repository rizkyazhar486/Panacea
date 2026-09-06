// Uji rantai molekul → target → organ → penyakit → katalog obat.
//
// Empat tautan, empat cara gagal diam-diam: berkas molekul yang hilang membuat
// penampil kosong, nama obat yang tidak cocok memutus catatan klinisnya, id
// penyakit yang salah membuat tombol tidak menuju ke mana pun, dan sasaran
// organ yang keliru menyorot bagian tubuh yang salah. Tidak satu pun terlihat
// di layar sebagai kesalahan.

import { readFileSync, existsSync } from 'node:fs'
import { DRUG_TARGETS, drugsForCondition, drugsForOrgan } from '../../src/lib/drugTargets'
import { MOLECULES, MOLECULE_BY_ID } from '../../src/lib/molecules.gen'
import { semuaObat } from '../../src/lib/obatKatalog'
import { ORGAN_FOCUS } from '../../src/lib/organFocus'
import { CARDIO_CONDITIONS } from '../../src/lib/cardioPathology'
import { SYSTEM_CONDITIONS } from '../../src/lib/specialtyPathology'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

// ── Geometri molekul ────────────────────────────────────────────────────────
ok('ada sedikitnya 30 molekul', MOLECULES.length >= 30, String(MOLECULES.length))
for (const m of MOLECULES) {
  const p = new URL(`../../public/molecules/${m.id}.json`, import.meta.url).pathname
  if (!existsSync(p)) { ok(`berkas ${m.id}.json ada`, false); continue }
  const d = JSON.parse(readFileSync(p, 'utf8')) as {
    atoms: [string, number, number, number][]; bonds: [number, number, number][]; formula: string
  }
  const benar =
    d.atoms.length === m.atoms &&
    d.formula === m.formula &&
    d.bonds.every(([a, b]) => a >= 0 && b >= 0 && a < d.atoms.length && b < d.atoms.length) &&
    d.atoms.every((a) => a.slice(1).every((v) => Number.isFinite(v as number)))
  ok(`${m.id}: berkas cocok dengan metadatanya dan koordinatnya sahih`, benar)
}
{
  // Konformer nyata, bukan atom yang ditumpuk di satu titik: jarak ikatan
  // kovalen harus berada di kisaran fisik, sekitar 0,9–2,0 Å.
  const p = new URL('../../public/molecules/aspirin.json', import.meta.url).pathname
  const d = JSON.parse(readFileSync(p, 'utf8')) as { atoms: [string, number, number, number][]; bonds: [number, number, number][] }
  const jarak = d.bonds.map(([a, b]) => Math.hypot(
    d.atoms[a][1] - d.atoms[b][1], d.atoms[a][2] - d.atoms[b][2], d.atoms[a][3] - d.atoms[b][3]))
  ok('panjang ikatan aspirin berada di kisaran fisik',
    jarak.every((j) => j > 0.9 && j < 2.0),
    `${Math.min(...jarak).toFixed(2)}–${Math.max(...jarak).toFixed(2)} Å`)
  // Cincin benzena aspirin: enam karbon aromatik yang datar.
  ok('aspirin punya satu cincin', MOLECULE_BY_ID['aspirin'].rings === 1)
}

// ── Tautan ──────────────────────────────────────────────────────────────────
const molekulHilang = DRUG_TARGETS.filter((d) => !MOLECULE_BY_ID[d.id]).map((d) => d.id)
ok('setiap obat punya molekulnya', molekulHilang.length === 0, molekulHilang.join(', '))

const namaKatalog = new Set(semuaObat().map((o) => o.nama))
const katalogHilang = DRUG_TARGETS.filter((d) => !namaKatalog.has(d.katalog)).map((d) => `${d.id}: ${d.katalog}`)
ok('setiap obat tertaut ke entri katalog yang ada', katalogHilang.length === 0, katalogHilang.join(' | '))

const kunciOrgan = new Set(ORGAN_FOCUS.map((o: { key: string }) => o.key))
const organHilang = DRUG_TARGETS.flatMap((d) =>
  [...d.sites, ...d.efekSamping].filter((s) => !kunciOrgan.has(s)).map((s) => `${d.id}: ${s}`))
ok('setiap sasaran organ ada di katalog organ', organHilang.length === 0, organHilang.join(' | '))

const idKeadaan = new Set([...CARDIO_CONDITIONS.map((k) => k.id), ...SYSTEM_CONDITIONS.map((k) => k.id)])
const keadaanHilang = DRUG_TARGETS.flatMap((d) =>
  d.mengobati.filter((k) => !idKeadaan.has(k)).map((k) => `${d.id}: ${k}`))
ok('setiap penyakit yang diobati ada di atlas patologi', keadaanHilang.length === 0, keadaanHilang.join(' | '))

// ── Bentuk data ─────────────────────────────────────────────────────────────
ok('id obat tidak kembar', new Set(DRUG_TARGETS.map((d) => d.id)).size === DRUG_TARGETS.length)
ok('setiap obat menyebut target, aksi, dan peringatan',
  DRUG_TARGETS.every((d) => d.target.length > 3 && d.aksi.length > 120 && d.peringatan.length > 20))
ok('setiap obat bekerja pada sedikitnya satu organ dan satu penyakit',
  DRUG_TARGETS.every((d) => d.sites.length >= 1 && d.mengobati.length >= 1))

// ── Arah pencarian ──────────────────────────────────────────────────────────
ok('infark anterior memunculkan aspirin dan statin',
  drugsForCondition('stemi-anterior').some((d) => d.id === 'aspirin') &&
  drugsForCondition('stemi-anterior').some((d) => d.id === 'atorvastatin'))
ok('ginjal memunculkan lebih dari satu obat', drugsForOrgan('kidneys').length >= 4,
  String(drugsForOrgan('kidneys').length))
ok('asma memunculkan salbutamol', drugsForCondition('asthma').some((d) => d.id === 'salbutamol'))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
