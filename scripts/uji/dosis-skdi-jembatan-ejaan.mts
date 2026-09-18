import assert from 'node:assert/strict'
import { semuaObat, dosisSkdi } from '../../src/lib/obatKatalog.ts'

// ─────────────────────────────────────────────────────────────────────────────
// DOSIS SUDAH ADA DI BERKAS, TAPI TIDAK PERNAH SAMPAI KE LAYAR.
//
// golonganObat.ts sudah menulis dosis nyata untuk zat-zat ini, berdampingan
// dengan zat lain dalam golongan yang sama — bukan data yang hilang, hanya
// data yang tidak tersambung. dosisSkdi() mencocokkan ejaan Indonesia sebuah
// zat lewat EJAAN_ID; tanpa entri di sana, pencarian gagal DIAM-DIAM dan
// DrugInfo menampilkan "No dose is given here on purpose" untuk obat yang
// dosisnya sebenarnya sudah tertulis di aplikasi ini sendiri.
//
// Diperiksa satu per satu terhadap `contoh` di golonganObat.ts sebelum
// entrinya ditambahkan — bukan ditebak dengan aturan alih-ejaan, sama seperti
// larangan yang sudah tertulis di kepala EJAAN_ID.
// ─────────────────────────────────────────────────────────────────────────────

const SEHARUSNYA_PUNYA_DOSIS = [
  'Esomeprazole', 'Lansoprazole', 'Pantoprazole', 'Rabeprazole',
  'Ranitidine', 'Famotidine', 'Mebeverine', 'Drotaverine', 'Domperidone',
  'Glimepiride', 'Semaglutide', 'Dulaglutide', 'Magnesium sulfate',
  'Clopidogrel', 'Ticagrelor', 'Milrinone', 'Indapamide', 'Eplerenone',
  'Carvedilol', 'Nifedipine (modified release)', 'Nifedipine (tocolysis)',
  'Candesartan', 'Terbinafine (topical)', 'Terbinafine (oral)', 'Diclofenac',
  'Ketorolac', 'Baclofen', 'Tizanidine', 'Phenobarbital', 'Topiramate',
  'Clonazepam', 'Mebendazole', 'Terbutaline', 'Mometasone (nasal)', 'Loratadine',
  // Second pass — wider spelling-shift search, still hand-verified one by one.
  'Sucralfate', 'Promethazine', 'Docusate', 'Gliclazide', 'Thiamine (B1)',
  'Clotrimazole (topical)', 'Miconazole (topical)', 'Itraconazole', 'Naproxen',
  'Codeine', 'Carbamazepine', 'Duloxetine', 'Amitriptyline', 'Ambroxol', 'Fexofenadine',
]

// ── 1b. These must STAY unmatched — matching by molecule name alone would be
// wrong, not merely incomplete. Guards against a future pass "completing"
// EJAAN_ID by transliteration rule instead of checking route/indication.
const HARUS_TETAP_KOSONG: [string, string][] = [
  ['Clotrimazole (vaginal)', 'the only golongan mentioning klotrimazol covers topical/oral skin dosing, not the vaginal route'],
  ['Betamethasone (antenatal)', 'the only golongan mentioning betametason is a topical skin cream, not the antenatal IM injection'],
  ['Beclometasone', 'the only golongan mentioning it is a nasal spray for rhinitis; this substance is catalogued as an asthma inhaler'],
]
for (const [nama, alasan] of HARUS_TETAP_KOSONG) {
  assert.equal(dosisSkdi(nama).length, 0,
    `${nama} now resolves to a dose, but it should not: ${alasan}. If a real matching golongan was added for this ` +
    'exact route/indication, update this test — otherwise this is a route/indication mismatch, not a fix.')
}

// ── 1. Tiap zat di daftar ini harus benar-benar cocok dengan dosis dari SKDI ─
for (const nama of SEHARUSNYA_PUNYA_DOSIS) {
  const hasil = dosisSkdi(nama)
  assert.ok(hasil.length > 0,
    `${nama}: the EJAAN_ID spelling bridge for this substance disappeared. Its dose was already written into ` +
    `golonganObat.ts and is now unreachable again — DrugInfo will show "No dose is given here on purpose" for a ` +
    'substance whose dose this app already has.')
}

// ── 2. Golongan campuran (Nifedipine, Terbinafine, Mometasone) masih terpisah ─
// Ketiganya punya dua entri katalog dengan nama dasar yang sama (mis. "Nifedipine
// (modified release)" dan "Nifedipine (tocolysis)"); satu entri EJAAN_ID via
// nama dasar harus menjangkau keduanya sekaligus.
for (const [a, b] of [
  ['Nifedipine (modified release)', 'Nifedipine (tocolysis)'],
  ['Terbinafine (topical)', 'Terbinafine (oral)'],
] as const) {
  assert.equal(dosisSkdi(a)[0]?.dosis, dosisSkdi(b)[0]?.dosis,
    `${a} and ${b} should resolve to the same group dose text via their shared base name`)
}

// ── 3. Cakupan keseluruhan tidak boleh mundur dari titik ini ─────────────────
// Bukan angka tetap: siapa pun boleh menambah cakupan lebih jauh. Yang tidak
// boleh adalah MUNDUR dari sini tanpa ketahuan.
const totalPunyaDosis = semuaObat().filter((o) => dosisSkdi(o.nama).length > 0).length
assert.ok(totalPunyaDosis >= 142,
  `only ${totalPunyaDosis} of ${semuaObat().length} catalogue substances resolve to an SKDI dose (expected at ` +
  'least 142). Coverage regressed — some EJAAN_ID entry was likely removed or renamed.')

console.log(`dosis-skdi-jembatan-ejaan: ok (${totalPunyaDosis}/${semuaObat().length} substansi tersambung ke dosis SKDI)`)
