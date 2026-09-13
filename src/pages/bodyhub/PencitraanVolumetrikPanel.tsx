import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Prosa } from '../../components/Prosa'
import { JENDELA_CT } from '../../lib/dicom'
import {
  TITIK_KALIBRASI_HU, KELAS_JARINGAN, CARA_RENDER,
  lebarJendela, levelJendela, kelasDalamJendela, cakupanKelas, keabuan,
} from '../../lib/pencitraanVolumetrik'
import { KALOLUMEN, YANG_BELUM_DIMILIKI_PANACEA } from '../../lib/rujukanKaloLumen'

// Panel teknologi pencitraan volumetrik untuk Body Exposure.
//
// Yang menentukan isi sebuah rekonstruksi 3D dari CT bukan kecanggihan
// perangkat lunaknya, melainkan satu keputusan: AMBANG HOUNSFIELD mana yang
// dipilih. Itu pernyataan tentang angka, jadi di sini ia BISA DIGESER, dan
// yang muncul serta yang hilang dihitung dari rentang HU rujukan.

function Geser({ label, nilai, min, maks, langkah, onUbah }: {
  label: string; nilai: number; min: number; maks: number; langkah: number; onUbah: (n: number) => void
}) {
  return (
    <label className="mt-2 block">
      <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] tabular-nums text-neutral-500">{nilai} HU</span>
      </span>
      <input
        type="range" min={min} max={maks} step={langkah} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label}
        className="mt-1 h-11 w-full accent-[#00BF63]"
      />
    </label>
  )
}

export function PencitraanVolumetrikPanel() {
  const [bawah, setBawah] = useState(300)
  const [atas, setAtas] = useState(1900)

  const jendela = useMemo(() => ({ bawah: Math.min(bawah, atas - 1), atas: Math.max(atas, bawah + 1) }), [bawah, atas])
  const terlihat = useMemo(() => kelasDalamJendela(jendela), [jendela])

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">From a DICOM stack to a 3D body</h3>
        <p className="text-[12px] leading-relaxed">
          A CT scan is not a picture. It is a grid of numbers on the <strong>Hounsfield scale</strong>, and that
          scale is defined rather than measured: air is exactly {TITIK_KALIBRASI_HU.udara} HU and water is
          exactly {TITIK_KALIBRASI_HU.air} HU, by calibration. Turning that grid into something you can rotate
          takes one decision that matters more than any other — <strong>which HU range you keep</strong>.
        </p>
      </Prosa>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Choose the window, and you choose the anatomy
        </div>

        <Geser label="Lower threshold" nilai={bawah} min={-1400} maks={2900} langkah={1} onUbah={setBawah} />
        <Geser label="Upper threshold" nilai={atas} min={-1390} maks={3000} langkah={1} onUbah={setAtas} />

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
            <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tabular-nums">
              {lebarJendela(jendela)}<span className="ml-1 text-[10px] font-bold opacity-60">HU</span>
            </div>
            <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">Window width</div>
          </div>
          <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
            <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tabular-nums">
              {levelJendela(jendela)}<span className="ml-1 text-[10px] font-bold opacity-60">HU</span>
            </div>
            <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">Window level</div>
          </div>
        </div>

        <svg viewBox="0 0 320 44" className="mt-3 w-full" role="img"
          aria-label="Grey-scale ramp showing that values below the lower threshold are all black and values above the upper threshold are all white">
          {Array.from({ length: 64 }, (_, i) => {
            const hu = -1000 + (i / 63) * 4000
            const g = keabuan(hu, jendela)
            const v = Math.round(g * 255)
            return <rect key={i} x={i * 5} y={0} width={5} height={26} fill={`rgb(${v},${v},${v})`} />
          })}
          <text x={0} y={40} className="fill-current text-[8px] font-bold opacity-60">−1000 HU</text>
          <text x={320} y={40} textAnchor="end" className="fill-current text-[8px] font-bold opacity-60">+3000 HU</text>
        </svg>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Everything below the lower threshold collapses to one black, and everything above the upper
          threshold collapses to one white. That is not a display setting you can undo later — the
          distinctions outside the window are gone from the rendered image.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          The windows radiology actually uses
        </div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          These are the presets Panacea's own DICOM viewer applies, with the same centre and width.
          Tap one to move the sliders above to it — the difference between grey and white matter is
          about 10 HU inside a 4000 HU range, which is why a narrow window is not fussiness.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {JENDELA_CT.map((w) => {
            const b = w.pusat - w.lebar / 2
            const a = w.pusat + w.lebar / 2
            const aktif = Math.abs(b - jendela.bawah) < 1 && Math.abs(a - jendela.atas) < 1
            return (
              <button
                key={w.nama}
                type="button"
                title={w.catatan}
                aria-pressed={aktif}
                onClick={() => { setBawah(Math.round(b)); setAtas(Math.round(a)) }}
                className={`min-h-11 rounded-full border px-3 text-[11px] font-bold ${
                  aktif ? 'border-brand bg-brand text-white' : 'border-neutral-300/70 text-neutral-600 dark:border-white/15 dark:text-neutral-300'
                }`}
              >
                {w.nama}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-500">
          Hounsfield presets are offered for CT only. On MR the pixel values have no absolute unit, so
          the same number does not mean the same tissue and these windows would be meaningless there.
        </p>
      </div>

      <div className="rounded-2xl border border-brand/30 bg-brand/[.06] p-3.5">
        <div className="text-[10px] font-black uppercase tracking-[.14em] text-brand">
          Open your own study
        </div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">
          Everything above is a reference scale. Panacea can also read an actual DICOM study — the
          window you just chose is the same one its viewer applies, using the linear window formula
          from the DICOM standard rather than stretching each image to look good.
        </p>
        <Link
          to="/radiology"
          className="mt-2.5 flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-black text-white"
        >
          Open the DICOM viewer
        </Link>
        <ul className="mt-2.5 space-y-1 text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">
          <li>· Files are read <strong>inside this browser</strong>. Pixel data is never uploaded.</li>
          <li>· Uncompressed DICOM only. JPEG, JPEG 2000, RLE and deflated studies are <strong>refused by name</strong> rather than decoded wrongly.</li>
          <li>· Single-channel CT, MR, CR and DX. Colour images are refused.</li>
          <li>· Educational and research use. It is not a diagnostic workstation, and nothing it shows is a clinical report.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          What this window would keep
        </div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {terlihat.length === 0
            ? 'Nothing. An empty or inverted window keeps no tissue class at all.'
            : `${terlihat.length} of ${KELAS_JARINGAN.length} reference tissue classes fall wholly or partly inside it.`}
        </p>
        <ul className="mt-2 space-y-1.5">
          {KELAS_JARINGAN.map((k) => {
            const bagian = cakupanKelas(k, jendela)
            const penuh = bagian >= 0.999
            return (
              <li key={k.nama} className={`rounded-xl px-3 py-2 ${bagian > 0 ? 'bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))]' : 'opacity-45'}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-black text-ink dark:text-white">{k.nama}</span>
                  <span className="font-[var(--font-angka)] text-[10px] font-bold tabular-nums text-neutral-500">
                    {k.min} … {k.maks} HU · {bagian === 0 ? 'outside' : penuh ? 'fully inside' : `${Math.round(bagian * 100)}% inside`}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">{k.catatan}</p>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-500">
          These ranges are ordinary CT-physics reference figures, not measurements from anyone. They
          overlap on purpose: muscle, kidney, unclotted blood and grey matter genuinely share a band,
          which is exactly why one threshold never separates tissues cleanly.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Two renderings, not two styles
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CARA_RENDER.map((r) => (
            <div key={r.cara} className="rounded-xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
              <div className="text-xs font-black text-ink dark:text-white">{r.judul}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{r.bagaimana}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">Strength · {r.kuat}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">Limit · {r.lemah}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[.06] p-3.5">
        <div className="text-[10px] font-black uppercase tracking-[.14em] text-sky-700 dark:text-sky-300">
          Reference · not an integration
        </div>
        <h3 className="mt-1 text-sm font-black text-ink dark:text-white">
          {KALOLUMEN.nama} — {KALOLUMEN.penulis}
        </h3>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Panacea studies this work as a reference for what a DICOM-to-3D pipeline can expose to a
          user. The points below are what its author states or what is legible in its own interface
          — <strong>none of them were re-measured by Panacea</strong>.
        </p>
        <ul className="mt-2 space-y-1">
          {KALOLUMEN.klaim.map((k) => (
            <li key={k.klaim} className="rounded-lg bg-white/60 px-3 py-2 text-[11.5px] leading-relaxed text-neutral-700 dark:bg-white/[.05] dark:text-neutral-200">
              {k.klaim}
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                · {k.asal === 'dinyatakan penulis' ? 'stated by the author' : 'legible in the interface'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Thresholds read from that interface show the same point this panel makes with its slider:
          bone was taken at {KALOLUMEN.ambangTerbaca[0].bawah}–{KALOLUMEN.ambangTerbaca[0].atas} HU in one
          study and {KALOLUMEN.ambangTerbaca[1].bawah}–{KALOLUMEN.ambangTerbaca[1].atas} HU in another. The
          window is chosen per study, not fixed.
        </p>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11.5px] font-bold leading-relaxed text-amber-800 dark:text-amber-200">
          Its author's own boundary, carried here unchanged: “{KALOLUMEN.batasPenulis}”
        </p>
        <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          Licensing for that software is <strong>unresolved</strong> from Panacea's side, so it is
          recorded as unresolved rather than assumed to be usable.
        </p>
      </div>

      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[.05] p-3.5">
        <div className="text-[10px] font-black uppercase tracking-[.14em] text-rose-700 dark:text-rose-300">
          What Panacea does not do here
        </div>
        <ul className="mt-1.5 space-y-1.5">
          {YANG_BELUM_DIMILIKI_PANACEA.map((b) => (
            <li key={b} className="text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">· {b}</li>
          ))}
        </ul>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          One correction worth stating, because the same word appears in both places: MRI signal
          intensity is <em>not</em> calibrated in Hounsfield units. HU is defined by X-ray attenuation
          against water and air; MRI intensity depends on sequence, coil and scaling, so a threshold on
          MRI is relative to that series and cannot be compared between studies the way an HU value can.
          The window above is a CT construct and is presented as one.
        </p>
      </Prosa>
    </div>
  )
}

export default PencitraanVolumetrikPanel
