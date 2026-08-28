import { useEffect, useMemo, useRef } from 'react'
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
  kebugaranKardio, pemulihanDenyut, adaptasi, rekorPribadi, rekapBulanan, petakTahun,
} from '../lib/athlytic'
import { deretMetrik } from '../lib/riwayatVitals'
import { nilaiKebugaran, vo2DariDenyut } from '../lib/bugarIlmiah'

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

// Nilai `pita` dari bugarIlmiah adalah DATA berbahasa Indonesia yang dipakai
// juga di tempat lain; ia tidak diterjemahkan di sumbernya, melainkan
// dipetakan ke antarmuka di sini. Menerjemahkan nilainya sendiri akan
// mematahkan setiap perbandingan yang memakainya.
const PITA_EN: Record<string, string> = {
  'jauh di bawah': 'well below',
  'di bawah': 'below',
  sekitar: 'around',
  'di atas': 'above',
  'jauh di atas': 'well above',
}

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

  // Kisi setahun dibuka DIGULIR KE UJUNG KANAN.
  //
  // Urutan lama-ke-baru dari kiri ke kanan adalah kebiasaan yang sudah dikenal,
  // tetapi pada layar telepon ia berarti yang pertama terlihat adalah bulan
  // yang paling tidak menarik — dan pekan-pekan terakhir, satu-satunya bagian
  // yang benar-benar ingin dilihat orang, tersembunyi di luar layar.
  const kisi = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = kisi.current
    if (el) el.scrollLeft = el.scrollWidth
  })

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

    // VO2max: yang dilaporkan alat lebih dipercaya. Bila tidak ada, DIPERKIRAKAN
    // dari denyut maksimal dan denyut istirahat — dan sifat perkiraannya
    // dinyatakan di layar, bukan disembunyikan.
    let deretVo2 = deretMetrik('vo2max', 365)
    let vo2Perkiraan = false
    if (!deretVo2.length) {
      const p = vo2DariDenyut(k.hrMax, k.hrRest)
      if (p) {
        deretVo2 = [{ tanggal: new Date().toISOString().slice(0, 10), nilai: p.nilai }]
        vo2Perkiraan = true
      }
    }
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
      kardio: kebugaranKardio(deretVo2, usia, jk === 'F' ? 'P' : 'L', nilaiKebugaran, vo2Perkiraan),
      hrr: pemulihanDenyut(workouts),
      adaptasi: adaptasi(deretMetrik('hrvMs', 90), deretMetrik('restingHr', 90), 28),
      rekor: rekorPribadi(sesi),
      bulanan: rekapBulanan(sesi, 6, sekarang),
      tahun: petakTahun(sesi, sekarang),
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
  const { kardio, hrr, adaptasi: adap, rekor, bulanan, tahun } = data
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

      {/* ── Kebugaran kardio ─────────────────────────────────────────────── */}
      {kardio && (
        <Panel
          judul="Cardio fitness · VO₂max"
          nilai={kardio.kini}
          satuan={`ml/kg/min · typical for your age ${kardio.titikTengah}`}
          warna={kardio.selisihMet >= 0.75 ? NEON.hijau : kardio.selisihMet <= -0.75 ? NEON.merah : NEON.jingga}
          catatan={
            (kardio.perkiraan
              ? 'Estimated from your maximum and resting heart rate, not measured — it can differ from a lab test by over ten percent, and is most useful for watching direction rather than comparing with other people. '
              : '') +
            `You are ${PITA_EN[kardio.pita] ?? kardio.pita} the midpoint for your age and sex, by ${Math.abs(kardio.selisihMet).toFixed(1)} MET. Kodama 2009 puts each MET at a hazard ratio of 0.87 for all-cause mortality, which places you near ${kardio.hr.toFixed(2)} relative to that midpoint — a figure that applies to GROUPS, never to one person's future.`
          }
        >
          {/* Posisi terhadap titik tengah seusia, bukan terhadap pita tetap.
              VO2max 42 pada usia 25 dan pada usia 60 adalah dua hal yang sama
              sekali berbeda. */}
          <div className="relative mt-3 h-4 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
            <span className="absolute inset-y-0 w-px bg-neutral-400" style={{ left: '50%' }} />
            <span
              className="absolute inset-y-0 w-1 rounded-full"
              style={{
                left: `calc(${Math.min(97, Math.max(1, 50 + kardio.selisihMet * 12))}% - 2px)`,
                background: kardio.selisihMet >= 0 ? NEON.hijau : NEON.merah,
                boxShadow: `0 0 8px ${kardio.selisihMet >= 0 ? NEON.hijau : NEON.merah}`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-bold text-neutral-400">
            <span>−4 MET</span><span>age midpoint</span><span>+4 MET</span>
          </div>
          {kardio.delta != null && (
            <div className="mt-2 text-[11px] font-bold" style={{ color: kardio.delta >= 0 ? NEON.hijau : NEON.merah }}>
              {kardio.delta >= 0 ? '▲' : '▼'} {Math.abs(kardio.delta)} over 90 days
            </div>
          )}
        </Panel>
      )}

      {/* ── Pemulihan denyut ─────────────────────────────────────────────── */}
      {hrr && (
        <Panel
          judul="Heart-rate recovery · 1 min"
          nilai={hrr.rata}
          satuan={`bpm average · best ${hrr.terbaik} · ${hrr.jumlah} sessions`}
          warna={hrr.rata >= 18 ? NEON.hijau : hrr.rata >= 12 ? NEON.jingga : NEON.merah}
          catatan={hrr.baca}
        >
          <div className="mt-2 flex h-16 items-end gap-[3px]">
            {hrr.deret.map((d, i) => (
              <span
                key={`${d.tanggal}-${i}`}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${Math.max(4, Math.min(100, (d.nilai / Math.max(...hrr.deret.map((x) => x.nilai), 1)) * 100))}%`,
                  background: NEON.hijau,
                  boxShadow: `0 0 5px ${NEON.hijau}55`,
                }}
                title={`${d.tanggal}: −${d.nilai} bpm`}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* ── Adaptasi ─────────────────────────────────────────────────────── */}
      {adap && (
        <Panel judul="Training adaptation · 28 days" catatan={adap.baca}>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { l: 'HRV', v: adap.hrvRata, u: 'ms', d: adap.hrvArah, baikNaik: true, c: NEON.sian },
              { l: 'HRV stability', v: adap.hrvCov, u: '% CoV', d: null, baikNaik: false, c: NEON.ungu },
              { l: 'Resting HR', v: adap.rhrRata, u: 'bpm', d: adap.rhrArah, baikNaik: false, c: NEON.merah },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-white/60 p-2 text-center dark:bg-white/5">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{x.l}</div>
                <div className="text-[20px] font-black leading-none tabular-nums" style={{ color: x.c }}>
                  {x.v ?? '—'}
                </div>
                <div className="text-[9px] font-bold text-neutral-400">{x.u}</div>
                {x.d != null && Math.abs(x.d) >= 0.1 && (
                  <div
                    className="mt-0.5 text-[10px] font-black"
                    style={{ color: (x.d > 0) === x.baikNaik ? NEON.hijau : NEON.merah }}
                  >
                    {x.d > 0 ? '▲' : '▼'} {Math.abs(x.d)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-neutral-400">
            Stability is the coefficient of variation — the spread of your HRV as a share of your own average, so a
            person who normally sits at 90 ms is not called unstable simply because their numbers are bigger.
          </p>
        </Panel>
      )}

      {/* ── Rekor pribadi ────────────────────────────────────────────────── */}
      {rekor.length > 0 && (
        <Panel judul="Personal records" nilai={rekor.length} satuan="from your own logged sessions">
          <div className="mt-2 space-y-1.5">
            {rekor.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-2 rounded-xl bg-white/60 px-3 py-2 dark:bg-white/5">
                <span className="text-[11px] font-bold text-neutral-500">{r.label}</span>
                <span className="text-right">
                  <span className="block text-[15px] font-black leading-none tabular-nums text-ink dark:text-white">{r.nilai}</span>
                  <span className="text-[9px] font-bold text-neutral-400">{r.tanggal}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Rekap bulanan ────────────────────────────────────────────────── */}
      <Panel
        judul="Month over month"
        nilai={bulanan[bulanan.length - 1]?.sesi ?? 0}
        satuan="sessions this month"
        warna={NEON.jingga}
      >
        <div className="mt-2 space-y-1">
          {bulanan.map((b) => {
            const maks = Math.max(...bulanan.map((x) => x.beban), 1)
            return (
              <div key={b.bulan} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] font-bold text-neutral-400">{b.bulan}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(b.beban / maks) * 100}%`, background: NEON.jingga, boxShadow: `0 0 6px ${NEON.jingga}66` }}
                  />
                </span>
                {/* Satu baris, tanpa patah. Angka yang patah menjadi dua baris
                    membuat tinggi tiap baris berbeda-beda dan batangnya tidak
                    lagi dapat dibandingkan sekilas — padahal perbandingan
                    sekilas itulah seluruh gunanya. */}
                <span className="w-[74px] shrink-0 whitespace-nowrap text-right text-[10px] font-bold tabular-nums text-neutral-500">
                  {b.sesi}× · {Math.round(b.menit / 60)}h
                </span>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* ── Kisi setahun ─────────────────────────────────────────────────── */}
      <Panel
        judul="Your year"
        nilai={tahun.filter((d) => d.sesi > 0).length}
        satuan="days trained in the last 364"
        warna={NEON.hijau}
        catatan="One square per day. The gaps carry as much information as the streaks — most people find their year has a shape they did not know about."
      >
        {/* Petaknya 8 px, bukan 6. Pada 6 px seluruh kisi terbaca sebagai satu
            blok abu-abu di layar telepon — dan kisi yang tidak terbaca sama
            saja dengan kisi yang tidak ada. Lebar penuhnya digulir mendatar. */}
        <div ref={kisi} className="mt-2 overflow-x-auto">
          <div className="flex min-w-[470px] gap-[3px]">
            {Array.from({ length: 52 }, (_, w) => (
              <div key={w} className="flex flex-col gap-[2px]">
                {Array.from({ length: 7 }, (_, d) => {
                  const idx = w * 7 + d
                  const hari = tahun[idx]
                  if (!hari) return <span key={d} className="h-[8px] w-[8px]" />
                  const maks = Math.max(...tahun.map((x) => x.beban), 1)
                  const kuat = hari.beban / maks
                  return (
                    <span
                      key={d}
                      className="h-[8px] w-[8px] rounded-[2px]"
                      style={{
                        background: hari.beban === 0 ? 'rgba(120,120,120,0.16)' : NEON.hijau,
                        opacity: hari.beban === 0 ? 1 : 0.3 + kuat * 0.7,
                      }}
                      title={`${hari.tanggal}: ${hari.beban}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-neutral-400">less</span>
          {[0, 0.3, 0.55, 0.8, 1].map((o) => (
            <span
              key={o}
              className="h-[8px] w-[8px] rounded-[2px]"
              style={{ background: o === 0 ? 'rgba(120,120,120,0.16)' : NEON.hijau, opacity: o === 0 ? 1 : 0.3 + o * 0.7 }}
            />
          ))}
          <span className="text-[9px] font-bold text-neutral-400">more · swipe to see the whole year</span>
        </div>
      </Panel>

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
