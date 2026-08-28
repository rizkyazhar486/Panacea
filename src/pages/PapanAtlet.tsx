import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SectionTitle } from '../components/ui'
import { IconActivity } from '../components/icons'
import { useJam } from '../lib/useJam'
import { getWorkouts } from '../lib/workoutStore'
import { getDemo } from '../lib/profile'
import { getVitals } from '../lib/healthVitals'
import { hrMaxFromAge } from '../lib/workoutImport'
import { kebugaranKesegaran } from '../lib/analisisPro'
import { ringkasBeban, statusLatihan } from '../lib/trainingPhysiology'
import {
  siapkan, bebanHarian, rentangBeban, fokusBeban, kapanBerlatih,
  bebanPekanan, upayaLawanPemulihan, dampakBeban, pemulihanHarian,
} from '../lib/athlytic'

// ─────────────────────────────────────────────────────────────────────────────
// Papan atlet — beranda angka, bukan beranda kalimat.
//
// Permintaannya jelas: lebih banyak grafik dan angka, lebih sedikit tulisan,
// dan tampilan yang lebih terang. Halaman ini menjawabnya dengan panel-panel
// yang tiap satunya menjawab SATU pertanyaan dan menjawabnya dengan bentuk,
// bukan dengan paragraf.
//
// SETIAP PANEL DAPAT MENGHILANG SENDIRI. Bila datanya belum cukup untuk
// menjawab pertanyaannya, panel itu tidak digambar — bukan digambar kosong dan
// bukan diisi angka bawaan. Papan yang penuh dengan nol terlihat seperti
// aplikasi yang rusak, dan yang lebih buruk: nol yang terlihat seperti hasil
// pengukuran akan dipercaya.
//
// WARNA DIPAKAI SEBAGAI KODE, BUKAN HIASAN. Warna yang sama berarti hal yang
// sama di seluruh aplikasi — biru kebugaran, merah kelelahan, hijau segar,
// jingga upaya.
// ─────────────────────────────────────────────────────────────────────────────

const NEON = {
  biru: '#38bdf8',
  merah: '#fb7185',
  hijau: '#34d399',
  jingga: '#fbbf24',
  ungu: '#a78bfa',
  sian: '#22d3ee',
}

function Panel({
  judul, nilai, satuan, warna, catatan, children,
}: {
  judul: string
  nilai?: string | number
  satuan?: string
  warna?: string
  catatan?: string
  children?: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-neutral-200/70 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
      {/* Judul dan angka DITUMPUK, tidak disandingkan.
          Pada 390 px, judul panjang di kiri dan angka bersatuan di kanan
          saling mendorong sampai keduanya patah menjadi dua baris yang
          bersilangan — angka besar berakhir di tengah kalimat judulnya. */}
      <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">{judul}</h2>
      {nilai !== undefined && (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums" style={{ color: warna ?? undefined }}>
            {nilai}
          </span>
          {satuan && <span className="text-[10px] font-bold text-neutral-400">{satuan}</span>}
        </div>
      )}
      {children}
      {catatan && <p className="mt-2 text-[11px] leading-snug text-neutral-500">{catatan}</p>}
    </section>
  )
}

export function PapanAtlet() {
  const sekarang = useJam()

  const data = useMemo(() => {
    const workouts = getWorkouts()
    if (workouts.length < 3) return null
    const demo = getDemo()
    const usia = demo.age > 0 ? demo.age : 30
    const jk: 'M' | 'F' = demo.sex === 'F' ? 'F' : 'M'
    const v = getVitals()
    const k = {
      hrMax: workouts.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0) || hrMaxFromAge(usia, jk),
      hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
      sex: jk,
    }
    const sesi = siapkan(workouts, k)
    const ff = kebugaranKesegaran(workouts, k, 90, sekarang)
    const kini = ff.length ? ff[ff.length - 1] : null
    const b = ringkasBeban(sesi, sekarang)
    const pemulihan = pemulihanHarian(90)
    const pasangan = upayaLawanPemulihan(sesi, pemulihan, 60, sekarang)
    return {
      sesi,
      kini,
      ff,
      beban: b,
      status: statusLatihan(b, null),
      harian: bebanHarian(sesi, 30, sekarang),
      rentang: rentangBeban(sesi, sekarang),
      fokus: fokusBeban(sesi, sekarang),
      kapan: kapanBerlatih(sesi),
      pekanan: bebanPekanan(sesi, 12, sekarang),
      pasangan,
      dampak: dampakBeban(pasangan),
    }
  }, [sekarang])

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pb-24">
        <SectionTitle icon={<IconActivity size={20} />} title="Athlete board" subtitle="Load, ratio, focus, and when you train" />
        <p className="rounded-2xl border border-neutral-200 p-4 text-[13px] leading-relaxed text-neutral-500 dark:border-white/10">
          Needs at least three sessions with heart-rate data. Nothing is drawn from fewer — a board full of zeros
          reads as a broken app, and zeros that look like measurements get believed.
        </p>
      </div>
    )
  }

  const { harian, rentang, fokus, kapan, pekanan, pasangan, dampak, kini, beban, status } = data
  const maksHarian = Math.max(...harian.map((d) => d.beban), 1)
  const maksPekan = Math.max(...pekanan.map((p) => p.beban), 1)
  const acwr = beban.acwr

  return (
    <div className="mx-auto max-w-2xl space-y-3 pb-24">
      <SectionTitle icon={<IconActivity size={20} />} title="Athlete board" subtitle="Load, ratio, focus, and when you train" />

      {/* ── Tiga angka utama ─────────────────────────────────────────────── */}
      {kini && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: 'Fit', v: Math.round(kini.kebugaran), c: NEON.biru },
            { l: 'Tired', v: Math.round(kini.kelelahan), c: NEON.merah },
            { l: 'Fresh', v: Math.round(kini.kesegaran), c: NEON.hijau },
          ].map((x) => (
            <div
              key={x.l}
              className="rounded-2xl border p-3 text-center"
              style={{ borderColor: `${x.c}55`, background: `${x.c}14` }}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-neutral-400">{x.l}</div>
              <div className="text-[26px] font-black leading-none tabular-nums" style={{ color: x.c }}>
                {x.v > 0 && x.l === 'Fresh' ? '+' : ''}{x.v}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Beban 30 hari dengan pita rentang ────────────────────────────── */}
      <Panel
        judul="Training load · 30 days"
        nilai={rentang.akut}
        satuan={`this week · usual ${rentang.bawah}-${rentang.atas}`}
        warna={rentang.posisi === 'di dalam' ? NEON.hijau : rentang.posisi === 'di atas' ? NEON.merah : NEON.jingga}
        catatan={
          rentang.dapatDipercaya
            ? `Your week sits ${rentang.posisi === 'di dalam' ? 'inside' : rentang.posisi === 'di atas' ? 'above' : 'below'} the band drawn from your own 28-day load. The band is not a fixed number — a load that is optimal for a marathoner injures someone starting out.`
            : `Only ${rentang.hariData} days of history. The band is drawn but should not be trusted yet — it needs about 28 days.`
        }
      >
        <div className="mt-2 flex h-24 items-end gap-[2px]">
          {harian.map((d) => (
            <span
              key={d.tanggal}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${Math.max(2, (d.beban / maksHarian) * 100)}%`,
                background: d.beban === 0 ? 'rgba(120,120,120,0.18)' : NEON.jingga,
                boxShadow: d.beban > 0 ? `0 0 6px ${NEON.jingga}66` : undefined,
              }}
              title={`${d.tanggal}: ${d.beban}`}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-bold text-neutral-400">
          <span>30 days ago</span>
          <span>today</span>
        </div>
      </Panel>

      {/* ── Nisbah beban ─────────────────────────────────────────────────── */}
      {acwr != null && (
        <Panel
          judul="Load ratio · 7 vs 28 days"
          nilai={acwr.toFixed(2)}
          warna={acwr > 1.5 ? NEON.merah : acwr >= 0.8 && acwr <= 1.3 ? NEON.hijau : NEON.jingga}
          catatan={
            beban.acwrDapatDipercaya
              ? 'Between 0.8 and 1.3 is where load is rising without outrunning what you have absorbed. Above 1.5 is where injury risk climbs in the studies this comes from.'
              : `Only ${beban.rentangHariData} days of history — someone who has just started always shows a high ratio because the divisor is near zero, not because they are overtraining.`
          }
        >
          <div className="relative mt-3 h-4 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
            <span className="absolute inset-y-0" style={{ left: '40%', width: '25%', background: `${NEON.hijau}44` }} />
            <span
              className="absolute inset-y-0 w-1 rounded-full"
              style={{
                left: `calc(${Math.min(100, Math.max(0, (acwr / 2) * 100))}% - 2px)`,
                background: acwr > 1.5 ? NEON.merah : NEON.hijau,
                boxShadow: `0 0 8px ${acwr > 1.5 ? NEON.merah : NEON.hijau}`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-bold text-neutral-400">
            <span>0</span><span>0.8</span><span>1.3</span><span>2.0</span>
          </div>
        </Panel>
      )}

      {/* ── Fokus intensitas ─────────────────────────────────────────────── */}
      {fokus && (
        <Panel judul="Load focus · 28 days" nilai={`${fokus.totalMenit}`} satuan="min" catatan={fokus.baca}>
          <span className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
            {[
              { p: fokus.rendah, c: NEON.hijau },
              { p: fokus.tinggi, c: NEON.jingga },
              { p: fokus.anaerobik, c: NEON.merah },
            ].map((x, i) => (
              <span key={i} style={{ width: `${x.p}%`, background: x.c, boxShadow: `0 0 8px ${x.c}55` }} />
            ))}
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {[
              { l: 'Low aerobic', v: fokus.rendah, c: NEON.hijau },
              { l: 'High aerobic', v: fokus.tinggi, c: NEON.jingga },
              { l: 'Anaerobic', v: fokus.anaerobik, c: NEON.merah },
            ].map((x) => (
              <div key={x.l}>
                <div className="text-[18px] font-black leading-none tabular-nums" style={{ color: x.c }}>{x.v}%</div>
                <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-400">{x.l}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Beban pekanan ────────────────────────────────────────────────── */}
      <Panel
        judul="Weekly load · 12 weeks"
        nilai={pekanan[pekanan.length - 1]?.beban ?? 0}
        satuan="this week"
        warna={NEON.sian}
        catatan="A saw-tooth — three weeks up, one week down — is the shape that builds. A flat line maintains."
      >
        <div className="mt-2 flex h-20 items-end gap-1">
          {pekanan.map((p, i) => (
            <span
              key={p.mulai}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${Math.max(2, (p.beban / maksPekan) * 100)}%`,
                background: i === pekanan.length - 1 ? NEON.sian : `${NEON.sian}77`,
                boxShadow: i === pekanan.length - 1 ? `0 0 8px ${NEON.sian}` : undefined,
              }}
              title={`${p.label}: ${p.beban} (${p.sesi} sessions, ${p.menit} min)`}
            />
          ))}
        </div>
      </Panel>

      {/* ── Kapan berlatih ───────────────────────────────────────────────── */}
      {kapan.puncak && (
        <Panel
          judul="When you train"
          nilai={`${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][kapan.puncak.hari]} ${String(kapan.puncak.jam).padStart(2, '0')}:00`}
          warna={NEON.ungu}
          catatan="Every session you have logged, by day and hour. Regular training times are one of the few habits that predict whether a plan survives."
        >
          <div className="mt-3 overflow-x-auto">
            <div className="min-w-[320px]">
              {[0, 1, 2, 3, 4, 5, 6].map((hari) => (
                <div key={hari} className="flex items-center gap-1">
                  <span className="w-7 shrink-0 text-[9px] font-bold text-neutral-400">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][hari]}
                  </span>
                  <div className="flex flex-1 gap-[2px]">
                    {Array.from({ length: 24 }, (_, jam) => {
                      const n = kapan.sel.find((s) => s.hari === hari && s.jam === jam)?.jumlah ?? 0
                      const kuat = kapan.puncak ? n / kapan.puncak.jumlah : 0
                      return (
                        <span
                          key={jam}
                          className="h-3 flex-1 rounded-[2px]"
                          style={{
                            background: n === 0 ? 'rgba(120,120,120,0.14)' : NEON.ungu,
                            opacity: n === 0 ? 1 : 0.35 + kuat * 0.65,
                          }}
                          title={`${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][hari]} ${jam}:00 — ${n}`}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-1 flex justify-between pl-8 text-[9px] font-bold text-neutral-400">
                <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* ── Upaya lawan pemulihan ────────────────────────────────────────── */}
      {pasangan.length >= 8 && (
        <Panel
          judul="Effort vs next-morning recovery"
          nilai={pasangan.length}
          satuan="pairs"
          warna={NEON.sian}
          catatan={
            dampak
              ? `After your harder half of days, recovery averaged ${dampak.hariBeban}; after the easier half, ${dampak.hariSantai} — a difference of ${dampak.selisih} across ${dampak.pasangan} pairs. This is a comparison, not a cause: sleep, alcohol and illness move the same number.`
              : 'Each dot is one day of training against the recovery reported the next morning. More pairs are needed before any average is worth stating.'
          }
        >
          <div className="relative mt-3 h-32 rounded-xl bg-neutral-100 dark:bg-white/5">
            {/* Sumbu tegak diberi angka. Sebaran titik tanpa satu pun angka di
                tepinya hanya menunjukkan ADA hubungan, bukan seberapa besar. */}
            <span className="absolute left-1 top-0.5 text-[9px] font-bold text-neutral-400">100</span>
            <span className="absolute bottom-0.5 left-1 text-[9px] font-bold text-neutral-400">0</span>
            <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-neutral-300/60 dark:border-white/10" />
            {pasangan.map((p) => {
              const maxB = Math.max(...pasangan.map((x) => x.beban), 1)
              return (
                <span
                  key={p.tanggal}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    left: `${(p.beban / maxB) * 92 + 3}%`,
                    bottom: `${Math.min(96, Math.max(2, p.pemulihan))}%`,
                    background: NEON.sian,
                    boxShadow: `0 0 6px ${NEON.sian}`,
                  }}
                  title={`${p.tanggal}: load ${p.beban} → recovery ${p.pemulihan}`}
                />
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-bold text-neutral-400">
            <span>rest day → hardest day</span>
            <span>vertical: recovery next morning</span>
          </div>
        </Panel>
      )}

      {/* ── Status ───────────────────────────────────────────────────────── */}
      <Panel judul="Training status" nilai={status.label} warna={status.warna} catatan={status.saran}>
        <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-300">{status.penjelasan}</p>
      </Panel>

      <Link
        to="/how-numbers-work"
        className="flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 text-[12px] font-bold text-brand dark:border-white/10"
      >
        What each number reads, and what moves it →
      </Link>
    </div>
  )
}

export default PapanAtlet
