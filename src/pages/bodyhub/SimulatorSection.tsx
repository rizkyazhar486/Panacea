import { useState } from 'react'
import { simulate, NORMAL, SKENARIO, KENDALI, type SimInput } from '../../lib/bodySim'

// Simulator faal seluruh tubuh. Kardiovaskular, paru, dan ginjal dihitung dari
// persamaan yang SALING MENYUAPI — lihat src/lib/bodySim.ts. Tidak ada satu pun
// angka keluaran di layar ini yang ditulis tangan.

interface Props {
  /** Denyut & napas hasil hitungan diteruskan ke figur 3D, sehingga tubuh di
   *  layar benar-benar berdetak pada laju yang sedang disimulasikan. */
  onVitals?: (heartRate: number, respRate: number) => void
}

function Angka({ label, nilai, satuan, normal, buruk }: {
  label: string; nilai: number; satuan: string; normal: string; buruk?: boolean
}) {
  return (
    <div className={`rounded-lg p-2 ${buruk ? 'bg-red-50 dark:bg-red-500/10' : 'bg-neutral-50 dark:bg-white/5'}`}>
      <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={`text-base font-black ${buruk ? 'text-red-600 dark:text-red-400' : 'text-ink dark:text-white'}`}>
        {nilai.toFixed(nilai < 10 ? 1 : 0)}
        <span className="ml-0.5 text-[10px] font-bold text-neutral-400">{satuan}</span>
      </div>
      <div className="text-[10px] text-neutral-400">{normal}</div>
    </div>
  )
}

export function SimulatorSection({ onVitals }: Props) {
  const [input, setInput] = useState<SimInput>({ ...NORMAL })
  const [skenarioAktif, setSkenarioAktif] = useState('normal')
  const [bukaKendali, setBukaKendali] = useState(false)
  const out = simulate(input)

  function pakaiSkenario(key: string) {
    const s = SKENARIO.find((x) => x.key === key)
    if (!s) return
    setSkenarioAktif(key)
    setInput({ ...s.input })
    onVitals?.(s.input.heartRate, s.input.respRate)
  }

  function ubah(key: keyof SimInput, nilai: number) {
    // Menggeser satu kendali berarti keadaannya tidak lagi persis skenario mana
    // pun — penandanya dilepas supaya layar tidak mengklaim sesuatu yang keliru.
    setSkenarioAktif('')
    const berikut = { ...input, [key]: nilai }
    setInput(berikut)
    if (key === 'heartRate' || key === 'respRate') onVitals?.(berikut.heartRate, berikut.respRate)
  }

  const skenario = SKENARIO.find((s) => s.key === skenarioAktif)

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-neutral-400">
        The three systems are solved together, so a change in one moves the others. Every number below is computed
        from standard physiological equations — Frank–Starling, the alveolar gas and shunt equations, the
        haemoglobin dissociation curve, and renal autoregulation.
      </p>

      <div>
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Scenario</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SKENARIO.map((s) => (
            <button
              key={s.key}
              onClick={() => pakaiSkenario(s.key)}
              className={`min-h-[32px] rounded-full border px-2.5 text-[11px] font-bold transition ${
                skenarioAktif === s.key
                  ? 'border-brand bg-brand text-white'
                  : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {skenario && (
        <div className="rounded-xl bg-brand/5 p-2.5 dark:bg-brand/10">
          <p className="text-xs leading-relaxed text-ink dark:text-white">{skenario.cerita}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            <span className="font-bold">Watch for: </span>{skenario.perhatikan}
          </p>
        </div>
      )}

      <div>
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Circulation</div>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          <Angka label="Cardiac output" nilai={out.cardiacOutput} satuan="L/min" normal="4–8" buruk={out.cardiacOutput < 3.5} />
          <Angka label="MAP" nilai={out.map} satuan="mmHg" normal="70–100" buruk={out.map < 65} />
          <Angka label="Stroke volume" nilai={out.strokeVolume} satuan="mL" normal="60–100" buruk={out.strokeVolume < 40} />
        </div>
        <p className="mt-1 text-center text-[11px] font-bold text-neutral-500">
          {out.systolic.toFixed(0)}/{out.diastolic.toFixed(0)} mmHg
        </p>
      </div>

      <div>
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Gas exchange</div>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          <Angka label="SaO₂" nilai={out.sao2} satuan="%" normal="95–100" buruk={out.sao2 < 90} />
          <Angka label="PaO₂" nilai={out.pao2} satuan="mmHg" normal="80–100" buruk={out.pao2 < 60} />
          <Angka label="PaCO₂" nilai={out.paco2} satuan="mmHg" normal="35–45" buruk={out.paco2 > 50 || out.paco2 < 30} />
          <Angka label="pH" nilai={out.ph} satuan="" normal="7.35–7.45" buruk={out.ph < 7.3 || out.ph > 7.5} />
          <Angka label="O₂ delivery" nilai={out.do2} satuan="mL/min" normal="~1000" buruk={out.do2 < 600} />
          <Angka label="Lactate" nilai={out.lactate} satuan="mmol/L" normal="<2" buruk={out.lactate > 2} />
        </div>
      </div>

      <div>
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Kidney</div>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          <Angka label="Renal flow" nilai={out.renalPerfusion} satuan="mL/min" normal="~1100" buruk={out.renalPerfusion < 600} />
          <Angka label="GFR" nilai={out.gfr} satuan="mL/min" normal="90–120" buruk={out.gfr < 60} />
          <Angka label="Urine" nilai={out.urineOutput} satuan="mL/h" normal="≥30" buruk={out.urineOutput < 30} />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">What is limiting the system</div>
        <ul className="mt-1 space-y-1">
          {out.catatan.map((c, i) => (
            <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              <span className="shrink-0 text-neutral-400">·</span><span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <button
          onClick={() => setBukaKendali(!bukaKendali)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs font-bold text-ink dark:border-white/10 dark:text-white"
        >
          {bukaKendali ? 'Hide controls' : 'Change any variable yourself'} ›
        </button>
        {bukaKendali && (
          <div className="mt-2 space-y-2">
            {(['cv', 'paru', 'ginjal'] as const).map((sis) => (
              <div key={sis}>
                <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
                  {sis === 'cv' ? 'Circulation' : sis === 'paru' ? 'Respiration' : 'Kidney'}
                </div>
                {KENDALI.filter((k) => k.sistem === sis).map((k) => (
                  <div key={k.key} className="mt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-neutral-500">{k.label}</span>
                      <span className="font-bold text-ink dark:text-white">
                        {input[k.key].toFixed(k.step < 1 ? 2 : 0)} {k.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={k.min} max={k.max} step={k.step}
                      value={input[k.key]}
                      onChange={(e) => ubah(k.key, Number(e.target.value))}
                      aria-label={k.label}
                      className="w-full accent-[var(--brand,#00bf63)]"
                    />
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={() => pakaiSkenario('normal')}
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-500 dark:border-white/10"
            >
              Reset to healthy
            </button>
          </div>
        )}
      </div>

      <p className="text-[10.5px] leading-relaxed text-neutral-400">
        This is a simplified STEADY-STATE model built to teach the direction and size of the couplings between
        systems. It is not a patient model: it has no time course, so slower responses such as the metabolic
        compensation of an acid–base disturbance are not represented, and it must never be used to estimate a real
        person’s state.
      </p>
    </div>
  )
}

export default SimulatorSection
