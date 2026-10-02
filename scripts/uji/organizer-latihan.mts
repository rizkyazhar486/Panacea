import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { susunPekan, periksaAturan, kadensLariPekanan, sesiLariAwal, perkiraanMenit, BATAS_ORGANIZER } from '../../src/lib/organizerLatihan.ts'

// ── 1. Setiap kombinasi pilihan harus mematuhi aturan yang diiklankan ───────
// Bukan satu contoh yang kebetulan rapi: SEMUA kombinasi yang bisa dipilih
// orang lewat antarmuka. Aturan yang hanya berlaku pada nilai bawaan bukan
// aturan, melainkan kebetulan.
for (let hari = BATAS_ORGANIZER.HARI_MIN; hari <= BATAS_ORGANIZER.HARI_MAKS; hari++) {
  for (let lari = 0; lari <= BATAS_ORGANIZER.LARI_MAKS; lari++) {
    for (const fokus of ['seimbang', 'kekuatan', 'lari'] as const) {
      const pekan = susunPekan({ hariLatihan: hari, sesiLari: lari, fokus })
      const jejak = `hari=${hari} lari=${lari} fokus=${fokus}`
      assert.equal(pekan.length, 7, `${jejak}: a week must have seven days`)
      assert.deepEqual(periksaAturan(pekan), [], `${jejak}: rules broken`)
      // Push, pull dan kaki harus ADA di setiap konfigurasi — itulah yang
      // diminta ketika halaman ini dibuat.
      for (const j of ['push', 'pull', 'kaki'] as const) {
        assert.ok(pekan.some((h) => h.jenis === j), `${jejak}: ${j} missing entirely`)
      }
      // Perut tidak boleh hilang: entah sebagai hari sendiri, entah menempel.
      const adaPerut = pekan.some((h) => h.jenis === 'perut')
        || pekan.some((h) => h.gerakan.some((g) => g.pola === 'inti' && h.jenis !== 'lari'))
      assert.ok(adaPerut, `${jejak}: trunk work disappeared`)
    }
  }
}

// ── 2. Nilai di luar rentang dijepit, tidak merusak susunan ────────────────
for (const buruk of [-5, 0, 99, Number.NaN, Number.POSITIVE_INFINITY]) {
  const pekan = susunPekan({ hariLatihan: buruk, sesiLari: buruk, fokus: 'seimbang' })
  assert.equal(pekan.length, 7, `hariLatihan=${buruk} broke the week`)
  assert.deepEqual(periksaAturan(pekan), [], `hariLatihan=${buruk} broke the rules`)
}

// ── 3. Kadens lari dibaca dari data, dan gagal tertutup bila tidak ada ──────
assert.equal(kadensLariPekanan([]), null, 'no sessions must not produce a number')
assert.equal(kadensLariPekanan([{ nama: 'Strength', mulai: '2026-09-01T10:00:00Z' }]), null,
  'sessions that are not runs must not be counted as runs')
assert.equal(kadensLariPekanan([{ nama: 'Indoor Run', mulai: 'not a date' }]), null,
  'unparseable dates must not be counted')

// Empat lari dalam rentang 14 hari = dua pekan = 2,0 per pekan. Riwayat yang
// lebih panjang TIDAK boleh menghasilkan angka yang sama dengan riwayat pendek.
const duaPekan = ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-15'].map((d) => ({ nama: 'Run', mulai: `${d}T06:00:00Z` }))
assert.equal(kadensLariPekanan(duaPekan), 2, 'weekly cadence must divide by the observed span')
const seminggu = ['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-08'].map((d) => ({ nama: 'Run', mulai: `${d}T06:00:00Z` }))
assert.ok((kadensLariPekanan(seminggu) ?? 0) > 2, 'a denser week must read denser than a sparse fortnight')

// ── 4. Perkiraan durasi naik bersama set, dan nol untuk hari kosong ─────────
assert.equal(perkiraanMenit([]), 0)
const satu = perkiraanMenit([{ nama: 'x', pola: 'inti', set: 3, ulangan: '5', jeda: 60 }])
const dua = perkiraanMenit([{ nama: 'x', pola: 'inti', set: 6, ulangan: '5', jeda: 60 }])
assert.ok(dua > satu, 'more sets must estimate more time')

// ── 4b. Lari tercatat BENAR-BENAR sampai ke rencananya ─────────────────────
//
// Versi pertama halaman ini mengatakan "dijadwalkan di sekitar lari yang sudah
// Anda lakukan" dan mencetak rata-rata lari per pekan yang tercatat -- lalu
// menyusun pekannya dari angka tetap 2. Cadangan `sesiLariTercatat` di
// susunPekan tidak pernah terpakai karena `pilihan.sesiLari` selalu berupa
// angka. Klaim di layar tidak didukung perilakunya, dan tidak ada satu pun uji
// yang gagal karenanya.
assert.equal(sesiLariAwal(null), 2, 'tanpa riwayat, nilai awalnya templat')
assert.equal(sesiLariAwal(undefined), 2)
assert.equal(sesiLariAwal(Number.NaN), 2, 'angka tidak sah tidak boleh menyamar sebagai data')
assert.equal(sesiLariAwal(4), 4, 'empat lari tercatat harus menjadi empat, bukan dua')
assert.equal(sesiLariAwal(3.4), 3)
assert.equal(sesiLariAwal(3.6), 4)
assert.equal(sesiLariAwal(99), BATAS_ORGANIZER.LARI_MAKS, 'dijepit ke yang bisa dijadwalkan')
assert.equal(sesiLariAwal(-2), 0, 'tidak pernah negatif')

// Dan angka itu harus BENAR-BENAR mengubah pekannya, bukan sekadar dicetak.
{
  const empat = susunPekan({ hariLatihan: 4, sesiLari: sesiLariAwal(4), fokus: 'seimbang' })
  const satu = susunPekan({ hariLatihan: 4, sesiLari: sesiLariAwal(1), fokus: 'seimbang' })
  const hitung = (p: ReturnType<typeof susunPekan>) => p.filter((h) => h.jenis === 'lari').length
  assert.ok(hitung(empat) > hitung(satu), 'kadens tercatat yang berbeda harus menghasilkan pekan yang berbeda')
}

// Halaman harus memakainya, bukan menuliskan 2 sendiri.
{
  const halamanOrg = readFileSync('src/pages/OrganizerLatihan.tsx', 'utf8')
  assert.match(halamanOrg, /sesiLari: sesiLariAwal\(tercatat\)/,
    'the page must seed the run count from the recorded cadence, not a hard-coded number')
  assert.doesNotMatch(halamanOrg, /sesiLari: 2\b/,
    'a hard-coded 2 puts the claim on screen back out of step with the plan')
}

// ── 5. Batas biomedis: tidak ada beban, tidak ada klaim klinis ──────────────
// Halaman ini menjadwalkan latihan; ia tidak boleh berubah menjadi resep.
const halaman = readFileSync('src/pages/OrganizerLatihan.tsx', 'utf8')
const pustaka = readFileSync('src/lib/organizerLatihan.ts', 'utf8')
assert.match(halaman, /not a trained model and not a\s*\n?\s*personalised prescription/,
  'the page must say plainly that it is rules, not a model and not a prescription')
assert.match(halaman, /no load in kilograms is suggested/, 'the no-load boundary must stay visible')
assert.match(halaman, /nothing here is rehabilitation or medical advice/i, 'the clinical boundary must stay visible')
assert.doesNotMatch(pustaka, /\b\d+\s?kg\b/i, 'the catalogue must never carry a load in kilograms')
for (const klaim of [/injury risk/i, /readiness score/i, /guaranteed/i, /diagnos/i]) {
  assert.doesNotMatch(pustaka, klaim, `the library must not make the claim ${klaim}`)
}

// ── 6. Terpasang di suatu tempat yang bisa dibuka ──────────────────────────
// Halaman yang tidak dirujuk siapa pun bernilai nol, betapapun benarnya.
const pusat = readFileSync('src/pages/PusatLatihan.tsx', 'utf8')
assert.match(pusat, /import\('\.\/OrganizerLatihan'\)/, 'the organizer is not loaded by the Training hub')
assert.match(pusat, /id: 'organizer'/, 'the organizer has no tab a user can select')

console.log('Weekly organizer: push/pull/legs/abs scheduled around recorded runs, rules verified across every selectable combination, load and clinical boundaries held')
