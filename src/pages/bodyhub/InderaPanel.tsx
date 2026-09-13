import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  RENTANG_INDERA, titikDekat, amplitudoLazimUsia, energiFotonEv,
  tingkatTekanan, tekananDariDb, jumlahSumber, deretTitikDekat, deretTekanan,
} from '../../lib/inderaOptikAkustik'

// Panel optika akomodasi + skala desibel untuk Body Exposure.
//
// Dua indera, satu pelajaran: perubahan yang linear pada skala yang DIUKUR
// tidak linear pada skala yang DIALAMI. Mata dicatat dalam dioptri, yang
// linear; yang dialami adalah jarak, yang merupakan kebalikannya. Telinga
// dicatat dalam desibel, yang logaritmik; yang sampai ke gendang telinga
// adalah tekanan.
//
// Keduanya digambar karena keduanya adalah pernyataan tentang BENTUK.
//
// Setiap kurva ditarik oleh fungsi yang sama yang mencetak angkanya.

const W = 320
const H = 190
const KIRI = 40
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

/** Gambar pertama: amplitudo lurus, titik dekat melengkung. */
function GrafikAkomodasi({ usia }: { usia: number }) {
  const deret = useMemo(() => deretTitikDekat(RENTANG_INDERA.usia.min, RENTANG_INDERA.usia.maks), [])
  const yMaksCm = 120
  const x = (u: number) => KIRI + ((u - RENTANG_INDERA.usia.min) / (RENTANG_INDERA.usia.maks - RENTANG_INDERA.usia.min)) * (W - KIRI - KANAN)
  const y = (cm: number) => H - BAWAH - (Math.min(cm, yMaksCm) / yMaksCm) * (H - BAWAH - ATAS)
  const yAmp = (d: number) => H - BAWAH - (d / RENTANG_INDERA.amplitudo.maks) * (H - BAWAH - ATAS)

  const jalurJarak = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.usia).toFixed(1)} ${y(t.titikDekatCm).toFixed(1)}`).join(' ')
  const jalurAmp = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.usia).toFixed(1)} ${yAmp(t.amplitudo).toFixed(1)}`).join(' ')
  const amp = amplitudoLazimUsia(usia)
  const jarak = titikDekat(amp)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Accommodative amplitude falling in a straight line while the near point recedes along a curve">
      <line x1={KIRI} y1={H - BAWAH} x2={W - KANAN} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 5} y={y(yMaksCm * f) + 3} textAnchor="end"
          className="fill-current text-[8px] opacity-50">{(yMaksCm * f).toFixed(0)}</text>
      ))}
      <path d={jalurAmp} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" />
      <path d={jalurJarak} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      <circle cx={x(usia)} cy={yAmp(amp)} r={3} fill="#94a3b8" />
      {Number.isFinite(jarak) && <circle cx={x(usia)} cy={y(jarak * 100)} r={4} fill="#00BF63" />}
      <text x={KIRI + 4} y={ATAS + 9} className="fill-current text-[8.5px] font-bold opacity-60">cm</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">Age (years)</text>
      <text x={KIRI + 4} y={yAmp(amplitudoLazimUsia(RENTANG_INDERA.usia.min)) - 5}
        className="fill-current text-[8.5px] font-bold opacity-60">dioptres (straight)</text>
    </svg>
  )
}

/** Gambar kedua: tekanan terhadap desibel. */
function GrafikDesibel({ db }: { db: number }) {
  const deret = useMemo(() => deretTekanan(RENTANG_INDERA.db.min, RENTANG_INDERA.db.maks), [])
  const maks = tekananDariDb(RENTANG_INDERA.db.maks)
  const x = (d: number) => KIRI + ((d - RENTANG_INDERA.db.min) / (RENTANG_INDERA.db.maks - RENTANG_INDERA.db.min)) * (W - KIRI - KANAN)
  const y = (p: number) => H - BAWAH - (p / maks) * (H - BAWAH - ATAS)
  const jalur = deret.map((t, i) => `${i ? 'L' : 'M'}${x(t.db).toFixed(1)} ${y(t.tekananPa).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Sound pressure rising exponentially with decibels, so equal decibel steps are not equal pressure steps">
      <line x1={KIRI} y1={H - BAWAH} x2={W - KANAN} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      <line x1={KIRI} y1={ATAS} x2={KIRI} y2={H - BAWAH} stroke="currentColor" strokeOpacity={0.25} />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={KIRI - 5} y={y(maks * f) + 3} textAnchor="end"
          className="fill-current text-[8px] opacity-50">{(maks * f).toFixed(0)}</text>
      ))}
      <path d={jalur} fill="none" stroke="#00BF63" strokeWidth={2.5} />
      <circle cx={x(db)} cy={y(tekananDariDb(db))} r={4} fill="#00BF63" />
      <text x={KIRI + 4} y={ATAS + 9} className="fill-current text-[8.5px] font-bold opacity-60">Pa</text>
      <text x={W - KANAN} y={H - 8} textAnchor="end" className="fill-current text-[8.5px] font-bold opacity-60">
        Sound pressure level (dB)
      </text>
    </svg>
  )
}

export function InderaPanel() {
  const [usia, setUsia] = useState<number>(45)
  const [db, setDb] = useState<number>(70)
  const [sumber, setSumber] = useState<number>(2)
  const [nm, setNm] = useState<number>(550)

  const amp = amplitudoLazimUsia(usia)
  const jarak = titikDekat(amp)
  const gabungan = jumlahSumber(Array.from({ length: sumber }, () => db))

  return (
    <div className="space-y-4">
      <Prosa>
        <h3 className="text-base font-black">Dioptres and decibels</h3>
        <p className="text-[12px] leading-relaxed">
          Both of these senses are recorded on a scale that behaves nothing like the one
          people actually experience. The eye is measured in dioptres, which are linear,
          while what you notice is <em>distance</em>, which is their reciprocal. The ear is
          measured in decibels, which are logarithmic, while what reaches the eardrum is
          <em> pressure</em>. Both curves below are drawn by the same functions that print
          the numbers.
        </p>
      </Prosa>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Accommodation and the near point
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Angka nilai={amp.toFixed(2)} satuan="D" label="Amplitude" />
          <Angka nilai={Number.isFinite(jarak) ? (jarak * 100).toFixed(0) : '∞'} satuan="cm" label="Near point" />
        </div>

        <Geser label="Age" nilai={usia} min={RENTANG_INDERA.usia.min} maks={RENTANG_INDERA.usia.maks} onUbah={setUsia} satuan="years" />
        <GrafikAkomodasi usia={usia} />

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {amp <= 0
            ? 'With no accommodation left there is no near point at all — nothing can be brought into focus closer than the far point, which is why the curve leaves the top of the plot rather than reaching a large number.'
            : `The dashed line is the amplitude, and it falls in a straight line. The solid line is the near point, and it does not. Between 40 and 50 the same two-dioptre loss pushes the near point from ${(titikDekat(amplitudoLazimUsia(40)) * 100).toFixed(0)} cm to ${(titikDekat(amplitudoLazimUsia(50)) * 100).toFixed(0)} cm — a change you notice — while the same loss earlier moved it only a few centimetres. Nothing changes about the eye's rate of loss; only the reciprocal does.`}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Decibels are not a count of loudness
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={tekananDariDb(db).toFixed(3)} satuan="Pa" label="Pressure" />
          <Angka nilai={gabungan.toFixed(1)} satuan="dB" label={`${sumber} source${sumber === 1 ? '' : 's'}`} />
          <Angka nilai={(gabungan - db).toFixed(1)} satuan="dB" label="Added" />
        </div>

        <Geser label="Level of one source" nilai={db} min={RENTANG_INDERA.db.min} maks={RENTANG_INDERA.db.maks} onUbah={setDb} satuan="dB" />
        <Geser label="Identical sources" nilai={sumber} min={RENTANG_INDERA.sumber.min} maks={RENTANG_INDERA.sumber.maks} onUbah={setSumber} satuan="" />
        <GrafikDesibel db={db} />

        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          {sumber === 1
            ? `One source at ${db} dB puts ${tekananDariDb(db).toFixed(3)} Pa at the eardrum. Add a second identical one and the total rises by 3 dB, not 6 and certainly not double — sources add as intensity, never as decibels.`
            : `${sumber} identical sources at ${db} dB give ${gabungan.toFixed(1)} dB, only ${(gabungan - db).toFixed(1)} dB more than one of them. Adding decibels together would have given ${(db * sumber).toFixed(0)} dB, a figure with no physical meaning at all. Doubling the number of sources always adds the same 3 dB, however many there already are.`}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
          Photon energy across the visible range
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Angka nilai={energiFotonEv(nm).toFixed(2)} satuan="eV" label="Photon energy" />
          <Angka nilai={nm.toFixed(0)} satuan="nm" label="Wavelength" />
        </div>
        <Geser label="Wavelength" nilai={nm} min={RENTANG_INDERA.panjangGelombang.min} maks={RENTANG_INDERA.panjangGelombang.maks} langkah={5} onUbah={setNm} satuan="nm" />
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Energy is inversely proportional to wavelength, so the whole visible range spans
          less than a factor of two in energy — from {energiFotonEv(740).toFixed(2)} eV at the
          red end to {energiFotonEv(380).toFixed(2)} eV at the violet. That narrow band is the
          part of the spectrum photoreceptor chemistry can use.
        </p>
      </div>

      <Prosa>
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Reference biophysics. Every figure is computed from values you supply — nothing is
          measured, nothing describes anyone's eyes or ears, and no number here is a
          prescription, a hearing-protection rule, an exposure limit or a diagnosis. The
          accommodation curve is a population teaching approximation of expected amplitude
          by age, not a normal range for an individual and not a threshold for correction;
          real amplitude varies widely and is measured, not predicted. The acoustic figures
          are free-field sound pressure with no weighting, no duration, no frequency
          response and no ear canal or middle-ear transfer — perceived loudness is not sound
          pressure level, and neither is hearing damage.
        </p>
      </Prosa>
    </div>
  )
}
