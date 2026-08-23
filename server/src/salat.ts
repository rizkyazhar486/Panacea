import { getSettings, saveSettings } from './store.js'
import { notify } from './push.js'

// ─────────────────────────────────────────────────────────────────────────────
// Pengingat SEBELUM waktu salat, dikirim server.
//
// MENGAPA BUKAN ADZAN. Aplikasi ini tidak menyertakan rekaman adzan (hak cipta
// muazinnya), dan Web Push tidak dapat memutar lantunan — yang dikirim server
// selalu berupa notifikasi biasa. Karena itu yang dijanjikan di sini juga
// hanya itu: pemberitahuan "dua menit lagi Magrib", bukan adzan. Lantunan atau
// nada tetap dibunyikan halaman Adzan selama aplikasi terbuka.
//
// KENAPA BERGUNA JUSTRU KARENA DIKIRIM LEBIH AWAL. Diberitahu tepat pada
// waktunya sering terlambat: yang dibutuhkan adalah beberapa menit untuk
// menyudahi apa yang sedang dikerjakan. Itu sebabnya yang dapat diatur adalah
// BERAPA MENIT SEBELUMNYA, bukan sekadar hidup/mati.
//
// SUMBER WAKTUNYA SAMA DENGAN YANG DIPAKAI HALAMAN ADZAN (AlAdhan), sehingga
// jam di notifikasi tidak pernah berbeda dari jam di layar. Disinggahi per
// kota per hari: satu kota yang diikuti seratus orang tetap satu permintaan.
// ─────────────────────────────────────────────────────────────────────────────

const BASIS = 'https://api.aladhan.com/v1'
const SALAT: { id: string; nama: string }[] = [
  { id: 'Fajr', nama: 'Subuh' },
  { id: 'Dhuhr', nama: 'Zuhur' },
  { id: 'Asr', nama: 'Asar' },
  { id: 'Maghrib', nama: 'Magrib' },
  { id: 'Isha', nama: 'Isya' },
]

interface Jadwal { tanggal: string; menit: Record<string, number> }
const singgahan = new Map<string, Jadwal>()

function keMenit(jam: string | undefined): number | null {
  if (!jam) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(jam.trim())
  if (!m) return null
  const h = Number(m[1]), mi = Number(m[2])
  if (h > 23 || mi > 59) return null
  return h * 60 + mi
}

async function jadwalKota(kota: string, negara: string, metode: number, tanggal: string): Promise<Jadwal | null> {
  const kunci = `${kota}|${negara}|${metode}|${tanggal}`
  const ada = singgahan.get(kunci)
  if (ada) return ada
  try {
    const r = await fetch(`${BASIS}/timingsByCity?city=${encodeURIComponent(kota)}&country=${encodeURIComponent(negara)}&method=${metode}`)
    if (!r.ok) return null
    const j = (await r.json()) as { data?: { timings?: Record<string, string> } }
    const t = j.data?.timings ?? {}
    const menit: Record<string, number> = {}
    for (const s of SALAT) {
      const v = keMenit(t[s.id])
      if (v != null) menit[s.id] = v
    }
    if (!Object.keys(menit).length) return null
    const hasil = { tanggal, menit }
    singgahan.set(kunci, hasil)
    // Singgahan hari kemarin dibuang, bukan dibiarkan menumpuk seumur proses.
    for (const k of singgahan.keys()) if (!k.endsWith(tanggal)) singgahan.delete(k)
    return hasil
  } catch {
    return null
  }
}

export interface SalatCheck { sent: boolean; reason: string }

/**
 * Dipanggil sekali semenit untuk tiap pengguna, bentuknya sama persis dengan
 * pengingat tidur dan latihan: jendela toleransi dua menit dan satu penanda
 * per salat per hari, supaya satu detak yang terlewat tidak menghapus
 * pengingatnya dan detak berikutnya tidak mengirim untuk kedua kalinya.
 */
export async function checkPrayerReminder(userId: string): Promise<SalatCheck> {
  const prefs = getSettings(userId)
  if (prefs.notifSalat !== true) return { sent: false, reason: 'off' }

  const kota = String(prefs.salatKota || 'Jakarta')
  const negara = String(prefs.salatNegara || 'Indonesia')
  const metode = Number(prefs.salatMetode) || 20
  const lead = Math.min(60, Math.max(0, Number(prefs.salatLeadMin) ?? 5))

  const offset = Number(prefs.tzOffsetMin) || 0
  const lokal = new Date(Date.now() + offset * 60_000)
  const tanggal = lokal.toISOString().slice(0, 10)
  const sekarang = lokal.getUTCHours() * 60 + lokal.getUTCMinutes()

  const jadwal = await jadwalKota(kota, negara, metode, tanggal)
  if (!jadwal) return { sent: false, reason: 'no-schedule' }

  const dipilih: Record<string, boolean> = prefs.salatPilih ?? {}
  const sudah: Record<string, string> = prefs.salatLastFired ?? {}

  for (const s of SALAT) {
    if (dipilih[s.id] === false) continue
    const waktu = jadwal.menit[s.id]
    if (waktu == null) continue
    const fireAt = ((waktu - lead) % 1440 + 1440) % 1440
    const beda = Math.min(Math.abs(sekarang - fireAt), 1440 - Math.abs(sekarang - fireAt))
    if (beda > 2) continue
    if (sudah[s.id] === tanggal) continue

    saveSettings(userId, { salatLastFired: { ...sudah, [s.id]: tanggal } })
    const jam = `${String(Math.floor(waktu / 60)).padStart(2, '0')}.${String(waktu % 60).padStart(2, '0')}`
    await notify(userId, {
      title: lead > 0 ? `🕌 ${lead} menit lagi ${s.nama}` : `🕌 Waktu ${s.nama}`,
      body: `${s.nama} pukul ${jam} di ${kota}. Sumber jadwal: AlAdhan.`,
      url: './#/prayer-times',
      tag: `salat-${s.id}`,
    }, 'notifSalat').catch(() => {})
    return { sent: true, reason: s.id }
  }
  return { sent: false, reason: 'not-time' }
}
