import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from './ui'
import { ShareCardButton } from './ShareCardButton'
import { IconRun, IconActivity, IconTimer } from './icons'
import type { ImportedWorkout } from '../lib/workoutImport'
import type { Konteks } from '../lib/trainingPhysiology'
import { debrief, saranBerikutnya, jadwalPekan, dukungan, statusSingkat } from '../lib/pelatih'
import { useJam } from '../lib/useJam'
import { TrainingSessionCockpit } from './TrainingSessionCockpit'

// ─────────────────────────────────────────────────────────────────────────────
// Kolom Pelatih — bagian yang berbicara, bukan yang menampilkan angka.
//
// Urutannya disengaja: apa yang harus dilakukan berikutnya lebih dulu, karena
// itulah pertanyaan yang dibawa orang saat membuka halaman ini. Rangkuman sesi
// terakhir menyusul, lalu jadwal, lalu dukungan.
// ─────────────────────────────────────────────────────────────────────────────

export function KolomPelatih({
  workouts, konteks, ringkas = false,
}: {
  workouts: ImportedWorkout[]
  konteks: Konteks
  /** Bentuk pendek untuk kartu beranda. */
  ringkas?: boolean
}) {
  const urut = useMemo(
    () => [...workouts].sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai)),
    [workouts],
  )
  const terakhir = urut[0]
  const debriefRef = useRef<HTMLDivElement>(null)
  // Angka di bawah dihitung terhadap waktu sekarang, jadi `sekarang` harus ikut
  // menjadi dependensi — kalau tidak, halaman yang dibiarkan terbuka semalaman
  // akan menampilkan kelelahan kemarin dan terlihat seolah tidak pernah turun.
  const sekarang = useJam()
  const saran = useMemo(() => saranBerikutnya(workouts, konteks, sekarang), [workouts, konteks, sekarang])
  const db = useMemo(() => (terakhir ? debrief(terakhir, konteks, workouts) : null), [terakhir, konteks, workouts])
  const status = useMemo(() => statusSingkat(workouts, konteks, sekarang), [workouts, konteks, sekarang])
  const jadwal = useMemo(() => jadwalPekan(workouts, konteks, sekarang), [workouts, konteks, sekarang])
  const dk = useMemo(() => dukungan(workouts, konteks, sekarang), [workouts, konteks, sekarang])
  const jedaMs = useMemo(() => {
    if (!terakhir) return null
    const t = Date.parse(terakhir.mulai)
    return Number.isNaN(t) ? null : Math.max(0, sekarang - t)
  }, [terakhir, sekarang])

  /**
   * Kelelahan bila istirahat diteruskan.
   *
   * Dihitung dengan MODEL YANG SAMA, hanya dipanggil dengan waktu di masa
   * depan — bukan dengan rumus peluruhan tiruan yang ditulis ulang di sini.
   * Rumus kedua akan menyimpang diam-diam begitu tetapan waktunya diubah, dan
   * yang terlihat pemakai adalah ramalan yang tidak pernah terjadi.
   */
  const proyeksi = useMemo(() => {
    if (!status) return []
    return [1, 3, 7].map((h) => {
      const st = statusSingkat(workouts, konteks, sekarang + h * 86400_000)
      return { hari: h, kelelahan: st ? Math.round(st.kelelahan) : null }
    })
  }, [workouts, konteks, sekarang, status])

  if (ringkas) {
    return (
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wide text-[color:var(--pelatih-teks-3)]">Coach · next</div>
            <div className="mt-0.5 text-[15px] font-black" style={{ color: saran.warna }}>{saran.judul}</div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[color:var(--pelatih-teks-2)]">{saran.isi}</p>
          </div>
          {status && (
            <div className="shrink-0 text-right">
              <div className="text-xl font-black tabular-nums" style={{ color: status.baca.warna }}>
                {Math.round(status.kesegaran)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-[color:var(--pelatih-teks-3)]">Freshness</div>
            </div>
          )}
        </div>
        <Link to="/riwayat-latihan" className="mt-2 block text-[12px] font-bold text-brand-dark hover:underline">
          Open coach →
        </Link>
      </Card>
    )
  }

  return (
    <>
      {terakhir && (
        <TrainingSessionCockpit
          workout={terakhir}
          nextTitle={saran.judul}
          nextWhen={saran.kapan}
          nextColor={saran.warna}
        />
      )}

      {/* 1. Apa berikutnya */}
      <Card>
        <SectionTitle icon={<IconRun />} title="Next session"
          subtitle="Built from your last session, how long ago it was, and remaining fatigue" />
        <div className="mt-3 rounded-2xl p-4" style={{ background: `${saran.warna}14`, border: `1px solid ${saran.warna}33` }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-lg font-black" style={{ color: saran.warna }}>{saran.judul}</span>
            <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-[color:var(--pelatih-teks-1)]">{saran.kapan}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--pelatih-teks-1)]">{saran.isi}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--pelatih-teks-3)]">Basis: {saran.dasar}</p>
        </div>

        {status && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Angka label="Fitness" nilai={Math.round(status.kebugaran)} warna="#60a5fa" />
            <Angka label="Fatigue" nilai={Math.round(status.kelelahan)} warna="#f87171" />
            <Angka label="Freshness" nilai={Math.round(status.kesegaran)} warna={status.baca.warna} />
          </div>
        )}
        {/* Kelelahan meluruh dengan tetapan waktu 7 hari, jadi dua hari
            istirahat menurunkannya sekitar seperempat. Kalau angkanya tidak
            bergerak padahal sudah libur, yang salah hampir selalu TANGGAL sesi
            -- sesi yang diimpor dengan tanggal impor, bukan tanggal latihan,
            membuat setiap hari terhitung sebagai "latihan hari ini". Tanggal
            sesi terakhir ditampilkan supaya sebabnya kelihatan, bukan
            ditebak-tebak. */}
        {jedaMs !== null && (
          <SejakTerakhir jedaMs={jedaMs} nama={terakhir?.nama} mulai={terakhir?.mulai}
            kelelahanKini={status ? Math.round(status.kelelahan) : null} proyeksi={proyeksi} />
        )}
        {status && <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--pelatih-teks-2)]">
          <b style={{ color: status.baca.warna }}>{status.baca.judul}.</b> {status.baca.arti}
        </p>}
      </Card>

      {/* 2. Rangkuman sesi terakhir */}
      {db && (
        <Card>
          <div ref={debriefRef}>
          <div className="flex items-start justify-between gap-2">
            <SectionTitle icon={<IconActivity />} title={db.judul}
              subtitle={terakhir ? new Date(terakhir.mulai).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : ''} />
            <ShareCardButton targetRef={debriefRef} fileName={`panaceamed-${db.judul.replace(/\s+/g, '-').toLowerCase()}.png`} title={db.judul} />
          </div>
          <KesegaranData jedaMs={jedaMs} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Warna klasifikasi datang dari data, bukan dari palet tema, jadi
                ia tidak bisa diberi varian `dark:`. Di atas tepung terang,
                jingga penuh hanya mencapai 2.39:1 -- terukur. Warnanya
                karena itu dititipkan sebagai custom property dan digelapkan
                untuk mode terang di CSS. */}
            <span className="pita-klasifikasi rounded-full px-2.5 py-1 text-[11px] font-black"
              style={{ ['--pmd-nada' as string]: db.klasifikasi.warna }}>
              {db.klasifikasi.label}
            </span>
            {db.klasifikasi.yakin !== 'tinggi' && (
              <span className="rounded-full bg-[var(--pelatih-alas-1)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--pelatih-teks-3)]">
                confidence {db.klasifikasi.yakin}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--pelatih-teks-1)]">{db.ringkas}</p>
          <div className="mt-3 space-y-1.5">
            {db.poin.map((p, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-[var(--pelatih-alas-1)] px-3 py-2">
                <span className="shrink-0 text-sm">{p.ikon}</span>
                <span className="text-[12px] leading-relaxed text-[color:var(--pelatih-teks-1)]">{p.teks}</span>
              </div>
            ))}
          </div>
          {db.banding && (
            <p className="mt-3 rounded-xl border border-[var(--pelatih-garis)] bg-[var(--pelatih-alas-2)] p-3 text-[12px] leading-relaxed text-[color:var(--pelatih-teks-2)]">
              {db.banding}
            </p>
          )}
          </div>
        </Card>
      )}

      {/* 3. Jadwal pekan */}
      <Card>
        <SectionTitle icon={<IconTimer />} title="This week's plan"
          subtitle="Two quality sessions, one long session, the rest easy — deliberately kept simple" />
        <div className="mt-3 space-y-1.5">
          {jadwal.map((h) => (
            <div key={h.tanggal}
              className={`flex items-start gap-3 rounded-xl px-3 py-2 ${h.sudah ? 'bg-emerald-500/10' : 'bg-[var(--pelatih-alas-1)]'}`}>
              <div className="w-12 shrink-0">
                <div className="text-[11px] font-black text-[color:var(--pelatih-teks-1)]">{h.hari.slice(0, 3)}</div>
                <div className="text-[10px] text-[color:var(--pelatih-teks-3)]">{h.tanggal.slice(8)}/{h.tanggal.slice(5, 7)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold" style={{ color: h.warna }}>
                  {h.label}{h.sudah && <span className="ml-1.5 text-[10px] font-bold text-[color:var(--pelatih-hijau)]">✓ session logged</span>}
                </div>
                <div className="text-[11px] leading-snug text-[color:var(--pelatih-teks-3)]">{h.isi}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--pelatih-teks-3)]">
          This is an example of a balanced week, not an order. Move sessions to fit your days — what
          matters is the ratio: mostly easy, a little hard.
        </p>
      </Card>

      {/* 4. Dukungan */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="text-xl">{dk.nada === 'baik' ? '👏' : dk.nada === 'hati-hati' ? '⚠️' : '🫱'}</span>
          <div>
            <div className={`text-sm font-black ${dk.nada === 'baik' ? 'text-[color:var(--pelatih-hijau)]' : dk.nada === 'hati-hati' ? 'text-[color:var(--pelatih-amber-3)]' : 'text-[color:var(--pelatih-teks-1)]'}`}>
              {dk.judul}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--pelatih-teks-2)]">{dk.isi}</p>
          </div>
        </div>
      </Card>
    </>
  )
}

function Angka({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="rounded-xl bg-[var(--pelatih-alas-1)] p-2.5 text-center">
      <div className="text-lg font-black tabular-nums" style={{ color: warna }}>{nilai}</div>
      <div className="text-[10px] uppercase tracking-wide text-[color:var(--pelatih-teks-3)]">{label}</div>
    </div>
  )
}

export default KolomPelatih


/**
 * "2 hari 5 jam", "5 jam 12 menit", "12 menit" — satuan nol dilewati.
 *
 * Menit hanya ikut ditampilkan bila jedanya belum genap sehari. Detaknya
 * berjalan tiap lima menit, jadi menit pada jeda berhari-hari hanya akan
 * terlihat melompat-lompat tanpa menambah apa pun — sedangkan pada jeda yang
 * masih pendek, menit itulah yang menunjukkan penghitungnya memang berjalan.
 */
function lamanya(ms: number): string {
  const menit = Math.floor(ms / 60_000)
  const hari = Math.floor(menit / 1440)
  const jam = Math.floor((menit % 1440) / 60)
  const sisa = menit % 60
  if (hari) return jam ? `${hari}d ${jam}h` : `${hari}d`
  if (jam) return sisa ? `${jam}h ${sisa}m` : `${jam}h`
  return `${sisa}m`
}

const HARI = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function kapan(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const jj = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${HARI[d.getDay()]} ${d.getDate()} ${BULAN[d.getMonth()]} ${jj}.${mm}`
}

/**
 * Berapa lama sejak latihan terakhir, dan ke mana kelelahan akan bergerak.
 *
 * Ini menjawab pertanyaan yang paling sering muncul di kartu ini: "sudah libur
 * dua hari, kenapa kelelahannya masih segitu?" Angka tunggal tidak bisa
 * menjawabnya karena tidak menunjukkan arah. Deret proyeksi menunjukkan bahwa
 * angkanya memang sedang turun, dan seberapa cepat.
 *
 * Penghitungnya hidup: `useJam` di komponen induk membuatnya berdetak, jadi
 * menit yang berjalan terlihat dan tidak ada yang mengira tampilannya beku.
 */
/**
 * Kesegaran data, bukan kesegaran latihan.
 *
 * Kartu ini menampilkan tanggal sesi terakhir dan berhenti di situ. Dari layar,
 * "Tuesday 8 September" tidak bisa dibedakan dari dua keadaan yang sangat
 * berbeda: seseorang memang belum berlatih sejak Selasa, atau ia sudah berlatih
 * tetapi datanya belum sampai. Keduanya terlihat persis sama.
 *
 * Yang kedua benar-benar terjadi dan memakan waktu pemakainya: ia berlari,
 * membuka Panacea, melihat tanggal lama, dan menyangka aplikasinya rusak.
 * Sesi latihan hanya masuk lewat otomatisasi Workouts di Health Auto Export
 * atau impor berkas; kalau otomatisasi itu tidak ada, tidak ada yang pernah
 * berangkat — bukan gagal di tengah jalan.
 *
 * Karena itu pita ini hanya muncul ketika jedanya sudah cukup panjang untuk
 * meragukan, dan ia tidak menuduh siapa pun: ia menyebut apa yang diketahui
 * ("ini yang terbaru yang diterima") lalu menunjukkan tempat memeriksanya.
 * Ambangnya dua hari supaya hari istirahat yang biasa tidak memicunya.
 */
const AMBANG_BASI_MS = 48 * 3600_000

function KesegaranData({ jedaMs }: { jedaMs: number | null }) {
  if (jedaMs === null || jedaMs < AMBANG_BASI_MS) return null
  const hari = Math.floor(jedaMs / 86400_000)
  return (
    <div className="mt-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2">
      <p className="text-[11px] leading-relaxed text-amber-200/90">
        This is the most recent session Panacea has <strong>received</strong> — {hari} days ago. If you have trained
        since, the data has not arrived yet.
      </p>
      <Link to="/health-data" className="mt-1 inline-block text-[11px] font-black text-[color:var(--pelatih-amber-2)] underline underline-offset-2">
        Check sync or import sessions →
      </Link>
    </div>
  )
}

function SejakTerakhir({ jedaMs, nama, mulai, kelelahanKini, proyeksi }: {
  jedaMs: number
  nama?: string
  mulai?: string
  kelelahanKini: number | null
  proyeksi: { hari: number; kelelahan: number | null }[]
}) {
  const baru = jedaMs < 86400_000
  return (
    <div className="mt-3 rounded-2xl bg-[var(--pelatih-alas-1)] p-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[11px] uppercase tracking-wide text-[color:var(--pelatih-teks-3)]">⏱ Since last session</span>
        <span className="text-[15px] font-black tabular-nums text-[color:var(--pelatih-teks-0)]">{lamanya(jedaMs)}</span>
      </div>
      {(nama || mulai) && (
        <p className="mt-0.5 text-[11px] text-[color:var(--pelatih-teks-3)]">
          {nama}{nama && mulai ? ' · ' : ''}{mulai ? kapan(mulai) : ''}
        </p>
      )}

      {kelelahanKini !== null && proyeksi.some((p) => p.kelelahan !== null) && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-[color:var(--pelatih-teks-3)]">Fatigue if you keep resting</div>
          <div data-proyeksi className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] tabular-nums">
            <span data-kel className="rounded-md bg-red-500/15 px-2 py-0.5 font-black text-red-300">{kelelahanKini}</span>
            <span className="text-[10px] text-[color:var(--pelatih-teks-3)]">kini</span>
            {proyeksi.map((p) => p.kelelahan === null ? null : (
              <span key={p.hari} className="flex items-center gap-1.5">
                <span className="text-slate-600">→</span>
                <span data-kel className="rounded-md bg-[var(--pelatih-alas-1)] px-2 py-0.5 font-bold text-[color:var(--pelatih-teks-1)]">{p.kelelahan}</span>
                <span className="text-[10px] text-[color:var(--pelatih-teks-3)]">+{p.hari}h</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Kelelahan meluruh dengan tetapan waktu 7 hari, jadi dua hari istirahat
          menurunkannya sekitar seperempat. Kalau angkanya tidak bergerak
          padahal sudah libur, sebabnya hampir selalu TANGGAL sesi -- sesi yang
          masuk dengan tanggal impor alih-alih tanggal latihan membuat setiap
          hari terhitung sebagai "latihan hari ini". */}
      {baru && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-300/80">
          Logged less than a day ago. If you're actually taking a rest day,
          the session date was recorded wrong — that's what's holding the fatigue number up.
        </p>
      )}
    </div>
  )
}