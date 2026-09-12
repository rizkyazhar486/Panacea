import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  konsentrasiPada, lintasan, ureaAkhir, rasioReduksiUrea, urrDariKtv,
  ktvLangsung, ktvDaugirdas, selisihKtv, klirensDialiser, volumePada,
  CATATAN_REBOUND, TOLERANSI_KTV, type SesiDialisis,
} from '../../lib/dialisis'

// Kinetika urea hemodialisis yang DIGAMBAR dan DIJALANKAN.
//
// Kt/V adalah angka yang dihafal semua orang dan diturunkan hampir tidak ada
// yang bisa. Yang membuatnya layak digambar, bukan ditabelkan: kurvanya
// MELANDAI. Jam pertama membuang urea jauh lebih banyak daripada jam keempat,
// bukan karena mesinnya melemah melainkan karena yang tersisa untuk dibuang
// makin sedikit. Itulah sebabnya menggandakan waktu tidak menggandakan hasil,
// dan itu tidak terbaca dari sederet angka.
//
// SATU SUMBER KEBENARAN. Kurva, penanda berjalan, dan setiap angka di panel ini
// keluar dari fungsi yang sama di src/lib/dialisis.ts. Kalau gambar dan angka
// berasal dari kode yang berbeda, gambarnya bisa berbohong sementara seluruh uji
// tetap hijau.
//
// BATAS: ini mekanisme, bukan pengobatan. Tidak ada resep, tidak ada dosis,
// tidak ada anjuran lama sesi, tidak ada ambang adekuasi klinis, dan tidak ada
// angka di sini yang berlaku untuk siapa pun.

const W = 320
const H = 200
const KIRI = 34
const BAWAH = 26

const QD_TETAP = 500

function Geser({ label, nilai, min, maks, langkah, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; langkah: number
  onUbah: (n: number) => void; satuan: string
}) {
  return (
    <div className="mt-2">
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{nilai} {satuan}</span>
      </label>
      <input type="range" min={min} max={maks} step={langkah} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label} className="mt-1 w-full accent-[#00BF63]" />
    </div>
  )
}

function Angka({ nilai, satuan, label }: { nilai: string; satuan?: string; label: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
      <div className="font-[var(--font-angka)] text-[17px] font-black leading-none tracking-tight text-ink dark:text-white">
        {nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}

function KurvaUrea({ sesi, menitBerjalan }: { sesi: SesiDialisis; menitBerjalan: number }) {
  const titik = lintasan(sesi, 96)
  const totalMenit = sesi.durasiJam * 60
  const ureaMaks = Math.max(sesi.ureaAwal, ...titik.map((t) => t.urea)) * 1.05

  const x = (menit: number) => KIRI + (menit / totalMenit) * (W - KIRI - 10)
  const y = (urea: number) => H - BAWAH - (urea / ureaMaks) * (H - BAWAH - 12)

  const jalur = titik
    .map((t, i) => `${i ? 'L' : 'M'}${x(t.menit).toFixed(1)} ${y(t.urea).toFixed(1)}`)
    .join(' ')

  const ureaSekarang = konsentrasiPada(sesi, Math.min(menitBerjalan, totalMenit))
  const akhir = ureaAkhir(sesi)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img"
      aria-label={`Urea concentration against session time. It starts at ${sesi.ureaAwal} and ends at ${akhir.toFixed(0)} milligrams per decilitre.`}>
      {/* Pita antara urea awal dan urea akhir: TINGGINYA adalah URR digambar. */}
      <rect x={KIRI} y={y(sesi.ureaAwal)} width={W - KIRI - 10}
        height={Math.max(y(akhir) - y(sesi.ureaAwal), 0)} fill="#00BF63" opacity={0.10} />

      <line x1={KIRI} y1={H - BAWAH} x2={W - 10} y2={H - BAWAH} stroke="currentColor" className="text-neutral-400" strokeWidth={1} />
      <line x1={KIRI} y1={12} x2={KIRI} y2={H - BAWAH} stroke="currentColor" className="text-neutral-400" strokeWidth={1} />
      <line x1={KIRI} y1={y(akhir)} x2={W - 10} y2={y(akhir)} stroke="currentColor"
        className="text-neutral-500" strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />

      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2} />

      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={x(totalMenit * f)} y={H - BAWAH + 13} textAnchor="middle"
          className="fill-neutral-500 text-[8px] font-bold">
          {(sesi.durasiJam * f).toFixed(f === 0 || f === 1 ? 0 : 1)}h
        </text>
      ))}
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 4} y={y(ureaMaks * f) + 3} textAnchor="end"
          className="fill-neutral-500 text-[8px] font-bold">
          {(ureaMaks * f).toFixed(0)}
        </text>
      ))}

      {/* Penanda berjalan: posisinya dibaca dari fungsi yang sama, bukan dari
          interpolasi jalur — kalau kurvanya salah, penandanya ikut salah. */}
      <line x1={x(Math.min(menitBerjalan, totalMenit))} y1={12} x2={x(Math.min(menitBerjalan, totalMenit))} y2={H - BAWAH}
        stroke="#00BF63" strokeWidth={1} opacity={0.35} />
      <circle cx={x(Math.min(menitBerjalan, totalMenit))} cy={y(ureaSekarang)} r={6} fill="#00BF63" opacity={0.25} />
      <circle cx={x(Math.min(menitBerjalan, totalMenit))} cy={y(ureaSekarang)} r={3.5} fill="#00BF63" />
    </svg>
  )
}

export function DialisisPanel() {
  const [qb, setQb] = useState(300)
  const [koa, setKoa] = useState(800)
  const [volumeAwal, setVolumeAwal] = useState(36)
  const [durasiJam, setDurasiJam] = useState(4)
  const [ultrafiltrasi, setUltrafiltrasi] = useState(2)
  const [generasi, setGenerasi] = useState(7)
  const [menit, setMenit] = useState(0)

  const klirens = klirensDialiser(qb, QD_TETAP, koa)
  const sesi: SesiDialisis = useMemo(
    () => ({ klirens, volumeAwal, durasiJam, generasi, ultrafiltrasi, ureaAwal: 120 }),
    [klirens, volumeAwal, durasiJam, generasi, ultrafiltrasi],
  )
  const totalMenit = durasiJam * 60

  // Sesi berjalan dengan LANGKAH WAKTU TETAP lewat setInterval, bukan
  // requestAnimationFrame. rAF di panel sebelah pernah hanya menjalankan satu
  // bingkai dan angkanya membeku sementara panelnya tetap terlihat hidup;
  // langkah tetap juga membuat lintasannya terulang sama di mesin cepat maupun
  // lambat, dan itulah yang membuat perilaku ini bisa diperiksa sama sekali.
  useEffect(() => {
    const jam = setInterval(() => {
      setMenit((m) => (m + 2 >= totalMenit ? 0 : m + 2))
    }, 80)
    return () => clearInterval(jam)
  }, [totalMenit])

  const ureaSekarang = konsentrasiPada(sesi, Math.min(menit, totalMenit))
  const akhir = ureaAkhir(sesi)
  const urr = rasioReduksiUrea(sesi)
  const ktvA = ktvLangsung(sesi)
  const ktvB = ktvDaugirdas(sesi)
  const beda = selisihKtv(sesi)
  const sepakat = Number.isFinite(beda) && beda <= TOLERANSI_KTV
  const volumeSekarang = volumePada(sesi, Math.min(menit, totalMenit)) / 1000

  // Identitas URR = 1 − e^(−Kt/V) hanya eksak tanpa UF dan tanpa generasi, jadi
  // panel ini menghitung kasus itu SECARA TERPISAH agar identitasnya bisa
  // diperlihatkan tanpa mengaburkan perbedaan dengan sesi yang sedang berjalan.
  const sesiMurni: SesiDialisis = { ...sesi, ultrafiltrasi: 0, generasi: 0 }
  const ktvMurni = ktvLangsung(sesiMurni)
  const urrMurni = rasioReduksiUrea(sesiMurni)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Urea kinetics across a dialysis session</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Urea removal is not a straight line. The first hour clears far more than the fourth, not
          because the dialyser tires but because less is left to remove — the driving concentration
          falls as fast as the machine works. Everything below is integrated from one mass balance:
          the dialyser removes urea in proportion to its concentration, the body keeps generating
          more, and ultrafiltration shrinks the volume the urea is dissolved in.
        </Prosa>
      </div>

      <KurvaUrea sesi={sesi} menitBerjalan={menit} />

      <div className="grid grid-cols-3 gap-2">
        <Angka nilai={(menit / 60).toFixed(2)} satuan="h" label="Elapsed" />
        <Angka nilai={ureaSekarang.toFixed(1)} satuan="mg/dL" label="Urea now" />
        <Angka nilai={volumeSekarang.toFixed(2)} satuan="L" label="Volume now" />
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-500">
        The session replays on a fixed time step, and the marker reads its position from the same
        function that draws the curve. Move any control and the whole trajectory is recomputed, not
        redrawn from a stored picture.
      </p>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">The dialyser</div>
        <Geser label="Blood flow" nilai={qb} min={150} maks={450} langkah={10} onUbah={setQb} satuan="mL/min" />
        <Geser label="Mass transfer coefficient KoA" nilai={koa} min={300} maks={1600} langkah={20} onUbah={setKoa} satuan="mL/min" />
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Clearance is computed from blood flow, dialysate flow (held at {QD_TETAP} mL/min) and KoA in
          counter-current: <span className="font-[var(--font-angka)] font-bold">{klirens.toFixed(0)} mL/min</span>.
          It can never exceed blood flow, however large KoA becomes — past a point the membrane stops
          being the limit and the pump is.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">The session</div>
        <Geser label="Session length" nilai={durasiJam} min={1} maks={6} langkah={0.25} onUbah={setDurasiJam} satuan="h" />
        <Geser label="Urea distribution volume" nilai={volumeAwal} min={20} maks={50} langkah={1} onUbah={setVolumeAwal} satuan="L" />
        <Geser label="Ultrafiltration over the session" nilai={ultrafiltrasi} min={0} maks={5} langkah={0.5} onUbah={setUltrafiltrasi} satuan="L" />
        <Geser label="Urea generation" nilai={generasi} min={0} maks={15} langkah={0.5} onUbah={setGenerasi} satuan="mg/min" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Angka nilai={Number.isFinite(ktvA) ? ktvA.toFixed(2) : '—'} label="Kt/V modelled" />
        <Angka nilai={Number.isFinite(ktvB) ? ktvB.toFixed(2) : '—'} label="Kt/V Daugirdas" />
        <Angka nilai={Number.isFinite(urr) ? (urr * 100).toFixed(1) : '—'} satuan="%" label="URR" />
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-500">
        Those first two are the same quantity reached two different ways. The left one is K·t divided
        by the post-dialysis volume — it only ever looks at the machine. The right one is the
        Daugirdas second-generation estimate, and it never sees clearance at all: it is built from the
        pre/post ratio the integration produced. They agree here to{' '}
        <span className="font-[var(--font-angka)] font-bold">{Number.isFinite(beda) ? beda.toFixed(3) : '—'}</span>,
        against a stated tolerance of {TOLERANSI_KTV.toFixed(2)} over the usual adequacy range.{' '}
        {sepakat
          ? 'They cannot agree unless the integration underneath is right, which is why this comparison is the panel’s strongest check.'
          : 'Outside that range they part company — the Daugirdas formula is a regression fit with a generation correction term, not an identity, and this setting is beyond where it was fitted.'}
      </p>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Where URR and Kt/V are the same statement</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Angka nilai={Number.isFinite(ktvMurni) ? ktvMurni.toFixed(3) : '—'} label="Kt/V, no UF, no generation" />
          <Angka nilai={Number.isFinite(urrMurni) ? (urrMurni * 100).toFixed(2) : '—'} satuan="%" label="URR integrated" />
          <Angka nilai={Number.isFinite(ktvMurni) ? (urrDariKtv(ktvMurni) * 100).toFixed(2) : '—'} satuan="%" label="1 − e^(−Kt/V)" />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Strip out ultrafiltration and generation and the two middle numbers are not merely close —
          they are the same number, because URR = 1 − e^(−Kt/V) is what the differential equation
          collapses to when the volume is fixed and no urea is made. Put either back and the identity
          breaks: generation holds the concentration up, and ultrafiltration concentrates what is left,
          so URR stops being a clean translation of Kt/V. That is the whole reason two routes to Kt/V
          exist at all.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">What this model cannot show</div>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">{CATATAN_REBOUND}</p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Mechanism, not treatment. Nothing here is a prescription, a dose, a recommended session
          length, or a clinical adequacy threshold, and no number on this panel applies to any person.
          A single pool is a drastic simplification: access recirculation and cardiopulmonary
          recirculation are both absent, urea is assumed to mix instantly, clearance is treated as
          constant for the whole session, and no solute other than urea is modelled. The starting
          concentration, the distribution volume and the generation rate are values you set, not
          measurements of anyone.
        </p>
      </Prosa>
    </div>
  )
}
