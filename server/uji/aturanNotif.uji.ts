// Uji mesin aturan tanpa server: store dan push diganti dengan tiruan lewat
// jalur impor yang sama, jadi yang diuji benar-benar berkas aturannya.
import { ATURAN, PREF_KATEGORI } from '../src/aturanNotif.js'

const hari = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
const riwayat = Array.from({ length: 20 }, (_, i) => ({
  date: hari(19 - i),
  hrvMs: 60 + (i % 5),
  restingHr: 57 + (i % 3),
  respRate: 14 + (i % 2) * 0.3,
  bodyTempC: 36.5,
  sleepH: 7.0 + (i % 3) * 0.2,
  steps: 9000 + (i % 4) * 300,
  exerciseMin: i % 3 === 0 ? 45 : 0,
  weightKg: 68,
  spo2Pct: 96,
}))

function konteks(patch: Record<string, unknown>, menit: number, ringkas: Record<string, unknown> = {}) {
  const r = riwayat.map((b) => ({ ...b }))
  const hariIni = { ...r[r.length - 1], ...patch }
  r[r.length - 1] = hariIni
  return {
    userId: 'u', email: 'u@x.id', prefs: {}, riwayat: r, hariIni,
    menitLokal: menit, tanggalLokal: hari(0), ringkas,
  }
}

let lulus = 0, gagal = 0
function periksa(nama: string, benar: boolean, tambahan = '') {
  if (benar) { lulus++; console.log('  ok   ', nama) }
  else { gagal++; console.log('  GAGAL', nama, tambahan) }
}

const cari = (id: string) => ATURAN.find((a) => a.id === id)!

// 1. HRV turun 20% memicu; HRV normal tidak.
periksa('hrvTurun menyala saat 48 ms vs kebiasaan ~62', !!cari('hrvTurun').nilai(konteks({ hrvMs: 48 }, 7 * 60)))
periksa('hrvTurun diam saat 61 ms', !cari('hrvTurun').nilai(konteks({ hrvMs: 61 }, 7 * 60)))

// 2. Denyut istirahat naik 5+.
periksa('rhrNaik menyala saat +7 bpm', !!cari('rhrNaik').nilai(konteks({ restingHr: 65 }, 7 * 60)))
periksa('rhrNaik diam saat +2 bpm', !cari('rhrNaik').nilai(konteks({ restingHr: 60 }, 7 * 60)))

// 3. Saturasi rendah butuh DUA malam.
const satuMalam = konteks({ spo2Pct: 89 }, 8 * 60)
periksa('spo2Rendah diam bila hanya satu malam', !cari('spo2Rendah').nilai(satuMalam))
const duaMalam = konteks({ spo2Pct: 89 }, 8 * 60)
duaMalam.riwayat[duaMalam.riwayat.length - 2].spo2Pct = 90
periksa('spo2Rendah menyala bila dua malam', !!cari('spo2Rendah').nilai(duaMalam))

// 4. Tekanan darah.
periksa('tekananTinggi menyala 145/95', !!cari('tekananTinggi').nilai(konteks({ systolic: 145, diastolic: 95 }, 10 * 60)))
periksa('tekananTinggi diam 120/78', !cari('tekananTinggi').nilai(konteks({ systolic: 120, diastolic: 78 }, 10 * 60)))

// 5. Tiga hari tanpa latihan.
const sepi = konteks({ exerciseMin: 0 }, 17 * 60)
for (let i = 1; i <= 3; i++) sepi.riwayat[sepi.riwayat.length - i].exerciseMin = 0
periksa('latihanSepi menyala sesudah 3 hari kosong', !!cari('latihanSepi').nilai(sepi))

// 6. Utang tidur.
const utang = konteks({ sleepH: 5 }, 21 * 60)
for (let i = 1; i <= 7; i++) utang.riwayat[utang.riwayat.length - i].sleepH = 5.2
periksa('utangTidur menyala saat 7 malam pendek', !!cari('utangTidur').nilai(utang))

// 7. Aturan gizi memakai ringkasan dari perangkat.
periksa('proteinTertinggal menyala saat 40 g pada 68 kg',
  !!cari('proteinTertinggal').nilai(konteks({}, 17 * 60, { tanggal: hari(0), proteinG: 40, beratKg: 68 })))
periksa('proteinTertinggal diam saat 120 g',
  !cari('proteinTertinggal').nilai(konteks({}, 17 * 60, { tanggal: hari(0), proteinG: 120, beratKg: 68 })))
periksa('proteinTertinggal diam bila ringkasan bukan hari ini',
  !cari('proteinTertinggal').nilai(konteks({}, 17 * 60, { tanggal: hari(3), proteinG: 10, beratKg: 68 })))

periksa('kopiTerlaluSore menyala bila diminum satu jam lalu pukul 16',
  !!cari('kopiTerlaluSore').nilai(konteks({}, 16 * 60, { kopiTerakhir: Date.now() - 3600_000 })))
periksa('kopiTerlaluSore diam bila kopinya pagi tadi',
  !cari('kopiTerlaluSore').nilai(konteks({}, 16 * 60, { kopiTerakhir: Date.now() - 8 * 3600_000 })))

periksa('labKedaluwarsa menyala bila HbA1c 8 bulan lalu',
  !!cari('labKedaluwarsa').nilai(konteks({}, 10 * 60, { tanggal: hari(0), labTerakhir: { hba1c: hari(240) } })))
periksa('labKedaluwarsa diam bila HbA1c dua bulan lalu',
  !cari('labKedaluwarsa').nilai(konteks({}, 10 * 60, { tanggal: hari(0), labTerakhir: { hba1c: hari(60) } })))

periksa('puasaPanjang menyala pada jam ke-22',
  !!cari('puasaPanjang').nilai(konteks({}, 12 * 60, { puasaMulai: Date.now() - 22 * 3600_000 })))
periksa('puasaPanjang diam pada jam ke-14',
  !cari('puasaPanjang').nilai(konteks({}, 12 * 60, { puasaMulai: Date.now() - 14 * 3600_000 })))

periksa('catatanHarianSepi menyala sesudah 3 hari',
  !!cari('catatanHarianSepi').nilai(konteks({}, 20 * 60, { tanggal: hari(3), catatanHariIni: false })))
periksa('catatanHarianSepi diam bila hari ini sudah mencatat',
  !cari('catatanHarianSepi').nilai(konteks({}, 20 * 60, { tanggal: hari(0), catatanHariIni: true })))

// 7c. Gelombang ketiga: tenaga, cairan, cahaya, suplemen, tangga.
periksa('tenagaRendah menyala saat ditandai 2 dari 5',
  !!cari('tenagaRendah').nilai(konteks({}, 19 * 60, { tanggal: hari(0), tenaga: 2 })))
periksa('tenagaRendah diam saat ditandai 4',
  !cari('tenagaRendah').nilai(konteks({}, 19 * 60, { tanggal: hari(0), tenaga: 4 })))

periksa('cairanTertinggal menyala pada 800 mL sore hari',
  !!cari('cairanTertinggal').nilai(konteks({}, 16 * 60, { tanggal: hari(0), airMl: 800 })))
periksa('cairanTertinggal diam pada 2000 mL',
  !cari('cairanTertinggal').nilai(konteks({}, 16 * 60, { tanggal: hari(0), airMl: 2000 })))
periksa('cairanTertinggal diam bila belum pernah mencatat sama sekali',
  !cari('cairanTertinggal').nilai(konteks({}, 16 * 60, { tanggal: hari(0) })))

periksa('cahayaBelum menyala bila ditandai belum',
  !!cari('cahayaBelum').nilai(konteks({}, 9 * 60, { tanggal: hari(0), cahayaHariIni: false })))
periksa('cahayaBelum diam bila sudah',
  !cari('cahayaBelum').nilai(konteks({}, 9 * 60, { tanggal: hari(0), cahayaHariIni: true })))

periksa('suplemenBelum menyala bila dua belum ditandai',
  !!cari('suplemenBelum').nilai(konteks({}, 10 * 60, { tanggal: hari(0), suplemenBelum: 2 })))
periksa('suplemenBelum diam bila semua sudah',
  !cari('suplemenBelum').nilai(konteks({}, 10 * 60, { tanggal: hari(0), suplemenBelum: 0 })))

const tangga = konteks({ flightsClimbed: 1 }, 18 * 60)
for (let i = 1; i <= 14; i++) tangga.riwayat[tangga.riwayat.length - i].flightsClimbed = 12
tangga.hariIni.flightsClimbed = 1
periksa('tanggaSepi menyala saat 1 lantai vs kebiasaan 12', !!cari('tanggaSepi').nilai(tangga))

// 7d. Gelombang keempat: skrining, kekuatan genggam, angkat beban.
periksa('skriningLewat menyala bila dua lewat jatuh tempo',
  !!cari('skriningLewat').nilai(konteks({}, 10 * 60, { skriningLewat: 2 })))
periksa('skriningLewat diam bila tidak ada yang lewat',
  !cari('skriningLewat').nilai(konteks({}, 10 * 60, { skriningLewat: 0 })))

periksa('genggamLama menyala sesudah 5 bulan',
  !!cari('genggamLama').nilai(konteks({}, 10 * 60, { umurGenggam: 150 })))
periksa('genggamLama diam sesudah 2 bulan',
  !cari('genggamLama').nilai(konteks({}, 10 * 60, { umurGenggam: 60 })))

periksa('bebanSepi menyala sesudah 14 hari',
  !!cari('bebanSepi').nilai(konteks({}, 17 * 60, { hariSejakBeban: 14 })))
periksa('bebanSepi diam sesudah 3 hari',
  !cari('bebanSepi').nilai(konteks({}, 17 * 60, { hariSejakBeban: 3 })))
periksa('bebanSepi diam sesudah 90 hari (sudah berhenti sama sekali, bukan lupa)',
  !cari('bebanSepi').nilai(konteks({}, 17 * 60, { hariSejakBeban: 90 })))

// 7g. Amsler berubah dan berat turun cepat.
periksa('amslerBerubah menyala bila hasil terakhir berubah',
  !!cari('amslerBerubah').nilai(konteks({}, 10 * 60, { amslerBerubah: true })))
periksa('amslerBerubah diam bila hasilnya normal',
  !cari('amslerBerubah').nilai(konteks({}, 10 * 60, { amslerBerubah: false })))
periksa('amslerBerubah tidak menyebut nama penyakit',
  !/degenerasi|makula|retina|glaukoma/i.test(cari('amslerBerubah').nilai(konteks({}, 10 * 60, { amslerBerubah: true }))!.badan))
{
  const k = konteks({ weightKg: 54 }, 10 * 60)
  for (const b of k.riwayat) b.weightKg = 60
  k.hariIni.weightKg = 54
  periksa('beratTurunCepat menyala pada penurunan 10% dalam rentang riwayat', !!cari('beratTurunCepat').nilai(k))
  periksa('beratTurunCepat menyebut kemungkinan disengaja lebih dahulu',
    /memang sedang Anda usahakan/.test(cari('beratTurunCepat').nilai(k)!.badan))
}
{
  const k = konteks({ weightKg: 59.5 }, 10 * 60)
  for (const b of k.riwayat) b.weightKg = 60
  k.hariIni.weightKg = 59.5
  periksa('beratTurunCepat diam pada penurunan setengah kilogram', !cari('beratTurunCepat').nilai(k))
}

// 7f. Kabar baik dan hari istirahat.
{
  const k = konteks({ restingHr: 52 }, 8 * 60)
  for (const b of k.riwayat) b.restingHr = 52
  k.riwayat[k.riwayat.length - 3].restingHr = 60
  k.hariIni.restingHr = 52
  periksa('rhrPulih menyala sesudah beberapa hari tinggi lalu kembali', !!cari('rhrPulih').nilai(k))
}
{
  const k = konteks({ restingHr: 52 }, 8 * 60)
  for (const b of k.riwayat) b.restingHr = 52
  k.hariIni.restingHr = 52
  periksa('rhrPulih diam bila memang tidak pernah naik', !cari('rhrPulih').nilai(k))
}
{
  const k = konteks({ sleepH: 7.5 }, 9 * 60)
  for (const b of k.riwayat.slice(-3)) b.sleepH = 7.5
  periksa('tidurTigaMalam menyala pada tiga malam >= 7 jam', !!cari('tidurTigaMalam').nilai(k))
  k.riwayat[k.riwayat.length - 2].sleepH = 5.5
  periksa('tidurTigaMalam diam bila satu malam kurang', !cari('tidurTigaMalam').nilai(k))
}
{
  const k = konteks({ exerciseMin: 45 }, 19 * 60)
  for (const b of k.riwayat.slice(-7)) b.exerciseMin = 45
  periksa('tanpaIstirahat menyala pada tujuh hari beruntun', !!cari('tanpaIstirahat').nilai(k))
  periksa('tanpaIstirahat tidak berbunyi seperti diagnosis',
    /bukan diagnosis/.test(cari('tanpaIstirahat').nilai(k)!.badan))
  k.riwayat[k.riwayat.length - 4].exerciseMin = 0
  periksa('tanpaIstirahat diam bila ada satu hari istirahat', !cari('tanpaIstirahat').nilai(k))
}

// 7e. Gelombang penutup: Amsler, waktu layar, jet lag.
periksa('amslerLama menyala sesudah 30 hari',
  !!cari('amslerLama').nilai(konteks({}, 10 * 60, { amslerHariLalu: 30 })))
periksa('amslerLama diam sesudah 7 hari',
  !cari('amslerLama').nilai(konteks({}, 10 * 60, { amslerHariLalu: 7 })))

periksa('layarPanjang menyala pada 200 menit sesi fokus',
  !!cari('layarPanjang').nilai(konteks({}, 15 * 60, { fokusMenitHariIni: 200 })))
periksa('layarPanjang diam pada 50 menit',
  !cari('layarPanjang').nilai(konteks({}, 15 * 60, { fokusMenitHariIni: 50 })))

periksa('jetlagSiap menyala 3 hari sebelum berangkat dengan selisih 6 jam',
  !!cari('jetlagSiap').nilai(konteks({}, 20 * 60, { jetlagJam: 6, jetlagHariLagi: 3 })))
periksa('jetlagSiap diam bila masih 20 hari lagi (belum waktunya menggeser)',
  !cari('jetlagSiap').nilai(konteks({}, 20 * 60, { jetlagJam: 6, jetlagHariLagi: 20 })))
periksa('jetlagSiap diam bila tanpa selisih jam',
  !cari('jetlagSiap').nilai(konteks({}, 20 * 60, { jetlagJam: 0, jetlagHariLagi: 2 })))
periksa('jetlagSiap ke barat berbunyi "lebih malam"',
  /lebih malam/.test(cari('jetlagSiap').nilai(konteks({}, 20 * 60, { jetlagJam: -5, jetlagHariLagi: 2 }))!.judul))


// ── Menyelam ────────────────────────────────────────────────────────────────
//
// Dua aturan ini mengabarkan sesuatu yang dapat MENCEDERAI bila diabaikan,
// jadi yang diuji bukan hanya "menyala/diam" melainkan juga bahwa keduanya
// TIDAK berbunyi bersamaan untuk satu keadaan.
periksa('terbangBelumAman menyala 4 jam sesudah selaman tunggal (syarat 12 jam)',
  !!cari('terbangBelumAman').nilai(konteks({}, 14 * 60, { selamJamLalu: 4, selamSyaratJam: 12 })))
periksa('terbangBelumAman diam 13 jam sesudah selaman tunggal',
  !cari('terbangBelumAman').nilai(konteks({}, 14 * 60, { selamJamLalu: 13, selamSyaratJam: 12 })))
periksa('terbangBelumAman masih menyala 13 jam sesudah selaman berulang (syarat 18 jam)',
  !!cari('terbangBelumAman').nilai(konteks({}, 14 * 60, { selamJamLalu: 13, selamSyaratJam: 18 })))
periksa('terbangBelumAman menyebut sisa jamnya',
  /5 h/.test(cari('terbangBelumAman').nilai(konteks({}, 14 * 60, { selamJamLalu: 13, selamSyaratJam: 18 }))!.judul))
periksa('terbangBelumAman diam tanpa data menyelam',
  !cari('terbangBelumAman').nilai(konteks({}, 14 * 60, {})))

periksa('selamBerulang diam bila aturan terbang sudah mengabarkan hal yang sama',
  !cari('selamBerulang').nilai(konteks({}, 14 * 60, { selamJamLalu: 4, selamSyaratJam: 12 })))
periksa('selamBerulang menyala pada jeda 6 jam ketika syarat terbang sudah lewat',
  !!cari('selamBerulang').nilai(konteks({}, 14 * 60, { selamJamLalu: 6, selamSyaratJam: 4 })))
periksa('selamBerulang diam sesudah 14 jam',
  !cari('selamBerulang').nilai(konteks({}, 14 * 60, { selamJamLalu: 14, selamSyaratJam: 12 })))

// 7b. Jendela waktu tiap aturan masuk akal (tidak ada yang tengah malam).
for (const a of ATURAN) {
  if (!a.jendela) continue
  periksa(`jendela ${a.id} di luar jam tidur`, a.jendela[0] >= 6 * 60 && a.jendela[1] <= 22 * 60, String(a.jendela))
}

// 8. Tiap kategori punya kunci setelannya.
for (const a of ATURAN) periksa(`kategori ${a.id} punya pref`, !!PREF_KATEGORI[a.kategori])

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)
