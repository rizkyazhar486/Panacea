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

function batasVisual(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/**
 * Gambar hubungan antarsistem, bukan atlas anatomi. Bentuk organ sengaja
 * disederhanakan; yang berubah hanyalah cue visual dari output yang memang
 * dihitung bodySim. Ketebalan garis dan kecepatan partikel tidak boleh dibaca
 * sebagai diameter pembuluh atau waktu transit darah yang sebenarnya.
 */
function SystemCouplingDiagram({ out, heartRate, motion, onToggleMotion }: {
  out: ReturnType<typeof simulate>
  heartRate: number
  motion: boolean
  onToggleMotion: () => void
}) {
  const pulmonaryNorm = batasVisual(out.cardiacOutput / 8, 0, 1)
  const renalNorm = batasVisual(out.renalPerfusion / 1600, 0, 1)
  const pulmonaryWidth = 2 + pulmonaryNorm * 3
  const renalWidth = 2 + renalNorm * 3
  const oxygenOpacity = 0.5 + batasVisual(out.sao2 / 100, 0, 1) * 0.5
  // Durasi hanya cue ternormalisasi agar perubahan output terlihat. Ini bukan
  // estimasi waktu transit darah. Denyut halo mengikuti HR input simulator.
  const pulmonaryDuration = (2.8 - pulmonaryNorm * 1.4).toFixed(2)
  const renalDuration = (3.2 - renalNorm * 1.4).toFixed(2)
  const beatDuration = Math.max(0.32, 60 / Math.max(heartRate, 1)).toFixed(2)

  return (
    <figure className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">Live system coupling</div>
          <div className="mt-0.5 text-[11px] font-bold text-ink dark:text-white">Heart ↔ lungs · heart ↔ kidneys</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-neutral-200 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-neutral-500 dark:border-white/10">schematic</span>
          <button
            type="button"
            aria-pressed={motion}
            onClick={onToggleMotion}
            className="min-h-[30px] rounded-full border border-neutral-200 px-2.5 text-[9px] font-black text-ink dark:border-white/10 dark:text-white"
          >
            {motion ? 'Pause flow' : 'Run flow'}
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 360 230"
        className="w-full"
        role="img"
        aria-labelledby="sim-coupling-title sim-coupling-desc"
      >
        <title id="sim-coupling-title">Live heart, lung, and kidney coupling schematic</title>
        <desc id="sim-coupling-desc">
          The current simulator computes cardiac output {out.cardiacOutput.toFixed(1)} litres per minute,
          oxygen saturation {out.sao2.toFixed(0)} percent, and glomerular filtration {out.gfr.toFixed(0)} millilitres per minute.
          Organ shapes, line thickness, and moving particles are educational cues rather than anatomical scale or measured blood transit.
        </desc>
        <defs>
          <marker id="sim-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
          <marker id="sim-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#00BF63" />
          </marker>
          <marker id="sim-arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
          </marker>
        </defs>

        {/* Pulmonary loop: heart to lungs, then oxygenated return. */}
        <path
          d="M158 122 C122 112 118 92 138 80"
          fill="none"
          stroke="#38bdf8"
          strokeWidth={pulmonaryWidth}
          strokeLinecap="round"
          markerEnd="url(#sim-arrow-cyan)"
        />
        <path
          d="M222 80 C242 94 236 112 202 122"
          fill="none"
          stroke="#00BF63"
          strokeOpacity={oxygenOpacity}
          strokeWidth={pulmonaryWidth}
          strokeLinecap="round"
          markerEnd="url(#sim-arrow-green)"
        />
        {motion && (
          <g aria-hidden="true" className="motion-reduce:hidden">
            <circle r="3.2" fill="#38bdf8">
              <animateMotion path="M158 122 C122 112 118 92 138 80" dur={`${pulmonaryDuration}s`} repeatCount="indefinite" />
            </circle>
            <circle r="3.2" fill="#00BF63" opacity={oxygenOpacity}>
              <animateMotion path="M222 80 C242 94 236 112 202 122" dur={`${pulmonaryDuration}s`} repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Renal perfusion loop: systemic output to kidneys and venous return. */}
        <path
          d="M166 145 C145 160 130 177 123 191"
          fill="none"
          stroke="#a855f7"
          strokeWidth={renalWidth}
          strokeLinecap="round"
          markerEnd="url(#sim-arrow-purple)"
        />
        <path
          d="M194 145 C215 160 230 177 237 191"
          fill="none"
          stroke="#a855f7"
          strokeWidth={renalWidth}
          strokeLinecap="round"
          markerEnd="url(#sim-arrow-purple)"
        />
        <path
          d="M142 198 C160 181 169 164 175 148"
          fill="none"
          stroke="#00BF63"
          strokeOpacity="0.65"
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd="url(#sim-arrow-green)"
        />
        <path
          d="M218 198 C200 181 191 164 185 148"
          fill="none"
          stroke="#00BF63"
          strokeOpacity="0.65"
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd="url(#sim-arrow-green)"
        />
        {motion && (
          <g aria-hidden="true" className="motion-reduce:hidden">
            <circle r="3" fill="#a855f7">
              <animateMotion path="M166 145 C145 160 130 177 123 191" dur={`${renalDuration}s`} repeatCount="indefinite" />
            </circle>
            <circle r="3" fill="#a855f7">
              <animateMotion path="M194 145 C215 160 230 177 237 191" dur={`${renalDuration}s`} repeatCount="indefinite" />
            </circle>
            <circle r="2.7" fill="#00BF63" opacity="0.7">
              <animateMotion path="M142 198 C160 181 169 164 175 148" dur={`${renalDuration}s`} repeatCount="indefinite" />
            </circle>
            <circle r="2.7" fill="#00BF63" opacity="0.7">
              <animateMotion path="M218 198 C200 181 191 164 185 148" dur={`${renalDuration}s`} repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Airway and lungs. */}
        <path d="M180 20 L180 46 M180 46 L154 58 M180 46 L206 58" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="145" cy="66" rx="34" ry="41" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="2" />
        <ellipse cx="215" cy="66" rx="34" ry="41" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="2" />
        <text x="180" y="56" textAnchor="middle" className="fill-current text-[9px] font-black">LUNGS</text>
        <text x="180" y="70" textAnchor="middle" className="fill-current text-[8.5px] font-bold" opacity="0.76">SaO₂ {out.sao2.toFixed(0)}%</text>
        <text x="180" y="82" textAnchor="middle" className="fill-current text-[8.5px] font-bold" opacity="0.62">PaCO₂ {out.paco2.toFixed(0)} mmHg</text>

        {/* Unified heart node: this is coupling, not chamber anatomy. */}
        {motion && (
          <circle cx="180" cy="119" r="38" fill="none" stroke="#FF5A1F" strokeWidth="2" aria-hidden="true" className="motion-reduce:hidden">
            <animate attributeName="opacity" values="0.08;0.34;0.08" dur={`${beatDuration}s`} repeatCount="indefinite" />
          </circle>
        )}
        <path
          d="M180 151 C171 141 145 126 145 108 C145 94 156 86 168 86 C175 86 180 90 180 96 C180 90 185 86 192 86 C204 86 215 94 215 108 C215 126 189 141 180 151 Z"
          fill="rgba(255,90,31,0.14)"
          stroke="#FF5A1F"
          strokeWidth="2.2"
        />
        <text x="180" y="113" textAnchor="middle" className="fill-current text-[9px] font-black">HEART</text>
        <text x="180" y="126" textAnchor="middle" className="fill-current text-[8.5px] font-bold" opacity="0.76">CO {out.cardiacOutput.toFixed(1)} L/min</text>
        <text x="180" y="138" textAnchor="middle" className="fill-current text-[8.5px] font-bold" opacity="0.62">MAP {out.map.toFixed(0)} mmHg</text>

        {/* Kidneys as paired schematic beans. */}
        <path d="M95 188 C80 177 78 153 95 146 C108 141 121 150 119 164 C117 180 108 194 95 188 Z" fill="rgba(168,85,247,0.12)" stroke="#a855f7" strokeWidth="2" />
        <path d="M265 188 C280 177 282 153 265 146 C252 141 239 150 241 164 C243 180 252 194 265 188 Z" fill="rgba(168,85,247,0.12)" stroke="#a855f7" strokeWidth="2" />
        <text x="180" y="177" textAnchor="middle" className="fill-current text-[9px] font-black">KIDNEYS</text>
        <text x="180" y="190" textAnchor="middle" className="fill-current text-[8.5px] font-bold" opacity="0.76">GFR {out.gfr.toFixed(0)} mL/min</text>
        <text x="180" y="202" textAnchor="middle" className="fill-current text-[8.5px] font-bold" opacity="0.62">urine {out.urineOutput.toFixed(0)} mL/h</text>

        <text x="68" y="105" className="fill-current text-[7.5px] font-black uppercase" opacity="0.48">pulmonary loop</text>
        <text x="248" y="164" className="fill-current text-[7.5px] font-black uppercase" opacity="0.48">renal perfusion</text>
        <text x="180" y="222" textAnchor="middle" className="fill-current text-[8px] font-bold" opacity="0.54">O₂ delivery {out.do2.toFixed(0)} mL/min · lactate {out.lactate.toFixed(1)} mmol/L</text>
      </svg>

      <figcaption className="mt-1 text-[10px] leading-relaxed text-neutral-500">
        Educational coupling map, not anatomical scale. Organ shapes are schematic; line thickness and particle speed are normalized teaching cues, not vessel calibre or blood transit time. The halo cadence follows the selected simulator heart rate and is not a measured heartbeat. Motion is suppressed when reduced-motion is requested.
      </figcaption>
    </figure>
  )
}

export function SimulatorSection({ onVitals }: Props) {
  const [input, setInput] = useState<SimInput>({ ...NORMAL })
  const [skenarioAktif, setSkenarioAktif] = useState('normal')
  const [bukaKendali, setBukaKendali] = useState(false)
  const [gerakVisual, setGerakVisual] = useState(true)
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
              type="button"
              aria-pressed={skenarioAktif === s.key}
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

      <SystemCouplingDiagram
        out={out}
        heartRate={input.heartRate}
        motion={gerakVisual}
        onToggleMotion={() => setGerakVisual((x) => !x)}
      />

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
          type="button"
          aria-expanded={bukaKendali}
          aria-controls="body-simulator-controls"
          onClick={() => setBukaKendali(!bukaKendali)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-left text-xs font-bold text-ink dark:border-white/10 dark:text-white"
        >
          {bukaKendali ? 'Hide controls' : 'Change any variable yourself'} ›
        </button>
        {bukaKendali && (
          <div id="body-simulator-controls" className="mt-2 space-y-2">
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
              type="button"
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
