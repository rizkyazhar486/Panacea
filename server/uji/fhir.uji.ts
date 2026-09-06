// Uji ekspor FHIR R4.
//
// Yang diuji di sini bukan "apakah keluar JSON". JSON selalu keluar. Yang
// diuji adalah hal-hal yang salahnya tidak pernah terlihat pada berkas hasil:
// kolom kosong yang diam-diam menjadi nol, dan angka turunan yang menyamar
// sebagai hasil laboratorium berkode LOINC. Keduanya baru ketahuan setelah
// sistem penerima memakainya untuk sebuah keputusan.

import {
  bangunBundel, ringkasBundel, keJson, waktuFhir, UKURAN, TURUNAN, SISTEM_LOKAL,
  type Observasi,
} from '../../src/lib/fhir'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const obsDari = (b: ReturnType<typeof bangunBundel>) =>
  b.entry.filter((e) => e.resource.resourceType === 'Observation').map((e) => e.resource as Observasi)

const contoh = {
  nilai: {
    weightKg: 78, heightCm: 172, systolic: 138, diastolic: 88,
    albuminGdL: 4.1, kreatininMgdL: 1.1, trombosit: 190,
    phenoAge: 60.1, egfr: 80.8, fib4: 1.95,
  },
  pasien: { nama: 'Uji', kelamin: 'M' as const, lahir: '1974-03-02' },
  waktu: new Date('2026-09-06T04:00:00Z'),
}

// ── Bentuk bundel ───────────────────────────────────────────────────────────
const b = bangunBundel(contoh)
ok('bundel bertipe collection', b.resourceType === 'Bundle' && b.type === 'collection')
ok('bundel bertanda waktu ISO dengan zona',
  /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(b.timestamp))
ok('entri pertama adalah Patient', b.entry[0].resource.resourceType === 'Patient')
ok('setiap entri punya fullUrl', b.entry.every((e) => e.fullUrl.startsWith('urn:uuid:')))
ok('jumlah observasi sama dengan jumlah nilai yang diisi',
  obsDari(b).length === Object.keys(contoh.nilai).length)

{
  const p = b.entry[0].resource as { gender?: string; birthDate?: string; name?: Array<{ text: string }> }
  ok('jenis kelamin dipetakan ke istilah FHIR', p.gender === 'male')
  ok('tanggal lahir diteruskan', p.birthDate === '1974-03-02')
  ok('nama diteruskan', p.name?.[0].text === 'Uji')
}
{
  // Tanggal lahir berformat salah lebih baik dihilangkan daripada membuat
  // seluruh bundel ditolak oleh pemvalidasi penerima.
  const r = bangunBundel({ nilai: {}, pasien: { lahir: '02/03/1974' } }) as unknown as
    { entry: Array<{ resource: { birthDate?: string } }> }
  ok('tanggal lahir berformat salah dibuang', r.entry[0].resource.birthDate === undefined)
}

// ── Setiap observasi harus lengkap ──────────────────────────────────────────
for (const o of obsDari(b)) {
  ok(`observasi ${o.code.text} berstatus final`, o.status === 'final')
  ok(`observasi ${o.code.text} menunjuk pasien`, o.subject.reference === 'Patient/panaceamed-local')
  ok(`observasi ${o.code.text} punya waktu`, o.effectiveDateTime === waktuFhir(contoh.waktu))
  ok(`observasi ${o.code.text} memakai UCUM`,
    o.valueQuantity.system === 'http://unitsofmeasure.org' && o.valueQuantity.code.length > 0)
  ok(`observasi ${o.code.text} punya kategori`, o.category[0].coding[0].code.length > 0)
}
ok('id observasi tidak berulang', (() => {
  const id = obsDari(b).map((o) => o.id)
  return new Set(id).size === id.length
})())

// ── Aturan inti: turunan tidak boleh menyamar sebagai LOINC ─────────────────
{
  const kunciTurunan = new Set(TURUNAN.map((t) => t.kunci))
  const turunan = obsDari(b).filter((o) => o.code.coding.some((c) => c.system === SISTEM_LOKAL))
  ok('semua angka turunan memakai sistem kode lokal', turunan.length === 3)
  ok('tidak ada angka turunan yang memakai LOINC',
    turunan.every((o) => o.code.coding.every((c) => c.system !== 'http://loinc.org')))
  ok('kode lokal memakai kunci yang dikenali',
    turunan.every((o) => kunciTurunan.has(o.code.coding[0].code)))
  // Penerima harus tahu persamaan mana yang menghasilkan angka itu; tanpa
  // keterangan, "80.8" hanyalah bilangan.
  ok('setiap angka turunan membawa keterangan asal persamaannya',
    turunan.every((o) => (o.note?.[0].text.length ?? 0) > 20))
  ok('PhenoAge menyebut Levine 2018',
    turunan.some((o) => o.note?.[0].text.includes('Levine 2018')))
  ok('umur biologis model poin menyebut bobotnya dipilih penulis',
    bangunBundel({ nilai: { bioAge: 57.8 } }).entry
      .filter((e) => e.resource.resourceType === 'Observation')
      .every((e) => (e.resource as Observasi).note?.[0].text.includes('chosen by the author')))
}
{
  const loinc = obsDari(b).filter((o) => o.code.coding[0].system === 'http://loinc.org')
  ok('pengukuran baku memakai LOINC', loinc.length === 7)
  ok('kode LOINC berbentuk sah (angka-cek)',
    loinc.every((o) => /^\d{1,5}-\d$/.test(o.code.coding[0].code)))
  ok('berat badan memakai 29463-7',
    loinc.some((o) => o.code.coding[0].code === '29463-7' && o.valueQuantity.value === 78))
  ok('sistolik dan diastolik memakai kode berbeda',
    loinc.find((o) => o.code.text.includes('Systolic'))!.code.coding[0].code === '8480-6' &&
    loinc.find((o) => o.code.text.includes('Diastolic'))!.code.coding[0].code === '8462-4')
  // Trombosit dimasukkan sebagai 10^9/L; nilainya tidak boleh diubah, hanya
  // satuannya dinyatakan dalam UCUM yang setara.
  const tr = loinc.find((o) => o.code.text.includes('Platelets'))!
  ok('trombosit tidak diubah nilainya', tr.valueQuantity.value === 190)
  ok('trombosit menerangkan kesetaraan satuannya', tr.note?.[0].text.includes('10⁹/L'))
}

// ── Nilai kosong tidak boleh menjadi nol ────────────────────────────────────
{
  const r = bangunBundel({ nilai: { weightKg: 78, heightCm: undefined, hba1c: NaN, alt: 0 } })
  const o = obsDari(r)
  ok('nilai undefined dilewati', !o.some((x) => x.code.text.includes('height')))
  ok('NaN dilewati', !o.some((x) => x.code.text.includes('A1c')))
  // Nol adalah hasil yang sah dan harus tetap diekspor; yang tidak boleh
  // adalah kolom kosong yang BERUBAH menjadi nol.
  ok('nol yang memang diisi tetap diekspor', o.some((x) => x.code.text.includes('ALT') && x.valueQuantity.value === 0))
  ok('hanya dua observasi yang terbentuk', o.length === 2)
}
{
  const kosong = bangunBundel({ nilai: {} })
  ok('tanpa data, bundel hanya berisi Patient', kosong.entry.length === 1)
}
ok('kunci yang tidak dikenali diabaikan',
  obsDari(bangunBundel({ nilai: { entahApa: 5, weightKg: 70 } })).length === 1)

// ── Ringkasan dan JSON ──────────────────────────────────────────────────────
{
  const r = ringkasBundel(b)
  ok('ringkasan menghitung observasi', r.observasi === 10)
  ok('ringkasan memisahkan berkode baku dan lokal', r.berkode === 7 && r.lokal === 3)
  const j = keJson(b)
  ok('JSON terbentuk dan bisa dibaca kembali', JSON.parse(j).resourceType === 'Bundle')
  ok('JSON tidak memuat kunci internal berbahasa Indonesia',
    !/"(nilai|kunci|satuan|catatan|kategori)"\s*:/.test(j))
}

// ── Kamus itu sendiri ───────────────────────────────────────────────────────
ok('semua ukuran baku punya LOINC', UKURAN.every((u) => !!u.loinc))
ok('tidak ada turunan yang punya LOINC', TURUNAN.every((u) => !u.loinc))
ok('kode LOINC tidak berulang', (() => {
  const c = UKURAN.map((u) => u.loinc!)
  return new Set(c).size === c.length
})())
ok('kunci tidak berulang di seluruh kamus', (() => {
  const k = [...UKURAN, ...TURUNAN].map((u) => u.kunci)
  return new Set(k).size === k.length
})())
ok('setiap ukuran punya kode UCUM', [...UKURAN, ...TURUNAN].every((u) => u.ucum.length > 0))
ok('setiap turunan menerangkan dirinya', TURUNAN.every((u) => (u.catatan?.length ?? 0) > 20))

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
