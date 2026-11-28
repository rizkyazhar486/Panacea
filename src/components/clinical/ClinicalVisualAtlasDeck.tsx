import { useState } from 'react'
import { Link } from 'react-router-dom'

type PlateLens = 'organ' | 'location' | 'microscopic' | 'compare'

export interface ClinicalOrganAtlasCard {
  readonly id: 'heart' | 'brain' | 'lungs' | 'kidneys' | 'liver' | 'intestine' | 'pancreas' | 'eyeball' | 'skin'
  readonly specialty: string
  readonly organLabel: string
  readonly bodySystem: string
  readonly accentHex: string
  readonly modalityLabel: string
  readonly waveformPath: string
  readonly diagnosticPathway: readonly [string, string, string, string]
  readonly emrHint: string
}

export const CLINICAL_VISUAL_ORGAN_CARDS: readonly ClinicalOrganAtlasCard[] = [
  {
    id: 'heart',
    specialty: 'Cardiology',
    organLabel: 'Heart & Coronary',
    bodySystem: 'cardiovascular',
    accentHex: '#fb7185',
    modalityLabel: 'Lead-II ECG · Hemodynamic Axis',
    waveformPath: 'M0,26 L18,26 L23,21 L28,26 L36,26 L40,30 L45,6 L50,36 L54,26 L66,26 L73,17 L82,26 L110,26 L115,21 L120,26 L128,26 L132,30 L137,6 L142,36 L146,26 L158,26 L165,17 L174,26 L200,26',
    diagnosticPathway: ['Chest pain / dyspnea', '12-Lead ECG + hs-Troponin', 'ACS vs HF vs Arrhythmia', 'Guideline pathway & Echo'],
    emrHint: 'Inspect chambers & coronary supply in Body, then document reviewed findings in AI-EMR.',
  },
  {
    id: 'brain',
    specialty: 'Neurology',
    organLabel: 'Brain & Neurovascular',
    bodySystem: 'nervous',
    accentHex: '#a78bfa',
    modalityLabel: 'Cortical EEG · Tract Localization',
    waveformPath: 'M0,22 Q10,12 20,22 T40,22 T60,18 T80,26 T100,15 T120,24 T140,18 T160,22 T180,16 T200,22',
    diagnosticPathway: ['Focal deficit / seizure', 'NIHSS + Non-contrast CT/MRI', 'Ischemic vs Hemorrhagic', 'Time-critical stroke pathway'],
    emrHint: 'Correlate cranial nerve / tract lesion in Body Localization before charting neuro exam.',
  },
  {
    id: 'lungs',
    specialty: 'Pulmonology',
    organLabel: 'Lungs & Bronchial Tree',
    bodySystem: 'respiratory',
    accentHex: '#38bdf8',
    modalityLabel: 'Spirometry Flow-Volume · SpO₂/ABG',
    waveformPath: 'M10,28 Q26,6 52,14 Q95,22 140,28 Q92,38 45,35 Q20,33 10,28',
    diagnosticPathway: ['Wheeze / hypoxia / cough', 'SpO₂ + CXR + Spirometry', 'Obstructive vs Restrictive', 'Bronchodilator & O₂ titration'],
    emrHint: 'Launch interactive Bronchoscopy or alveolar gas-exchange model directly in Body.',
  },
  {
    id: 'kidneys',
    specialty: 'Nephrology',
    organLabel: 'Kidneys & Nephron',
    bodySystem: 'urinary',
    accentHex: '#34d399',
    modalityLabel: 'eGFR Trend · Electrolyte Balance',
    waveformPath: 'M0,12 L40,14 L85,16 L130,22 L165,26 L200,28',
    diagnosticPathway: ['Edema / oliguria / HTN', 'BMP + Urinalysis + uACR', 'AKI vs CKD Staging', 'RAAS & fluid stewardship'],
    emrHint: 'Review glomerular microanatomy and electrolyte gradients before ordering renally cleared drugs.',
  },
  {
    id: 'liver',
    specialty: 'Hepatobiliary',
    organLabel: 'Liver & Biliary Tree',
    bodySystem: 'digestive',
    accentHex: '#fbbf24',
    modalityLabel: 'LFT / Bilirubin · Portal Flow',
    waveformPath: 'M0,30 Q35,28 65,16 T135,14 T200,24',
    diagnosticPathway: ['Jaundice / RUQ pain', 'AST/ALT/ALP + Bilirubin + US', 'Hepatocellular vs Cholestatic', 'Fibrosis & CYP450 review'],
    emrHint: 'Open biliary & hepatic lobule anatomy in Body and cross-check hepatic drug metabolism.',
  },
  {
    id: 'intestine',
    specialty: 'Gastroenterology',
    organLabel: 'GI Tract & Colon',
    bodySystem: 'digestive',
    accentHex: '#f97316',
    modalityLabel: 'Endoluminal Mucosa · Motility',
    waveformPath: 'M0,24 Q20,10 40,24 T80,24 T120,24 T160,24 T200,24',
    diagnosticPathway: ['GI bleed / pain / weight loss', 'CBC + FIT + Endoscopy', 'IBD vs Peptic vs Neoplasia', 'Endoscopic & mucosal care'],
    emrHint: 'Explore real reference Colonoscopy & Upper GI lumen inside Body Scope.',
  },
  {
    id: 'pancreas',
    specialty: 'Endocrinology',
    organLabel: 'Pancreas & Islets',
    bodySystem: 'endocrine',
    accentHex: '#2dd4bf',
    modalityLabel: 'Glucose–Insulin Feedback Curve',
    waveformPath: 'M0,30 Q40,30 68,12 Q95,8 128,22 Q162,28 200,29',
    diagnosticPathway: ['Polyuria / HbA1c elevation', 'FPG + HbA1c + Ketones', 'T1DM vs T2DM vs Pancreatitis', 'Glycemic & organ-protection plan'],
    emrHint: 'Inspect beta-cell insulin physiology and HbA1c longitudinal trend in Body.',
  },
  {
    id: 'eyeball',
    specialty: 'Ophthalmology',
    organLabel: 'Eye & Retinal Optics',
    bodySystem: 'sensory-ent',
    accentHex: '#60a5fa',
    modalityLabel: 'Visual Acuity · Fundus / IOP',
    waveformPath: 'M10,22 Q100,4 190,22 Q100,40 10,22',
    diagnosticPathway: ['Blur / red eye / field loss', 'Acuity + Slit Lamp + Fundus', 'Glaucoma vs Retinopathy', 'Urgent ophthalmology triage'],
    emrHint: 'Open Ocular 4D optics & gaze motility in Body Explorer.',
  },
  {
    id: 'skin',
    specialty: 'Dermatology',
    organLabel: 'Skin & Barrier',
    bodySystem: 'integumentary-surface',
    accentHex: '#f472b6',
    modalityLabel: 'ABCDE Dermoscopy · Epidermal Layers',
    waveformPath: 'M0,18 L200,18 M0,28 L200,28 M20,18 L20,28 M60,18 L60,28 M100,18 L100,28 M140,18 L140,28 M180,18 L180,28',
    diagnosticPathway: ['Rash / changing pigmented lesion', 'Dermoscopy + Distribution map', 'Inflammatory vs Neoplastic', 'Biopsy / topical stewardship'],
    emrHint: 'Inspect epidermal layers and body-region skin logs in Body.',
  },
] as const

const BASE = `${import.meta.env.BASE_URL}organs/`

export default function ClinicalVisualAtlasDeck() {
  const [activeId, setActiveId] = useState<ClinicalOrganAtlasCard['id']>('heart')
  const [lens, setLens] = useState<PlateLens>('organ')

  const active = CLINICAL_VISUAL_ORGAN_CARDS.find((c) => c.id === activeId) ?? CLINICAL_VISUAL_ORGAN_CARDS[0]
  const plateSrc = `${BASE}${active.id}/${lens}.webp`

  return (
    <section
      data-clinical-visual-atlas="v1"
      aria-label="Interactive Clinical Visual Organ Atlas and Diagnostic Pathways"
      className="dark space-y-3 rounded-2xl border border-cyan-400/25 bg-[#050912] p-3.5 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-wider text-cyan-200">
            Clinical Visual Atlas · 9 Specialties · Shared Canonical Body Runtime
          </div>
          <div className="text-[11px] text-slate-300">
            Tap any organ to inspect reference anatomy, microscopy, normal-vs-pathology plates, and jump to Body 3D without duplicating engines.
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-emerald-200">
          CLINICIAN REFERENCE · NON-DIAGNOSTIC
        </span>
      </div>

      {/* 9 Visual Specialty Organ Selector Cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9" role="tablist" aria-label="Clinical organ specialties">
        {CLINICAL_VISUAL_ORGAN_CARDS.map((card) => {
          const selected = card.id === active.id
          return (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveId(card.id)}
              className={`flex min-h-[74px] flex-col items-center justify-between rounded-xl border p-1.5 text-center transition ${
                selected ? 'border-white/70 bg-white/10 text-white' : 'border-white/10 bg-slate-950/80 text-slate-300 hover:border-white/30'
              }`}
              style={selected ? { borderColor: card.accentHex } : undefined}
            >
              <img
                src={`${BASE}${card.id}/thumb.webp`}
                alt={card.organLabel}
                loading="lazy"
                className="h-9 w-9 rounded-lg object-contain"
              />
              <span className="mt-1 truncate text-[9.5px] font-black leading-tight">{card.specialty}</span>
            </button>
          )
        })}
      </div>

      {/* Active Organ Visual Stage + Interactive Waveform + Diagnostic Pathway */}
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#02050b] p-3 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-sm font-black" style={{ color: active.accentHex }}>
              {active.specialty} · {active.organLabel}
            </strong>
            <div className="flex gap-1 font-mono text-[9px]">
              {(['organ', 'location', 'microscopic', 'compare'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lens === l}
                  onClick={() => setLens(l)}
                  className={`min-h-7 rounded-md border px-2 font-bold capitalize ${
                    lens === l ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="my-2 grid h-52 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/50 p-2">
            <img
              src={plateSrc}
              alt={`${active.organLabel} ${lens} reference plate`}
              className="max-h-48 w-auto object-contain"
            />
          </div>

          <div className="text-[10.5px] text-slate-400">{active.emrHint}</div>
        </div>

        <div className="flex flex-col justify-between space-y-2.5 lg:col-span-7">
          {/* Interactive Visual Waveform / Physiological Signature */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3">
            <div className="flex items-center justify-between font-mono text-[9.5px]">
              <span className="font-black text-cyan-200">{active.modalityLabel}</span>
              <span className="text-slate-400">Reference Educational Signal</span>
            </div>
            <svg viewBox="0 0 200 44" className="mt-2 h-14 w-full rounded-lg bg-black/45 p-1" role="img" aria-label={active.modalityLabel}>
              <path d={active.waveformPath} fill="none" stroke={active.accentHex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* 4-Step Visual Diagnostic Reasoning Pathway */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3">
            <div className="mb-2 font-mono text-[9.5px] font-black uppercase text-slate-400">
              Visual Diagnostic Reasoning Pathway
            </div>
            <div className="grid gap-1.5 sm:grid-cols-4">
              {active.diagnosticPathway.map((step, idx) => (
                <div key={step} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  <div className="font-mono text-[9px] font-black" style={{ color: active.accentHex }}>
                    0{idx + 1}
                  </div>
                  <div className="mt-0.5 text-[11px] font-bold text-slate-100">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Tap Cross-SuperPage Clinical <-> Body Bridge */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <Link
              to={`/body-explorer?system=${active.bodySystem}&returnTo=/clinical-hub`}
              className="inline-flex min-h-10 items-center rounded-xl border border-cyan-300/60 bg-cyan-500/20 px-3 font-black text-white hover:bg-cyan-500/30"
            >
              Open {active.organLabel} in 3D Body Atlas →
            </Link>
            <Link
              to="/emr"
              className="inline-flex min-h-10 items-center rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 font-black text-emerald-100 hover:bg-emerald-500/25"
            >
              Document in AI-EMR ↗
            </Link>
            <Link
              to="/clinical-calculators"
              className="inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/5 px-3 font-bold text-slate-200 hover:border-white/35"
            >
              Calculators
            </Link>
            <Link
              to="/rujukan?t=obat"
              className="inline-flex min-h-10 items-center rounded-xl border border-white/15 bg-white/5 px-3 font-bold text-slate-200 hover:border-white/35"
            >
              Drug Reference
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
