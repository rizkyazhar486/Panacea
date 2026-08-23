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
      nama: 'This browser supports notifications',
      keadaan: didukung ? 'ok' : 'gagal',
      sebab: didukung ? undefined : 'On iOS, Safari only supports them once this app has been added to the Home Screen.',
    })

    const izin = didukung ? Notification.permission : 'default'
    out.push({
      nama: 'Permission granted',
      keadaan: izin === 'granted' ? 'ok' : izin === 'denied' ? 'gagal' : 'tanya',
      sebab: izin === 'denied'
        ? 'Denied. No button in the app can undo that — open your browser\'s site settings and allow notifications.'
        : izin === 'granted' ? undefined : 'Not asked yet — press “Turn on notifications”.',
    })

    let langgananAda = false
    if (didukung) {
      try {
        const reg = await navigator.serviceWorker.ready
        langgananAda = Boolean(await reg.pushManager.getSubscription())
      } catch { /* peramban menolak — dianggap belum ada */ }
    }
    out.push({
      nama: 'Subscription created in the browser',
      keadaan: langgananAda ? 'ok' : 'gagal',
      sebab: langgananAda ? undefined : 'None yet. It is created automatically once permission is granted.',
    })

    /* KEADAAN SERVER DITANYAKAN KE SERVER, bukan disimpulkan dari satu bendera.
       Tiga keadaan yang selama ini terlihat sama dibedakan di sini: kunci belum
       diisi, kunci diisi dan berhasil dipasang, dan kunci diisi tetapi DITOLAK
       — yang terakhir itulah yang terjadi pada kunci yang tersalin bersama
       spasi, dan sebelumnya hanya tercatat di log server. */
    let ks: {
      vapidDiisi: boolean; vapidDicoba: boolean; vapidGalat?: string; langganan: number
      penyimpanan: string; detakDetikLalu?: number | null; hidupDetik?: number
    } | null = null
    if (backendEnabled) {
      try { ks = await api.pushStatusServer() } catch { ks = null }
    }
    out.push({
      nama: 'The server has VAPID keys',
      keadaan: ks === null ? 'periksa' : ks.vapidDiisi ? (ks.vapidGalat ? 'gagal' : 'ok') : 'gagal',
      sebab: ks === null
        ? 'The server could not be reached during this check.'
        : !ks.vapidDiisi
          ? 'Not set. Without VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on the server, NO notification can be sent at all — however many switches are turned on here. Generate the keys once with “npx web-push generate-vapid-keys”, put them into the Render environment, and restart the server.'
          : ks.vapidGalat
            ? `The keys are set but the server REJECTED them: ${ks.vapidGalat}. Usually a stray space or newline came along when pasting, or the public and private keys were swapped.`
            : undefined,
    })

    out.push({
      nama: 'The server holds a subscription for this device',
      keadaan: ks === null ? 'periksa' : ks.langganan > 0 ? 'ok' : 'gagal',
      sebab: ks === null ? undefined
        : ks.langganan > 0
          ? `${ks.langganan} device(s) registered.`
          : ks.penyimpanan === 'berkas'
            ? 'None. This server also runs without a permanent database, so the subscription list is WIPED on every redeploy — press “Turn on notifications” again, and set MONGODB_URI so it stops happening.'
            : 'None. Press “Turn on notifications” once more on this device.',
    })

    /* APAKAH PENJADWALNYA MEMANG BERJALAN.
       Pada instans gratis yang dimatikan saat sepi, server yang tertidur
       sepanjang sore terlihat sama persis dengan server yang bangun tetapi
       tidak menemukan satu pun aturan terpenuhi. Umur hidup instans menjawab
       itu: nilai yang baru beberapa menit pada siang hari berarti ia baru saja
       dibangunkan oleh kunjungan Anda sendiri — dan selama tertidur, tidak ada
       jadwal siapa pun yang diperiksa. */
    if (ks?.hidupDetik != null) {
      const menit = Math.round(ks.hidupDetik / 60)
      const baruBangun = ks.hidupDetik < 20 * 60
      out.push({
        nama: 'The server scheduler is running',
        keadaan: baruBangun ? 'tanya' : 'ok',
        sebab: baruBangun
          ? `The server has only been up for ${menit} min — most likely this very visit woke it. While it sleeps it checks nobody's schedule. See the note below for how to keep it awake at no cost.`
          : `Up for ${menit >= 120 ? `${Math.round(menit / 60)} h` : `${menit} min`} without interruption.`,
      })
    }

    const jenisNyala = ['notifPemulihan', 'notifLatihanPintar', 'notifVital', 'notifLingkungan', 'notifGizi', 'notifKebiasaan']
      .filter((k) => setelan[k] === true).length
    out.push({
      nama: 'At least one reminder type is on',
      keadaan: jenisNyala > 0 ? 'ok' : 'gagal',
      sebab: jenisNyala > 0 ? `${jenisNyala} type(s) switched on.` : 'Every switch is off, so the rule engine has no category it is allowed to send.',
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
      if (r.sent > 0) setUji(`Sent to ${r.sent} device(s). If nothing shows up, check Focus or silent mode on your phone.`)
      else if (r.reason === 'vapid_not_configured') setUji('The server has no VAPID keys — that is the reason. See the fourth line above.')
      else if (r.reason === 'no_subscriptions_on_file') setUji('The server holds no subscription for this device. Press “Turn on notifications” again, then retry this test.')
      else setUji('The server tried to send and failed. The exact reason is only recorded in the server log.')
    } catch {
      setUji('Could not reach the server. A free instance sleeps after 15 minutes — try again in about a minute.')
    }
    setSibuk(false)
    void periksa()
  }

  if (!backendEnabled) return null

  return (
    <div className="border-t border-neutral-100 py-2 dark:border-white/10">
      <button onClick={() => setBuka((b) => !b)} className="t-kecil flex min-h-[40px] w-full items-center justify-between gap-2 font-bold text-brand">
        <span>Notifications not arriving? Check here</span>
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
            {sibuk ? 'Sending…' : 'Send a test notification'}
          </button>
          {uji && <p className="t-mikro mt-2 leading-snug text-neutral-600 dark:text-neutral-300">{uji}</p>}

          {/* Keterbatasan yang TIDAK dapat diperbaiki dari sisi aplikasi, dan
              karena itu harus dikatakan: penjadwalnya hidup di server, dan
              server gratis dimatikan saat tidak ada yang membukanya. */}
          <p className="t-mikro mt-2 leading-snug text-neutral-400">
            Scheduled reminders are sent by the server, not by your phone. On Render's free plan the server is shut
            down after 15 minutes without a visit — while it sleeps it checks nobody's schedule, so a 5 pm reminder can
            be missed entirely on a day this app is never opened. That is the plan's limit, not a mistake in your
            settings. This repository already ships a GitHub Actions workflow that touches the server every ten minutes
            between 04:00 and 23:00 WIB to keep it awake at no extra cost; the address is taken from the
            <code>VITE_API_URL</code> repository variable you already have.
          </p>
        </div>
      )}
    </div>
  )
}

export default DiagnosaNotifikasi
