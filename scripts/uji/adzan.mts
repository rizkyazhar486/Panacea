// Waktu salat: aritmetika pengingat dan penolakan jadwal yang tidak masuk akal.
//
// Waktu salat yang salah bukan ketidaknyamanan kecil — ia membuat orang salat
// di luar waktunya. Jadi yang diuji di sini bukan hanya "jalan atau tidak",
// melainkan bahwa jadwal yang mencurigakan DITOLAK SELURUHNYA.
import {
  keMenit, fmtMenit, periksaJadwal, berikutnya, saatnyaMengingatkan,
  menitSekarang, TOLERANSI_MENIT, SALAT, METODE, muatSetelan, SETELAN_AWAL,
  type WaktuSalat, type JadwalHari,
} from '../../src/lib/adzan.js'

const simpanan = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => simpanan.get(k) ?? null,
  setItem: (k: string, v: string) => { simpanan.set(k, v) },
  removeItem: (k: string) => { simpanan.delete(k) },
}

let lulus = 0, gagal = 0
function cek(nama: string, benar: boolean, ket = '') {
  if (benar) { lulus++; console.log('PASS', nama, ket) }
  else { gagal++; console.log('FAIL', nama, ket) }
}

// ── Penguraian jam ──────────────────────────────────────────────────────────
cek('jam biasa terbaca', keMenit('05:12') === 312)
cek('jam dengan zona terbaca', keMenit('18:03 (WIB)') === 1083)
cek('tengah malam terbaca', keMenit('00:00') === 0)
cek('jam tidak sah ditolak', keMenit('25:00') === null && keMenit('') === null && keMenit('abc') === null)
cek('menit tidak sah ditolak', keMenit('05:99') === null)
cek('bolak-balik utuh', fmtMenit(312) === '05:12' && fmtMenit(1083) === '18:03')

// ── Periksa jadwal ──────────────────────────────────────────────────────────
const w = (salat: string, menit: number): WaktuSalat =>
  ({ salat: salat as WaktuSalat['salat'], menit, jam: fmtMenit(menit) })

const sehat = [w('Fajr', 268), w('Dhuhr', 719), w('Asr', 940), w('Maghrib', 1092), w('Isha', 1200)]
cek('jadwal wajar lolos', periksaJadwal(sehat).utuh)
cek('jadwal kurang satu waktu ditolak', !periksaJadwal(sehat.slice(0, 4)).utuh)
cek('jadwal kelebihan waktu ditolak', !periksaJadwal([...sehat, w('Isha', 1300)]).utuh)

// Yang paling penting: urutan yang melompat mundur.
const kacau = [w('Fajr', 268), w('Dhuhr', 719), w('Asr', 700), w('Maghrib', 1092), w('Isha', 1200)]
const hasilKacau = periksaJadwal(kacau)
cek('waktu yang melompat mundur ditolak', !hasilKacau.utuh)
cek('alasannya menyebut salat mana yang salah', /Asr/.test(hasilKacau.alasan ?? ''), hasilKacau.alasan ?? '')
cek('dua waktu yang sama persis ditolak',
  !periksaJadwal([w('Fajr', 268), w('Dhuhr', 719), w('Asr', 719), w('Maghrib', 1092), w('Isha', 1200)]).utuh)

// ── Salat berikutnya ────────────────────────────────────────────────────────
const jadwal: JadwalHari = { tanggal: 'x', kota: 'Jakarta', metode: 'Kemenag RI', waktu: sehat }
cek('pagi buta menunjuk Subuh', berikutnya(jadwal, 100).salat.salat === 'Fajr')
cek('tengah hari menunjuk Asar', berikutnya(jadwal, 800).salat.salat === 'Asr')
cek('lewat Isya berputar ke Subuh besok', berikutnya(jadwal, 1300).salat.salat === 'Fajr')
cek('hitungan mundur lintas tengah malam benar',
  berikutnya(jadwal, 1300).menitLagi === 1440 - 1300 + 268,
  String(berikutnya(jadwal, 1300).menitLagi))
cek('hitungan mundur biasa benar', berikutnya(jadwal, 700).menitLagi === 719 - 700,
  `${berikutnya(jadwal, 700).salat.salat} dalam ${berikutnya(jadwal, 700).menitLagi} menit`)

// ── Kapan mengingatkan ──────────────────────────────────────────────────────
cek('tepat pada waktunya: mengingatkan', saatnyaMengingatkan(719, 719))
cek('dalam toleransi: mengingatkan', saatnyaMengingatkan(719, 719 + TOLERANSI_MENIT))
cek('lewat toleransi: TIDAK mengingatkan', !saatnyaMengingatkan(719, 719 + TOLERANSI_MENIT + 1))
cek('empat jam terlambat: TIDAK mengingatkan', !saatnyaMengingatkan(719, 719 + 240))
cek('belum waktunya: TIDAK mengingatkan', !saatnyaMengingatkan(719, 718))
cek('awalan 10 menit menggeser pengingat', saatnyaMengingatkan(719, 709, 10) && !saatnyaMengingatkan(719, 719 - 11, 10))
// Subuh dengan awalan yang melewati tengah malam tidak boleh menghasilkan
// angka negatif yang membuat pengingat berbunyi sepanjang hari.
cek('awalan yang melewati tengah malam tidak kacau',
  saatnyaMengingatkan(5, 1435, 10) && !saatnyaMengingatkan(5, 700, 10),
  `target ${fmtMenit(((5 - 10) % 1440 + 1440) % 1440)}`)

// ── Setelan ─────────────────────────────────────────────────────────────────
cek('setelan awal mati secara bawaan', SETELAN_AWAL.aktif === false)
cek('setelan awal tidak memuat rekaman apa pun', SETELAN_AWAL.suaraUrl === '')
simpanan.set('pmd-adzan-setelan-v1', '{"aktif":true}')
const s = muatSetelan()
cek('setelan lama tetap lengkap setelah dimuat',
  s.aktif === true && s.pilih.Fajr === true && s.metode === 20, JSON.stringify(s.pilih))
simpanan.set('pmd-adzan-setelan-v1', 'bukan json')
cek('setelan rusak tidak melempar', muatSetelan().kota === 'Jakarta')

// ── Katalog ─────────────────────────────────────────────────────────────────
cek('lima salat wajib, tanpa terbit matahari',
  SALAT.length === 5 && !SALAT.some((x) => /sunrise|syuruq/i.test(x.nama)))
cek('metode perhitungan bisa dipilih, tidak dipaksakan', METODE.length >= 5)
cek('menitSekarang membaca jam setempat',
  menitSekarang(new Date(2026, 0, 1, 14, 30)) === 14 * 60 + 30)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)
