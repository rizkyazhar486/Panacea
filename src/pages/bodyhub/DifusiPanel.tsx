import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  TETAPAN_DIFUSI, RENTANG_DIFUSI, ZAT_RUJUKAN, waktuDifusi, fluksFick, deretWaktu,
} from '../../lib/difusi'

// Panel difusi untuk Body Exposure.
//
// Satu gambar yang menjelaskan kenapa jantung ada. Waktu difusi sebanding
// dengan KUADRAT jarak, jadi menggandakan jarak melipatempatkan waktunya --
// oksigen menyeberangi satu mikrometer dalam seperempat milidetik dan satu
// milimeter dalam empat menit. Tidak ada jumlah usaha yang memperbaikinya;
// satu-satunya jalan keluar adalah memindahkan cairannya, yaitu memompa.
//
// Kurvanya digambar pada sumbu LINEAR dengan sengaja: pada sumbu logaritmik
// parabola ini menjadi garis lurus dan pelajarannya hilang justru saat
// digambar.
//
// Setiap kurva ditarik oleh fungsi yang sama yang mencetak angkanya.

const W = 320
const H = 190
const KIRI = 44
const BAWAH = 26
const ATAS = 10
const KANAN = 8

function Geser({ label, nilai, min, maks, langkah = 1, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; langkah?: number
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
      <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tracking-tight">
        {nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}

/** Waktu ditulis pada satuan yang terbaca, tanpa mengarang ketelitian. */
function waktuTerbaca(detik: number): string {
  if (!Number.isFinite(detik)) return '—'
  if (detik < 1e-3) return `${(detik * 1e6).toFixed(0)} µs`
  if (detik < 1) return `${(detik * 1e3).toFixed(2)} ms`
  if (detik < 120) return `${detik.toFixed(1)} s`
  if (detik < 7200) return `${(detik / 60).toFixed(1)} min`
  if (detik < 172800) return `${(detik / 3600).toFixed(1)} h`
  return `${(detik / 86400).toFixed(0)} days`
}

function GrafikWaktu({ d, jarakUm }: { d: number; jarakUm: number }) {
  const deret = useMemo(() => deretWaktu(d, RENTANG_DIFUSI.jarakUm.maks), [d])
  const yMaks = Math.max(...deret.map((t) => t.detik), 1e-9)
  const x = (um: number) => KIRI + (um / RENTANG_DIFUSI.jarakUm.maks) * (W - KIRI - KANAN)
  const y = (s: number) => H - BAWAH - (s / yMaks) * (H - BAWAH - ATAS)
  const jalur = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.jarakUm).toFixed(1)} ${y(t.detik).toFixed(1)}`).join(' ')
  // Garis lurus dari titik awal ke titik akhir: pembanding yang membuat
  // lengkungannya TERLIHAT, bukan sekadar diklaim.
  const lurus = `M${x(0)} ${y(0)} L${x(RENTANG_DIFUSI.jarakUm.maks)} ${y(yMaks)}`
  const kini = waktuDifusi(jarakUm * 1e-6, d)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Diffusion time rising with the square of distance, curving away from a straight line">
      <line x1={KIRI} y1={H - BAWAH} x2={W - KANAN} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 5} y={y(yMaks * f) + 3} textAnchor="end"
          className="fill-current text-[8px] opacity-50">{waktuTerbaca(yMaks * f)}</text>
      ))}
      <path d={lurus} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      <circle cx={x(jarakUm)} cy={y(kini)} r={4} fill="#00BF63" />
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Distance (µm)
      </text>
      <text x={KIRI + 6} y={ATAS + 20} className="fill-current text-[8.5px] font-bold opacity-60">
        dashed = if it were linear
      </text>
    </svg>
  )
}

export function DifusiPanel() {
  const [zatId, setZatId] = useState<string>('o2')
  const [jarakUm, setJarakUm] = useState<number>(50)
  const [tebalUm, setTebalUm] = useState<number>(1)
  const [luas, setLuas] = useState<number>(70)

  const zat = ZAT_RUJUKAN.find((z) => z.id === zatId) ?? ZAT_RUJUKAN[0]
  const t = waktuDifusi(jarakUm * 1e-6, zat.d)
  const fluks = fluksFick({ luas, d: zat.d, bedaKonsentrasi: 0.05, tebal: tebalUm * 1e-6 })

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">Why you need a circulation</h3>
        <p className="text-[12px] leading-relaxed">
          Diffusion has no engine and cannot be hurried. The time it takes rises with the
          <em> square</em> of the distance, so doubling the distance does not double the
          wait — it quadruples it. That single fact is why every cell in the body sits
          within a few tens of micrometres of a capillary, and why anything thicker than a
          few layers of cells has no option but to pump. The curve below is drawn by the
          same functions that print the numbers.
        </p>
      </Prosa>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Distance is the whole story
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {ZAT_RUJUKAN.map((z) => (
            <button key={z.id} type="button" onClick={() => setZatId(z.id)}
              className={`rounded-xl px-2.5 py-1.5 text-[11px] font-black transition ${
                z.id === zatId ? 'bg-brand text-white' : 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.05))] text-ink dark:text-white'}`}>
              {z.nama}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={waktuTerbaca(t)} label={`${jarakUm} µm`} />
          <Angka nilai={waktuTerbaca(waktuDifusi(1e-3, zat.d))} label="1 mm" />
          <Angka nilai={waktuTerbaca(waktuDifusi(1, zat.d))} label="1 metre" />
        </div>

        <Geser label="Distance" nilai={jarakUm} min={RENTANG_DIFUSI.jarakUm.min} maks={RENTANG_DIFUSI.jarakUm.maks} onUbah={setJarakUm} satuan="µm" />
        <GrafikWaktu d={zat.d} jarakUm={jarakUm} />

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          The dashed line is what the wait would look like if it grew in proportion to
          distance. It does not. Crossing {jarakUm} µm takes {waktuTerbaca(t)}, but crossing
          twice that takes {waktuTerbaca(waktuDifusi(jarakUm * 2e-6, zat.d))} — four times as
          long, not twice. Stretch it to a millimetre and the wait is
          {' '}{waktuTerbaca(waktuDifusi(1e-3, zat.d))}; to a metre, and it is longer than a
          lifetime. Nothing about the molecule changes along that curve. Only the distance does.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Fick&rsquo;s law across a barrier
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Angka nilai={Number.isFinite(fluks) ? fluks.toExponential(2) : '—'} satuan="mol/s" label="Flux" />
          <Angka nilai={(luas / tebalUm).toFixed(0)} label="Area ÷ thickness" />
        </div>
        <Geser label="Barrier thickness" nilai={tebalUm} min={RENTANG_DIFUSI.tebalUm.min} maks={RENTANG_DIFUSI.tebalUm.maks} langkah={0.2} onUbah={setTebalUm} satuan="µm" />
        <Geser label="Exchange area" nilai={luas} min={RENTANG_DIFUSI.luasM2.min} maks={RENTANG_DIFUSI.luasM2.maks} onUbah={setLuas} satuan="m²" />
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Flux rises in proportion to area and falls in proportion to thickness — which is
          why the lung answers the same problem the opposite way from a single cell: it
          cannot shorten the distance below a fraction of a micrometre, so it makes the area
          enormous instead. Both levers are in this equation, and only one of them is free.
        </p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Mechanism only. Every figure is computed from values you supply — nothing is
          measured, nothing describes anyone&rsquo;s tissue, and no number here is a
          diagnosis or a clinical threshold. The model is one-dimensional diffusion through
          a uniform medium with a fixed concentration difference: no blood flow, no binding
          to haemoglobin, no metabolism consuming the substance on the way, no membranes or
          transporters, and no geometry beyond a flat sheet. <strong>The diffusion
          coefficients are free-diffusion values and do not include solubility</strong>,
          which matters in one place especially: carbon dioxide appears slower than oxygen
          here, whereas its real transfer through tissue is much faster because it is far
          more soluble — that behaviour is governed by the Krogh coefficient (D × solubility),
          which this model does not carry. The ordering shown is therefore a statement about
          free diffusion, not about gas exchange.
        </p>
      </Prosa>
    </div>
  )
}
