import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from './ui'
import { IconRun, IconActivity, IconTimer } from './icons'
import type { ImportedWorkout } from '../lib/workoutImport'
import type { Konteks } from '../lib/trainingPhysiology'
import { debrief, saranBerikutnya, jadwalPekan, dukungan, statusSingkat } from '../lib/pelatih'
import { useJam } from '../lib/useJam'

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
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Coach · next</div>
            <div className="mt-0.5 text-[15px] font-black" style={{ color: saran.warna }}>{saran.judul}</div>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-400">{saran.isi}</p>
          </div>
          {status && (
            <div className="shrink-0 text-right">
              <div className="text-xl font-black tabular-nums" style={{ color: status.baca.warna }}>
                {Math.round(status.kesegaran)}
              </div>
              <div className="text-[9px] uppercase tracking-wide text-slate-500">Freshness</div>
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
      {/* 1. Apa berikutnya */}
      <Card>
        <SectionTitle icon={<IconRun />} title="Next session"
          subtitle="Built from your last session, how long ago it was, and the fatigue still with you" />
        <div className="mt-3 rounded-2xl p-4" style={{ background: `${saran.warna}14`, border: `1px solid ${saran.warna}33` }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-lg font-black" style={{ color: saran.warna }}>{saran.judul}</span>
            <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">{saran.kapan}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{saran.isi}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Basis: {saran.dasar}</p>
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
        {status && <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
          <b style={{ color: status.baca.warna }}>{status.baca.judul}.</b> {status.baca.arti}
        </p>}
      </Card>

      {/* 2. Rangkuman sesi terakhir */}
      {db && (
        <Card>
          <SectionTitle icon={<IconActivity />} title={db.judul}
            subtitle={terakhir ? new Date(terakhir.mulai).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : ''} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-[11px] font-black"
              style={{ background: `${db.klasifikasi.warna}22`, color: db.klasifikasi.warna }}>
              {db.klasifikasi.label}
            </span>
            {db.klasifikasi.yakin !== 'tinggi' && (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                confidence {db.klasifikasi.yakin}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{db.ringkas}</p>
          <div className="mt-3 space-y-1.5">
            {db.poin.map((p, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
                <span className="shrink-0 text-sm">{p.ikon}</span>
                <span className="text-[12px] leading-relaxed text-slate-300">{p.teks}</span>
              </div>
            ))}
          </div>
          {db.banding && (
            <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[12px] leading-relaxed text-slate-400">
              {db.banding}
            </p>
          )}
        </Card>
      )}

      {/* 3. Jadwal pekan */}
      <Card>
        <SectionTitle icon={<IconTimer />} title="This week’s plan"
          subtitle="Two quality sessions, one long, the rest easy — deliberately simple" />
        <div className="mt-3 space-y-1.5">
          {jadwal.map((h) => (
            <div key={h.tanggal}
              className={`flex items-start gap-3 rounded-xl px-3 py-2 ${h.sudah ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
              <div className="w-12 shrink-0">
                <div className="text-[11px] font-black text-slate-300">{h.hari.slice(0, 3)}</div>
                <div className="text-[9px] text-slate-500">{h.tanggal.slice(8)}/{h.tanggal.slice(5, 7)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold" style={{ color: h.warna }}>
                  {h.label}{h.sudah && <span className="ml-1.5 text-[10px] font-bold text-emerald-400">✓ session logged</span>}
                </div>
                <div className="text-[11px] leading-snug text-slate-500">{h.isi}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          This is an example of a balanced week, not an order. Move sessions to fit your days — what
          matters is the ratio: mostly easy, a little hard.
        </p>
      </Card>

      {/* 4. Dukungan */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="text-xl">{dk.nada === 'baik' ? '👏' : dk.nada === 'hati-hati' ? '⚠️' : '🫱'}</span>
          <div>
            <div className={`text-sm font-black ${dk.nada === 'baik' ? 'text-emerald-400' : dk.nada === 'hati-hati' ? 'text-amber-400' : 'text-slate-300'}`}>
              {dk.judul}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{dk.isi}</p>
          </div>
        </div>
      </Card>
    </>
  )
}

function Angka({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-2.5 text-center">
      <div className="text-lg font-black tabular-nums" style={{ color: warna }}>{nilai}</div>
      <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
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
  if (hari) return jam ? `${hari} hari ${jam} jam` : `${hari} hari`
  if (jam) return sisa ? `${jam} jam ${sisa} menit` : `${jam} jam`
  return `${sisa} menit`
}

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

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
function SejakTerakhir({ jedaMs, nama, mulai, kelelahanKini, proyeksi }: {
  jedaMs: number
  nama?: string
  mulai?: string
  kelelahanKini: number | null
  proyeksi: { hari: number; kelelahan: number | null }[]
}) {
  const baru = jedaMs < 86400_000
  return (
    <div className="mt-3 rounded-2xl bg-white/5 p-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">⏱ Sejak latihan terakhir</span>
        <span className="text-[15px] font-black tabular-nums text-slate-200">{lamanya(jedaMs)}</span>
      </div>
      {(nama || mulai) && (
        <p className="mt-0.5 text-[11px] text-slate-500">
          {nama}{nama && mulai ? ' · ' : ''}{mulai ? kapan(mulai) : ''}
        </p>
      )}

      {kelelahanKini !== null && proyeksi.some((p) => p.kelelahan !== null) && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Kelelahan bila terus istirahat</div>
          <div data-proyeksi className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] tabular-nums">
            <span data-kel className="rounded-md bg-red-500/15 px-2 py-0.5 font-black text-red-300">{kelelahanKini}</span>
            <span className="text-[10px] text-slate-500">kini</span>
            {proyeksi.map((p) => p.kelelahan === null ? null : (
              <span key={p.hari} className="flex items-center gap-1.5">
                <span className="text-slate-600">→</span>
                <span data-kel className="rounded-md bg-white/5 px-2 py-0.5 font-bold text-slate-300">{p.kelelahan}</span>
                <span className="text-[10px] text-slate-500">+{p.hari}h</span>
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
          Tercatat kurang dari sehari lalu. Kalau Anda sebenarnya sedang libur,
          tanggal sesinya salah tercatat — itu yang menahan angka kelelahan.
        </p>
      )}
    </div>
  )
}
