import { useCallback, useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { pushSupported, resyncPush } from '../lib/push'

// ─────────────────────────────────────────────────────────────────────────────
// Mengapa notifikasi tidak berbunyi — diperiksa mata rantai demi mata rantai.
//
// SEBUAH NOTIFIKASI HARUS MELEWATI ENAM PINTU sebelum sampai ke layar: peramban
// mendukungnya, izin diberikan, langganan terbentuk di peramban, server punya
// kunci VAPID, server menyimpan langganan perangkat ini, dan sedikitnya satu
// jenis pengingat dinyalakan. Bila SATU saja tertutup, tidak ada apa pun yang
// terjadi — dan yang terlihat oleh pemakainya sama persis untuk keenam
// sebabnya: sunyi. Selama ini ia harus menebak yang mana.
//
// Panel ini memeriksa keenamnya dan menyebutkan yang tertutup beserta cara
// membukanya. Pemeriksaan terakhir — apakah server benar-benar menyimpan
// langganan perangkat ini — hanya dapat dijawab oleh server, jadi jawabannya
// diambil dari hasil kiriman percobaan, bukan ditebak dari sisi peramban.
// ─────────────────────────────────────────────────────────────────────────────

type Keadaan = 'ok' | 'gagal' | 'tanya' | 'periksa'

interface Mata {
  nama: string
  keadaan: Keadaan
  sebab?: string
}

function Titik({ k }: { k: Keadaan }) {
  const gaya = k === 'ok' ? 'bg-emerald-500' : k === 'gagal' ? 'bg-rose-500' : k === 'periksa' ? 'bg-neutral-300 dark:bg-white/25' : 'bg-amber-400'
  return <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${gaya}`} aria-hidden />
}

export function DiagnosaNotifikasi({ setelan }: { setelan: Record<string, unknown> }) {
  const [buka, setBuka] = useState(false)
  const [mata, setMata] = useState<Mata[]>([])
  const [uji, setUji] = useState('')
  const [sibuk, setSibuk] = useState(false)

  const periksa = useCallback(async () => {
    const out: Mata[] = []

    const didukung = pushSupported()
    out.push({
      nama: 'Peramban mendukung notifikasi',
      keadaan: didukung ? 'ok' : 'gagal',
      sebab: didukung ? undefined : 'Safari di iOS hanya mendukungnya bila aplikasi ini dipasang ke layar utama lebih dahulu.',
    })

    const izin = didukung ? Notification.permission : 'default'
    out.push({
      nama: 'Izin diberikan',
      keadaan: izin === 'granted' ? 'ok' : izin === 'denied' ? 'gagal' : 'tanya',
      sebab: izin === 'denied'
        ? 'Ditolak. Tombol di aplikasi tidak dapat membatalkannya — buka pengaturan situs di peramban Anda, lalu izinkan notifikasi.'
        : izin === 'granted' ? undefined : 'Belum ditanyakan — tekan “Nyalakan”.',
    })

    let langgananAda = false
    if (didukung) {
      try {
        const reg = await navigator.serviceWorker.ready
        langgananAda = Boolean(await reg.pushManager.getSubscription())
      } catch { /* peramban menolak — dianggap belum ada */ }
    }
    out.push({
      nama: 'Langganan terbentuk di peramban',
      keadaan: langgananAda ? 'ok' : 'gagal',
      sebab: langgananAda ? undefined : 'Belum ada. Ini terbentuk sendiri saat izin diberikan.',
    })

    let vapid: boolean | null = null
    if (backendEnabled) {
      try { vapid = Boolean((await api.health()).features?.push) } catch { vapid = null }
    }
    out.push({
      nama: 'Server punya kunci VAPID',
      keadaan: vapid === true ? 'ok' : vapid === false ? 'gagal' : 'periksa',
      sebab: vapid === false
        ? 'Belum diisi. Tanpa VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY di server, TIDAK ADA satu pun notifikasi yang dapat dikirim — berapa pun saklar yang dinyalakan di sini. Kuncinya dibuat sekali dengan “npx web-push generate-vapid-keys”, lalu diisikan ke Environment di Render dan server dijalankan ulang.'
        : vapid === null ? 'Server tidak dapat dihubungi saat memeriksa.' : undefined,
    })

    const jenisNyala = ['notifPemulihan', 'notifLatihanPintar', 'notifVital', 'notifLingkungan', 'notifGizi', 'notifKebiasaan']
      .filter((k) => setelan[k] === true).length
    out.push({
      nama: 'Sedikitnya satu jenis pengingat menyala',
      keadaan: jenisNyala > 0 ? 'ok' : 'gagal',
      sebab: jenisNyala > 0 ? `${jenisNyala} jenis menyala.` : 'Semua saklar mati, jadi mesin aturan tidak punya satu pun jenis yang boleh dikirim.',
    })

    setMata(out)
  }, [setelan])

  useEffect(() => { if (buka) void periksa() }, [buka, periksa])

  const kirimUji = async () => {
    setSibuk(true)
    setUji('')
    try {
      // Langganan didaftarkan ULANG lebih dahulu. Sebab paling sering dari
      // "sudah aktif tetapi tidak ada yang datang" adalah server kehilangan
      // langganannya — pada server tanpa basis data tetap, itu terjadi pada
      // setiap deploy ulang.
      await resyncPush()
      const r = await api.pushTest()
      if (r.sent > 0) setUji(`Terkirim ke ${r.sent} perangkat. Bila tidak muncul juga, periksa mode fokus atau senyap di ponsel Anda.`)
      else if (r.reason === 'vapid_not_configured') setUji('Server belum diberi kunci VAPID — itulah sebabnya. Lihat baris keempat di atas.')
      else if (r.reason === 'no_subscriptions_on_file') setUji('Server tidak punya langganan perangkat ini. Tekan “Nyalakan” sekali lagi, lalu ulangi percobaan ini.')
      else setUji('Server mencoba mengirim tetapi gagal. Sebab persisnya hanya tercatat di log server.')
    } catch {
      setUji('Tidak dapat menghubungi server. Instans gratis tidur setelah 15 menit — coba lagi sekitar satu menit lagi.')
    }
    setSibuk(false)
    void periksa()
  }

  if (!backendEnabled) return null

  return (
    <div className="border-t border-neutral-100 py-2 dark:border-white/10">
      <button onClick={() => setBuka((b) => !b)} className="t-kecil flex min-h-[40px] w-full items-center justify-between gap-2 font-bold text-brand">
        <span>Notifikasi tidak berbunyi? Periksa di sini</span>
        <span aria-hidden>{buka ? '▴' : '▾'}</span>
      </button>

      {buka && (
        <div className="pb-2">
          <ul className="flex flex-col gap-1.5">
            {mata.map((m) => (
              <li key={m.nama} className="flex gap-2">
                <Titik k={m.keadaan} />
                <span className="min-w-0">
                  <span className="t-kecil block font-bold text-ink dark:text-white">{m.nama}</span>
                  {m.sebab && <span className="t-mikro block leading-snug text-neutral-500">{m.sebab}</span>}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={kirimUji}
            disabled={sibuk}
            className="t-kecil mt-3 min-h-[40px] w-full rounded-xl bg-brand px-3 font-bold text-white disabled:opacity-50"
          >
            {sibuk ? 'Mengirim…' : 'Kirim notifikasi percobaan'}
          </button>
          {uji && <p className="t-mikro mt-2 leading-snug text-neutral-600 dark:text-neutral-300">{uji}</p>}

          {/* Keterbatasan yang TIDAK dapat diperbaiki dari sisi aplikasi, dan
              karena itu harus dikatakan: penjadwalnya hidup di server, dan
              server gratis dimatikan saat tidak ada yang membukanya. */}
          <p className="t-mikro mt-2 leading-snug text-neutral-400">
            Pengingat berjadwal dikirim server, bukan oleh ponsel Anda. Pada paket gratis Render, server dimatikan
            setelah 15 menit tanpa kunjungan — selama tertidur ia tidak memeriksa jadwal siapa pun, sehingga pengingat
            pukul lima sore dapat terlewat pada hari aplikasi ini tidak dibuka sama sekali. Itu batas paketnya, bukan
            kesalahan setelan Anda.
          </p>
        </div>
      )}
    </div>
  )
}

export default DiagnosaNotifikasi
