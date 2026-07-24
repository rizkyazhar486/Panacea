import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Calculator Hub — searchable index of every clinical calculator and score in
// the app, grouped by specialty. The sidebar lists them all alphabetically-ish,
// but with 30+ standalone tools a clinician needs "search by what I'm trying
// to do" — this page provides that. Pure catalog, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Tool { to: string; name: string; what: string; keywords: string }

const GROUPS: { title: string; emoji: string; tools: Tool[] }[] = [
  {
    title: 'Cardiology',
    emoji: '❤️',
    tools: [
      { to: '/stroke-risk', name: 'CHA₂DS₂-VASc', what: 'Stroke risk in atrial fibrillation → anticoagulation decision', keywords: 'af atrial fibrillation stroke anticoagulation' },
      { to: '/has-bled-score', name: 'HAS-BLED', what: 'Bleeding risk on anticoagulation (pairs with CHA₂DS₂-VASc)', keywords: 'bleeding anticoagulation warfarin' },
      { to: '/timi-risk-score', name: 'TIMI Risk Score', what: '14-day risk in unstable angina / NSTEMI', keywords: 'acs nstemi unstable angina chest pain' },
      { to: '/grace-score', name: 'GRACE Score', what: 'In-hospital mortality across the full ACS spectrum', keywords: 'acs stemi nstemi mortality invasive' },
      { to: '/qtc-calculator', name: 'QTc Calculator', what: 'Corrected QT — drug-safety screening, 4 formulas + serial trend', keywords: 'qt torsades ecg drug antipsychotic methadone' },
      { to: '/duke-criteria', name: 'Duke Criteria', what: 'Infective endocarditis diagnostic classification', keywords: 'endocarditis ie vegetation blood culture' },
      { to: '/ldl-calculator', name: 'LDL (Friedewald)', what: 'Calculated LDL + non-HDL cholesterol', keywords: 'cholesterol lipid friedewald' },
      { to: '/risk', name: 'Framingham CVD (Risk Calculators)', what: '10-year cardiovascular risk, FIB-4, OST', keywords: 'framingham cardiovascular 10-year fibrosis osteoporosis' },
    ],
  },
  {
    title: 'Pulmonology & Critical Care',
    emoji: '🫁',
    tools: [
      { to: '/wells-score', name: 'Wells Score', what: 'DVT and PE pretest probability, with D-dimer strategy', keywords: 'dvt pe embolism thrombosis d-dimer' },
      { to: '/perc-rule', name: 'PERC Rule', what: 'Rule out PE without testing in low-risk patients', keywords: 'pe embolism rule out low risk' },
      { to: '/aa-gradient', name: 'A-a Gradient', what: 'Localize hypoxemia: lung problem vs hypoventilation', keywords: 'hypoxemia abg oxygen alveolar shunt' },
      { to: '/lights-criteria', name: "Light's Criteria", what: 'Pleural effusion: exudate vs transudate', keywords: 'pleural effusion exudate transudate tap' },
      { to: '/sofa-score', name: 'SOFA Score', what: 'Full 6-organ ICU severity + serial trend', keywords: 'sepsis icu organ failure' },
      { to: '/news2-score', name: 'NEWS2', what: 'Ward vital-signs early warning + serial trend', keywords: 'vital signs deterioration early warning ward' },
    ],
  },
  {
    title: 'GI & Hepatology',
    emoji: '🫀',
    tools: [
      { to: '/meld-score', name: 'MELD-Na', what: 'Liver disease severity / transplant priority + serial trend', keywords: 'liver cirrhosis transplant meld' },
      { to: '/maddrey-score', name: "Maddrey's Discriminant Function", what: 'Severe alcoholic hepatitis — the corticosteroid decision', keywords: 'alcoholic hepatitis steroid prednisolone maddrey liver' },
      { to: '/child-pugh-score', name: 'Child-Pugh', what: 'Cirrhosis class A/B/C, surgical risk + serial trend', keywords: 'liver cirrhosis ascites surgical risk' },
      { to: '/glasgow-blatchford-score', name: 'Glasgow-Blatchford', what: 'Upper GI bleed: who needs admission (pre-endoscopy)', keywords: 'gi bleed bleeding hematemesis melena admission' },
      { to: '/rockall-score', name: 'Rockall Score', what: 'Upper GI bleed: rebleeding/mortality (post-endoscopy)', keywords: 'gi bleed endoscopy rebleeding mortality' },
      { to: '/ranson-criteria', name: "Ranson's Criteria", what: 'Pancreatitis severity (admission + 48h)', keywords: 'pancreatitis amylase lipase severity' },
      { to: '/bisap-score', name: 'BISAP', what: 'Pancreatitis severity — usable within 24h', keywords: 'pancreatitis bedside early severity' },
    ],
  },
  {
    title: 'Renal & Electrolytes',
    emoji: '🧪',
    tools: [
      { to: '/findrisc', name: 'Diabetes Risk (FINDRISC)', what: '10-year type-2 diabetes risk — no blood test needed', keywords: 'diabetes findrisc prediabetes glucose prevention screening metabolic' },
      { to: '/creatinine-clearance', name: 'Creatinine Clearance', what: 'Cockcroft-Gault CrCl for renal drug dosing', keywords: 'renal kidney dosing cockcroft gault crcl' },
      { to: '/fena-calculator', name: 'FeNa', what: 'AKI: prerenal vs intrinsic (ATN)', keywords: 'aki acute kidney injury prerenal atn urine sodium' },
      { to: '/pediatric-dka-calculator', name: 'Pediatric DKA Calculator', what: 'Bolus, deficit, maintenance, potassium & insulin infusion for pediatric DKA', keywords: 'pediatric dka diabetic ketoacidosis fluid insulin holliday segar maintenance rehydration anak' },
      { to: '/corrected-calcium', name: 'Corrected Calcium', what: 'Adjust total calcium for low albumin', keywords: 'calcium albumin hypocalcemia' },
      { to: '/serum-osmolality', name: 'Serum Osmolality & Gap', what: 'Osmolal gap — toxic alcohol screen', keywords: 'osmolality toxic alcohol methanol ethylene glycol overdose' },
      { to: '/lab-decoder', name: 'Lab Result Decoder', what: 'Plain-language explanation of common lab panels', keywords: 'lab results panel explain' },
    ],
  },
  {
    title: 'Hematology & VTE Prevention',
    emoji: '🩸',
    tools: [
      { to: '/4ts-score', name: '4Ts Score', what: 'Heparin-induced thrombocytopenia pretest probability', keywords: 'hit heparin thrombocytopenia platelets' },
      { to: '/padua-score', name: 'Padua Score', what: 'VTE prophylaxis decision — medical inpatients', keywords: 'vte prophylaxis medical inpatient lmwh' },
      { to: '/caprini-score', name: 'Caprini Score', what: 'VTE prophylaxis decision — surgical patients', keywords: 'vte prophylaxis surgery surgical' },
    ],
  },
  {
    title: 'Nursing, Prognosis & Pediatrics',
    emoji: '🧑‍⚕️',
    tools: [
      { to: '/braden-scale', name: 'Braden Scale', what: 'Pressure injury (ulcer) risk with intervention tiers', keywords: 'pressure ulcer decubitus nursing skin' },
      { to: '/charlson-index', name: 'Charlson Index', what: 'Comorbidity burden → estimated 10-year survival', keywords: 'comorbidity survival prognosis burden' },
      { to: '/child-growth', name: 'Child Growth Tracker', what: 'Longitudinal WHO growth chart (0-60 months)', keywords: 'pediatric growth who anthropometry stunting' },
      { to: '/ottawa-ankle', name: 'Ottawa Ankle Rules', what: 'Does this ankle/foot injury need an X-ray?', keywords: 'ankle foot xray fracture injury' },
    ],
  },
  {
    title: 'Lifestyle & Screening',
    emoji: '🌱',
    tools: [
      { to: '/reality-check', name: 'Habit Reality Check', what: 'CAGE alcohol screen + smoking pack-years', keywords: 'alcohol smoking cage pack years screening' },
      { to: '/data-lab', name: 'Data Lab', what: 'Upload a CSV of your own health data and chart it', keywords: 'csv upload chart data' },
    ],
  },
  {
    title: 'Fluids, Resuscitation & Clinical Assessment',
    emoji: '💧',
    tools: [
      { to: '/fluid-calculators', name: 'Fluid & Electrolyte Calculators', what: 'Maintenance, resuscitation (sepsis/PALS/Parkland) & electrolyte correction', keywords: 'cairan maintenance rumatan resusitasi cairan elektrolit holliday segar parkland sepsis pals fluid resuscitation electrolyte' },
      { to: '/pediatric-dka-calculator', name: 'Pediatric DKA Calculator', what: 'Bolus, deficit, maintenance, potassium & insulin infusion', keywords: 'pediatric dka anak diabetic ketoacidosis' },
      { to: '/neonatal-resuscitation-guide', name: 'Neonatal Resuscitation (NRP) Guide', what: 'Initial-steps algorithm + Golden Minute timer', keywords: 'resusitasi neonatus neonatal nrp golden minute newborn edukasi' },
      { to: '/empiric-therapy-reference', name: 'Empiric Therapy Reference', what: 'First-line drug classes by diagnosis — searchable quick reference', keywords: 'pemilihan obat berdasarkan diagnosis empiric therapy antibiotic first line drug class' },
      { to: '/dermatology-lesion-mapper', name: 'Dermatology Status & Lesion Mapper', what: 'Morphology + predilection site → classic teaching differential', keywords: 'status dermatologis predileksi lesi dermatology skin lesion morphology differential' },
      { to: '/psychiatric-status-exam', name: 'Psychiatric Status Exam', what: 'Structured Mental Status Exam (MSE) documentation', keywords: 'status psikiatri mental status exam mse psychiatric' },
    ],
  },
]

export function CalculatorHub() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return GROUPS
    return GROUPS.map((g) => ({
      ...g,
      tools: g.tools.filter((t) => (t.name + ' ' + t.what + ' ' + t.keywords).toLowerCase().includes(q)),
    })).filter((g) => g.tools.length > 0)
  }, [q])

  const total = GROUPS.reduce((s, g) => s + g.tools.length, 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Calculator Hub" subtitle={`${total} standalone clinical tools, searchable by what you're trying to do`} />
        <input
          className={`${inputClass} mt-3`}
          placeholder="Search: sepsis, bleeding, liver, pe, dosing…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <p className="mt-2 text-[12px] text-neutral-500">
          Looking for GCS, APGAR, CURB-65, Parkland, ABG, or pediatric dosing? Those live in{' '}
          <a href="#/clinical-calculators" className="font-bold text-brand-dark">Clinical Calculators</a>{' '}
          (40 more tools).
        </p>
      </Card>

      {filtered.length === 0 && (
        <Card className="!p-5 text-center text-sm text-neutral-400">
          Nothing matches "{query}" — try a symptom, organ, or decision (e.g. "bleeding", "liver", "prophylaxis").
        </Card>
      )}

      {filtered.map((g) => (
        <Card key={g.title} className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{g.emoji} {g.title}</div>
          <div className="mt-3 space-y-1.5">
            {g.tools.map((t) => (
              <a key={t.to} href={`#${t.to}`} className="group flex items-start justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 transition hover:bg-brand/10 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink group-hover:text-brand-dark dark:text-white">{t.name}</div>
                  <div className="text-[12px] leading-snug text-neutral-500">{t.what}</div>
                </div>
                <span className="mt-1 shrink-0 text-neutral-300 transition group-hover:text-brand-dark">→</span>
              </a>
            ))}
          </div>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Every tool implements its original published formula with the citation shown on-page.
        Decision-support only — not a substitute for clinical judgment.
      </div>
    </div>
  )
}

export default CalculatorHub
