// Uji mesin umur biologis dan beban fisiologis.
//
// Kalkulator seperti ini adalah tempat paling nyaman bagi angka palsu: hasilnya
// selalu berupa bilangan yang masuk akal, tidak pernah melempar galat, dan
// tidak ada yang bisa membantahnya dengan mata. Yang diuji di sini bukan
// "apakah keluar angka", melainkan apakah angkanya cocok dengan makalah
// aslinya, apakah arah perubahannya benar, dan apakah masukan bersatuan salah
// benar-benar ditolak alih-alih diam-diam diproses.

import {
  konversi, phenoAge, egfrCkdEpi2021, fib4, hrMaksTanaka, vo2maxUth,
  sindromMetabolikIdf, type MasukanPhenoAge,
} from '../../src/lib/longevity'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const dekat = (a: number, b: number, toleransi = 0.05) => Math.abs(a - b) <= toleransi

// ── Pengubah satuan ─────────────────────────────────────────────────────────
ok('albumin 4,2 g/dL menjadi 42 g/L', dekat(konversi.albuminGdLKeGL(4.2), 42))
ok('kreatinin 1,0 mg/dL menjadi 88,4 µmol/L', dekat(konversi.kreatininMgdLKeUmolL(1), 88.4))
ok('glukosa 90 mg/dL menjadi ~5,0 mmol/L', dekat(konversi.glukosaMgdLKeMmolL(90), 4.995, 0.01))
ok('CRP 3 mg/L menjadi 0,3 mg/dL', dekat(konversi.crpMgLKeMgdL(3), 0.3))

// ── PhenoAge ────────────────────────────────────────────────────────────────
// Profil rujukan: laki-laki 50 tahun dengan seluruh penanda di tengah rentang
// normal. PhenoAge orang seperti ini seharusnya berada di sekitar usianya.
const sehat: MasukanPhenoAge = {
  usia: 50,
  albuminGL: konversi.albuminGdLKeGL(4.4),
  kreatininUmolL: konversi.kreatininMgdLKeUmolL(0.9),
  glukosaMmolL: konversi.glukosaMgdLKeMmolL(85),
  crpMgdL: 0.05,
  limfositPersen: 32,
  mcvFL: 90,
  rdwPersen: 12.8,
  alpUL: 65,
  wbcRibu: 5.5,
}

const dasar = phenoAge(sehat)
ok('profil normal menghasilkan PhenoAge', dasar.ok)
if (dasar.ok) {
  ok('PhenoAge profil sehat dekat usia sebenarnya',
    Math.abs(dasar.data.percepatan) < 12, String(dasar.data.phenoAge))
  ok('percepatan = PhenoAge − usia',
    dekat(dasar.data.percepatan, dasar.data.phenoAge - sehat.usia, 0.11))
  ok('mortalitas 10 tahun berupa persen yang masuk akal',
    dasar.data.mortalitas10Tahun > 0 && dasar.data.mortalitas10Tahun < 100)
  ok('sepuluh penanda dirinci sumbangannya', dasar.data.kontribusi.length === 10)
  ok('kontribusi diurutkan dari besaran terbesar',
    dasar.data.kontribusi.every((k, i, a) =>
      i === 0 || Math.abs(a[i - 1].sumbangan) >= Math.abs(k.sumbangan)))
  ok('tiap penanda membawa satuannya',
    dasar.data.kontribusi.every((k) => k.satuan.length > 0))
  ok('albumin dirinci dalam g/L, bukan g/dL yang diketik pengguna',
    dasar.data.kontribusi.some((k) => k.penanda === 'Albumin' && k.satuan === 'g/L' && k.nilai === 44))
  ok('usia kronologis termasuk penanda yang dirinci',
    dasar.data.kontribusi.some((k) => k.penanda === 'Chronological age'))
}

// Arah tiap koefisien harus sesuai makalah: penanda peradangan dan kerusakan
// menaikkan PhenoAge, albumin dan limfosit menurunkannya.
function naikkan(ubah: Partial<MasukanPhenoAge>): number {
  const h = phenoAge({ ...sehat, ...ubah })
  if (!h.ok) throw new Error(h.alasan)
  return h.data.phenoAge
}
const acuan = dasar.ok ? dasar.data.phenoAge : NaN
ok('CRP tinggi menaikkan PhenoAge', naikkan({ crpMgdL: 1.2 }) > acuan)
ok('glukosa tinggi menaikkan PhenoAge', naikkan({ glukosaMmolL: konversi.glukosaMgdLKeMmolL(180) }) > acuan)
ok('RDW tinggi menaikkan PhenoAge', naikkan({ rdwPersen: 16.5 }) > acuan)
ok('leukosit tinggi menaikkan PhenoAge', naikkan({ wbcRibu: 12 }) > acuan)
ok('kreatinin tinggi menaikkan PhenoAge', naikkan({ kreatininUmolL: konversi.kreatininMgdLKeUmolL(2.4) }) > acuan)
ok('ALP tinggi menaikkan PhenoAge', naikkan({ alpUL: 300 }) > acuan)
ok('MCV tinggi menaikkan PhenoAge', naikkan({ mcvFL: 105 }) > acuan)
ok('albumin rendah menaikkan PhenoAge', naikkan({ albuminGL: 30 }) > acuan)
ok('limfosit rendah menaikkan PhenoAge', naikkan({ limfositPersen: 12 }) > acuan)
ok('albumin tinggi menurunkan PhenoAge', naikkan({ albuminGL: 50 }) < acuan)

// RDW adalah koefisien terbesar di antara penanda darah; kenaikan RDW sebesar
// satu satuan harus berpengaruh lebih besar daripada satu satuan MCV.
{
  const rdw = naikkan({ rdwPersen: sehat.rdwPersen + 1 }) - acuan
  const mcv = naikkan({ mcvFL: sehat.mcvFL + 1 }) - acuan
  ok('satu satuan RDW lebih berat daripada satu satuan MCV', rdw > mcv)
}

// Satuan salah adalah galat paling sering, dan yang paling berbahaya karena
// hasilnya tetap terlihat wajar. Albumin 4,4 (g/dL) harus ditolak, bukan
// dihitung sebagai 4,4 g/L.
{
  const salah = phenoAge({ ...sehat, albuminGL: 4.4 })
  ok('albumin dalam g/dL ditolak', !salah.ok)
  ok('penolakan menyebut satuan yang benar',
    !salah.ok && salah.alasan.includes('g/L'))
}
ok('kreatinin dalam mg/dL ditolak', !phenoAge({ ...sehat, kreatininUmolL: 0.9 }).ok)
ok('glukosa dalam mg/dL ditolak', !phenoAge({ ...sehat, glukosaMmolL: 85 }).ok)
ok('usia anak ditolak — model dilatih pada dewasa', !phenoAge({ ...sehat, usia: 9 }).ok)
ok('CRP nol ditolak — logaritmanya tak hingga', !phenoAge({ ...sehat, crpMgdL: 0 }).ok)
ok('NaN ditolak', !phenoAge({ ...sehat, mcvFL: NaN }).ok)
ok('nilai kurang dari satu penanda dilaporkan sekaligus', (() => {
  const h = phenoAge({ ...sehat, albuminGL: 4.4, rdwPersen: 99 })
  return !h.ok && h.alasan.includes(';')
})())

// ── eGFR CKD-EPI 2021 ───────────────────────────────────────────────────────
{
  // Nilai rujukan dihitung ulang dari persamaan yang diterbitkan.
  const lk = egfrCkdEpi2021(0.9, 40, false)
  ok('laki-laki 40 th kreatinin 0,9 mendekati 111', lk.ok && dekat(lk.data.nilai, 110.7, 0.2))
  const pr = egfrCkdEpi2021(0.7, 40, true)
  ok('perempuan 40 th kreatinin 0,7 mendekati 112', pr.ok && dekat(pr.data.nilai, 112.1, 0.2))

  // Pada kreatinin yang sama, perempuan memakai κ yang lebih rendah sehingga
  // eGFR-nya lebih rendah — inilah faktor jenis kelamin, bukan faktor ras.
  const a = egfrCkdEpi2021(1.0, 50, false), b = egfrCkdEpi2021(1.0, 50, true)
  ok('jenis kelamin mengubah hasil pada kreatinin sama',
    a.ok && b.ok && a.data.nilai > b.data.nilai)

  ok('kreatinin naik menurunkan eGFR', (() => {
    const x = egfrCkdEpi2021(2.5, 50, false), y = egfrCkdEpi2021(1.0, 50, false)
    return x.ok && y.ok && x.data.nilai < y.data.nilai
  })())
  ok('usia naik menurunkan eGFR', (() => {
    const x = egfrCkdEpi2021(1.0, 80, false), y = egfrCkdEpi2021(1.0, 30, false)
    return x.ok && y.ok && x.data.nilai < y.data.nilai
  })())

  // Titik patah κ: fungsinya kontinu di kreatinin = κ, jadi nilai tepat di
  // bawah dan tepat di atasnya tidak boleh melompat.
  const bawah = egfrCkdEpi2021(0.8999, 50, false), atas = egfrCkdEpi2021(0.9001, 50, false)
  ok('tidak ada lompatan di titik patah κ',
    bawah.ok && atas.ok && Math.abs(bawah.data.nilai - atas.data.nilai) < 0.2)

  const berat = egfrCkdEpi2021(5, 60, false)
  ok('kreatinin 5 mg/dL masuk stadium G4 atau G5',
    berat.ok && /G4|G5/.test(berat.data.catatan[0]))
  ok('catatan mengingatkan albuminuria',
    lk.ok && lk.data.catatan.some((c) => c.toLowerCase().includes('albuminuria')))
  ok('kreatinin di luar akal ditolak', !egfrCkdEpi2021(0, 50, false).ok)
}

// ── FIB-4 ───────────────────────────────────────────────────────────────────
{
  // FIB-4 = usia × AST / (trombosit × √ALT). 50×40/(250×√30) = 1,46.
  const h = fib4(50, 40, 30, 250)
  ok('FIB-4 cocok dengan perhitungan tangan', h.ok && dekat(h.data.nilai, 1.46, 0.01))
  ok('rentang tengah disebut indeterminate',
    h.ok && h.data.catatan[0].toLowerCase().includes('indeterminate'))

  const rendah = fib4(30, 20, 25, 300)
  ok('nilai rendah menyebut fibrosis lanjut tidak mungkin',
    rendah.ok && rendah.data.nilai < 1.3 && rendah.data.catatan[0].includes('unlikely'))

  const tinggi = fib4(70, 120, 40, 90)
  ok('nilai tinggi menyarankan rujukan',
    tinggi.ok && tinggi.data.nilai > 2.67 && tinggi.data.catatan[0].includes('refer'))
  ok('catatan menyebut ambang berbeda pada usia lanjut',
    tinggi.ok && tinggi.data.catatan.some((c) => c.includes('65')))

  ok('trombosit rendah menaikkan FIB-4', (() => {
    const x = fib4(50, 40, 30, 90), y = fib4(50, 40, 30, 250)
    return x.ok && y.ok && x.data.nilai > y.data.nilai
  })())
  ok('trombosit nol ditolak, bukan dibagi nol', !fib4(50, 40, 30, 0).ok)
}

// ── HR maksimal dan VO2max ──────────────────────────────────────────────────
{
  const a = hrMaksTanaka(20), b = hrMaksTanaka(70)
  ok('Tanaka pada usia 20 = 194', a.ok && a.data.nilai === 194)
  ok('Tanaka pada usia 70 = 159', b.ok && b.data.nilai === 159)
  // Justru inilah alasan memakai Tanaka: "220 − usia" memberi 150 pada usia 70,
  // sembilan denyut lebih rendah, sehingga zona latihan lansia ditetapkan
  // terlalu ringan.
  ok('Tanaka lebih tinggi daripada 220 − usia pada lansia', b.ok && b.data.nilai > 220 - 70)
  ok('Tanaka lebih rendah daripada 220 − usia pada usia muda', a.ok && a.data.nilai < 220 - 20)
  ok('usia di luar rentang ditolak', !hrMaksTanaka(4).ok)

  const bugar = vo2maxUth(48, 40), tidak = vo2maxUth(82, 40)
  ok('nadi istirahat rendah memberi VO2max lebih tinggi',
    bugar.ok && tidak.ok && bugar.data.nilai > tidak.data.nilai)
  // 15,3 × (208 − 0,7×40) / 48 = 15,3 × 180/48 = 57,4.
  ok('VO2max cocok dengan perhitungan tangan', bugar.ok && dekat(bugar.data.nilai, 57.4, 0.1))
  ok('satuan VO2max benar', bugar.ok && bugar.data.satuan === 'mL/kg/min')
  ok('catatan menyebut penyekat beta',
    bugar.ok && bugar.data.catatan.some((c) => c.toLowerCase().includes('beta blocker')))
  ok('nadi istirahat tak masuk akal ditolak', !vo2maxUth(10, 40).ok)
  ok('usia tak masuk akal ikut menolak VO2max', !vo2maxUth(60, 5).ok)
}

// ── Sindrom metabolik IDF ───────────────────────────────────────────────────
{
  const dasarMet = {
    perempuan: false, trigliseridaMgdL: 100, hdlMgdL: 55,
    sistolik: 118, diastolik: 74, glukosaPuasaMgdL: 88,
  }
  const bersih = sindromMetabolikIdf({ ...dasarMet, lingkarPinggangCm: 84 })
  ok('profil bersih tidak memenuhi kriteria', bersih.ok && !bersih.data.memenuhi)
  ok('profil bersih tidak obesitas sentral', bersih.ok && !bersih.data.obesitasSentral)
  ok('empat kriteria selalu dilaporkan', bersih.ok &&
    bersih.data.kriteriaTerpenuhi.length + bersih.data.kriteriaTidak.length === 4)

  // Ambang Asia: 90 cm laki-laki, 80 cm perempuan. Memakai ambang Eropa (94)
  // akan melewatkan laki-laki berlingkar pinggang 92 cm.
  const lk92 = sindromMetabolikIdf({ ...dasarMet, lingkarPinggangCm: 92 })
  ok('laki-laki 92 cm sudah obesitas sentral menurut ambang Asia',
    lk92.ok && lk92.data.obesitasSentral)
  const pr82 = sindromMetabolikIdf({ ...dasarMet, perempuan: true, lingkarPinggangCm: 82 })
  ok('perempuan 82 cm sudah obesitas sentral', pr82.ok && pr82.data.obesitasSentral)
  const pr78 = sindromMetabolikIdf({ ...dasarMet, perempuan: true, lingkarPinggangCm: 78 })
  ok('perempuan 78 cm belum obesitas sentral', pr78.ok && !pr78.data.obesitasSentral)

  // Obesitas sentral adalah syarat wajib IDF: tiga kriteria lain tanpa lingkar
  // pinggang tetap TIDAK memenuhi.
  const tanpaPinggang = sindromMetabolikIdf({
    ...dasarMet, lingkarPinggangCm: 80, trigliseridaMgdL: 220,
    hdlMgdL: 32, sistolik: 145, diastolik: 92, glukosaPuasaMgdL: 118,
  })
  ok('tiga kriteria tanpa obesitas sentral tidak memenuhi IDF',
    tanpaPinggang.ok && !tanpaPinggang.data.memenuhi)
  ok('kriteria lain tetap dihitung dan ditampilkan',
    tanpaPinggang.ok && tanpaPinggang.data.kriteriaTerpenuhi.length === 4)

  const penuh = sindromMetabolikIdf({
    ...dasarMet, lingkarPinggangCm: 98, trigliseridaMgdL: 220, hdlMgdL: 32,
  })
  ok('obesitas sentral ditambah dua kriteria memenuhi', penuh.ok && penuh.data.memenuhi)

  const satu = sindromMetabolikIdf({ ...dasarMet, lingkarPinggangCm: 98, trigliseridaMgdL: 220 })
  ok('obesitas sentral ditambah satu kriteria belum memenuhi', satu.ok && !satu.data.memenuhi)

  // HDL memakai ambang berbeda menurut jenis kelamin: 45 mg/dL normal pada
  // laki-laki tetapi rendah pada perempuan.
  const hdlLk = sindromMetabolikIdf({ ...dasarMet, lingkarPinggangCm: 98, hdlMgdL: 45 })
  const hdlPr = sindromMetabolikIdf({ ...dasarMet, perempuan: true, lingkarPinggangCm: 98, hdlMgdL: 45 })
  ok('HDL 45 tidak dihitung rendah pada laki-laki',
    hdlLk.ok && !hdlLk.data.kriteriaTerpenuhi.some((c) => c.startsWith('HDL')))
  ok('HDL 45 dihitung rendah pada perempuan',
    hdlPr.ok && hdlPr.data.kriteriaTerpenuhi.some((c) => c.startsWith('HDL')))

  // Pengobatan menggantikan ambang: pasien dengan tekanan darah terkendali
  // karena obat tetap memenuhi kriteria tekanan darah.
  const diobati = sindromMetabolikIdf({
    ...dasarMet, lingkarPinggangCm: 98, diobatiHipertensi: true, diobatiGula: true,
  })
  ok('hipertensi terobati tetap dihitung sebagai kriteria',
    diobati.ok && diobati.data.memenuhi)

  ok('lingkar pinggang tak masuk akal ditolak',
    !sindromMetabolikIdf({ ...dasarMet, lingkarPinggangCm: 5 }).ok)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
