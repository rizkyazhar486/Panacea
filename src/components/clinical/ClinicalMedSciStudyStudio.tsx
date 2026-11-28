import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cariObat, dosisSkdi, jumlahObat } from '../../lib/obatKatalog'
import { SKDI_DISEASE_LIST, type SkdiDiseaseSystem } from '../../lib/skdiDiseaseList'
import { QUIZ_BANK, TIER_LABEL, type Tier } from '../../lib/quizBank'

type StudioTab = 'medscihub' | 'studyclub' | 'body_bridge'

const SYSTEM_FILTERS: readonly ('All' | SkdiDiseaseSystem)[] = [
  'All',
  'Kardiovaskular',
  'Saraf (Neurologi)',
  'Respirasi',
  'Gastrointestinal & Hepatobilier',
  'Ginjal & Saluran Kemih',
  'Endokrin & Metabolik',
  'Muskuloskeletal',
]

const STUDY_TIERS: readonly Tier[] = [
  'awam',
  'preklinik',
  'koas',
  'dokter_umum',
  'spesialis',
  'subspesialis',
  'profesor',
]

interface BodyBridgeItem {
  readonly id: string
  readonly system: string
  readonly skdiSystem: SkdiDiseaseSystem
  readonly patientSummary: string
  readonly clinicianFocus: string
  readonly bodyRoute: string
  readonly explorerRoute: string
}

const BODY_BRIDGES: readonly BodyBridgeItem[] = [
  {
    id: 'cardiovascular',
    system: 'Cardiovascular',
    skdiSystem: 'Kardiovaskular',
    patientSummary:
      'Heart chambers, valves, and arterial trees regulate blood pressure and oxygen delivery across every organ.',
    clinicianFocus:
      'Verify BP trend, MAP, resting HR, cardiopulmonary auscultation, and ECG/lipid labs before AI-EMR sign-off.',
    bodyRoute: '/fitness-hub',
    explorerRoute: '/body-explorer',
  },
  {
    id: 'nervous',
    system: 'Nervous System',
    skdiSystem: 'Saraf (Neurologi)',
    patientSummary:
      'Cranial nerves, spinal pathways, and autonomic balance coordinate movement, cognition, and sleep recovery.',
    clinicianFocus:
      'Review red-flag neurological exam deficits, Glasgow/NIHSS timeline, sleep debt, and medication sedation.',
    bodyRoute: '/fitness-hub',
    explorerRoute: '/body-explorer',
  },
  {
    id: 'respiratory',
    system: 'Respiratory',
    skdiSystem: 'Respirasi',
    patientSummary:
      'Upper airways, bronchial tree, and alveoli exchange O₂ and CO₂ dynamically with metabolic demand.',
    clinicianFocus:
      'Inspect SpO₂, respiratory rate, auscultation zones, spirometry/imaging context, and trigger exposures.',
    bodyRoute: '/fitness-hub',
    explorerRoute: '/body-explorer',
  },
  {
    id: 'digestive',
    system: 'Digestive & Hepatobiliary',
    skdiSystem: 'Gastrointestinal & Hepatobilier',
    patientSummary:
      'GI lumen, liver, pancreas, and microbiome absorb nutrients and clear endogenous and drug metabolites.',
    clinicianFocus:
      'Check abdominal quadrant findings, hepatic/renal drug metabolism safety, nutrition status, and stool/enzyme trends.',
    bodyRoute: '/fitness-hub',
    explorerRoute: '/body-explorer',
  },
  {
    id: 'renal',
    system: 'Renal & Urinary',
    skdiSystem: 'Ginjal & Saluran Kemih',
    patientSummary:
      'Nephrons filter plasma continuously to balance fluid volume, electrolytes, acid-base status, and blood pressure.',
    clinicianFocus:
      'Confirm eGFR/creatinine before renally cleared prescribing, correlate electrolytes, and check urine microscopy.',
    bodyRoute: '/fitness-hub',
    explorerRoute: '/body-explorer',
  },
  {
    id: 'musculoskeletal',
    system: 'Musculoskeletal',
    skdiSystem: 'Muskuloskeletal',
    patientSummary:
      'Bones, joints, tendons, and skeletal muscle convert mechanical load into posture, gait, and metabolic reserve.',
    clinicianFocus:
      'Inspect joint range, load symmetry, DEXA/injury history, and safe rehab progression before Clearance notes.',
    bodyRoute: '/fitness-hub',
    explorerRoute: '/body-explorer',
  },
]

const QUICK_TOPICS = ['Hipertensi', 'Diabetes', 'Asma', 'Metformin', 'Amoxicillin'] as const

function MedSciHubPanel() {
  const [query, setQuery] = useState('')
  const [systemFilter, setSystemFilter] = useState<'All' | SkdiDiseaseSystem>('All')

  const totalCatalogDrugs = useMemo(() => jumlahObat(), [])

  const matchingDiseases = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = SKDI_DISEASE_LIST.filter((entry) => {
      if (systemFilter !== 'All' && entry.system !== systemFilter) return false
      if (!q) return true
      return (
        entry.disease.toLowerCase().includes(q) ||
        entry.system.toLowerCase().includes(q) ||
        entry.level.toLowerCase().includes(q) ||
        (entry.subsection?.toLowerCase().includes(q) ?? false)
      )
    })
    return { total: filtered.length, items: filtered.slice(0, 10) }
  }, [query, systemFilter])

  const matchingDrugs = useMemo(() => {
    const effectiveQuery = query.trim() || 'met'
    return cariObat(effectiveQuery, 8).map((drug) => ({
      drug,
      skdiDoses: dosisSkdi(drug.nama),
    }))
  }, [query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/55" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search disease, SKDI level, or INN drug (e.g. Hipertensi, Metformin)..."
            aria-label="Search SKDI diseases or INN drugs"
            className="min-h-[44px] w-full rounded-xl border border-white/15 bg-black/50 pl-8 pr-3 text-xs font-semibold text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              data-pmd-native="true"
              onClick={() => setQuery(topic)}
              className={`min-h-[44px] rounded-full border px-3 text-[11px] font-bold transition ${
                query.toLowerCase() === topic.toLowerCase()
                  ? 'border-emerald-400 bg-emerald-500 text-neutral-950'
                  : 'border-white/15 bg-white/5 text-white/80 hover:border-white/40'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Organ system filter">
        {SYSTEM_FILTERS.map((sys) => (
          <button
            key={sys}
            type="button"
            data-pmd-native="true"
            onClick={() => setSystemFilter(sys)}
            aria-pressed={systemFilter === sys}
            className={`min-h-[44px] shrink-0 rounded-full border px-3 text-[11px] font-bold transition ${
              systemFilter === sys
                ? 'border-white bg-white text-neutral-950'
                : 'border-white/15 bg-white/5 text-white/75 hover:border-white/40'
            }`}
          >
            {sys}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <strong className="text-xs font-black uppercase tracking-[.08em] text-emerald-300">
              SKDI 2012 Competency Index
            </strong>
            <span className="font-mono text-[11px] text-white/70">
              {matchingDiseases.total} / {SKDI_DISEASE_LIST.length}
            </span>
          </div>
          {matchingDiseases.items.length === 0 ? (
            <p className="py-3 text-xs text-white/60">
              No matching SKDI conditions for "{query}". Try another term or select "All".
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {matchingDiseases.items.map((entry) => (
                <li key={`${entry.system}-${entry.disease}`} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">{entry.disease}</div>
                    <div className="text-[11px] text-white/60">
                      {entry.system}
                      {entry.subsection ? ` · ${entry.subsection}` : ''}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-cyan-200">
                    SKDI {entry.level}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/learn"
              data-pmd-native="true"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-white/15 px-3 text-xs font-bold text-white/85 hover:border-white/50"
            >
              Open Disease Reference →
            </Link>
            <Link
              to="/med-study"
              data-pmd-native="true"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-white/15 px-3 text-xs font-bold text-white/85 hover:border-white/50"
            >
              Full Medical Library →
            </Link>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <strong className="text-xs font-black uppercase tracking-[.08em] text-cyan-300">
              INN Drug Catalog &amp; SKDI Doses
            </strong>
            <span className="font-mono text-[11px] text-white/70">{totalCatalogDrugs} INN</span>
          </div>
          {matchingDrugs.length === 0 ? (
            <p className="py-3 text-xs text-white/60">
              No INN substance matches "{query}". Use official openFDA/RxNorm lookup for full formulary names.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {matchingDrugs.map(({ drug, skdiDoses }) => (
                <li key={`${drug.huruf}-${drug.nama}`} className="space-y-1 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{drug.nama}</span>
                    <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/75">
                      ATC {drug.huruf}
                      {drug.eml ? ' · WHO EML' : ''}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/70">
                    {drug.kelas} — {drug.untuk}
                  </div>
                  {skdiDoses.length > 0 ? (
                    <div className="rounded bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                      SKDI ref ({skdiDoses[0].keluhan}): {skdiDoses[0].dosis}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-200/85">
                      Offline catalog carries class/indication only — verify dose on official openFDA/RxNorm label.
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/rujukan?t=obat"
              data-pmd-native="true"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-cyan-400/40 px-3 text-xs font-bold text-cyan-200 hover:border-cyan-300"
            >
              Open Live openFDA / RxNorm Drug Reference →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudyClubPanel() {
  const [tier, setTier] = useState<Tier>('dokter_umum')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<boolean | number | null>(null)
  const [stats, setStats] = useState({ answered: 0, correct: 0 })

  const questions = QUIZ_BANK[tier] ?? QUIZ_BANK.awam
  const question = questions[index % questions.length] ?? questions[0]

  const switchTier = (nextTier: Tier) => {
    setTier(nextTier)
    setIndex(0)
    setSelected(null)
  }

  const submitAnswer = (choice: boolean | number) => {
    if (selected !== null) return
    setSelected(choice)
    setStats((prev) => ({
      answered: prev.answered + 1,
      correct: prev.correct + (choice === question.answer ? 1 : 0),
    }))
  }

  const stepQuestion = (delta: number) => {
    setIndex((prev) => (prev + delta + questions.length) % questions.length)
    setSelected(null)
  }

  const isCorrect = selected !== null && selected === question.answer

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="group" aria-label="StudyClub difficulty tier">
          {STUDY_TIERS.map((item) => (
            <button
              key={item}
              type="button"
              data-pmd-native="true"
              aria-pressed={tier === item}
              onClick={() => switchTier(item)}
              className={`min-h-[44px] shrink-0 rounded-full border px-3 text-[11px] font-bold transition ${
                tier === item
                  ? 'border-emerald-400 bg-emerald-500 text-neutral-950'
                  : 'border-white/15 bg-white/5 text-white/80 hover:border-white/40'
              }`}
            >
              {TIER_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="font-mono text-[11px] font-bold text-white/75">
          Session: {stats.correct}/{stats.answered} correct
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/15 bg-black/45 p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] text-white/60">
          <span className="font-bold uppercase tracking-[.08em] text-emerald-300">{TIER_LABEL[tier]}</span>
          <span className="font-mono">
            Case {(index % questions.length) + 1}/{questions.length}
          </span>
        </div>

        <p className="text-sm font-bold leading-relaxed text-white">{question.q}</p>

        {question.type === 'tf' ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Fakta (True)', value: true },
              { label: 'Mitos (False)', value: false },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                data-pmd-native="true"
                disabled={selected !== null}
                onClick={() => submitAnswer(opt.value)}
                className={`min-h-[44px] rounded-xl border px-3 text-left text-xs font-bold transition ${
                  selected === opt.value
                    ? opt.value === question.answer
                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                      : 'border-rose-400 bg-rose-500/25 text-rose-100'
                    : 'border-white/15 bg-white/5 text-white/90 hover:border-white/45'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(question.options ?? []).map((opt, idx) => (
              <button
                key={opt}
                type="button"
                data-pmd-native="true"
                disabled={selected !== null}
                onClick={() => submitAnswer(idx)}
                className={`flex min-h-[44px] w-full items-center rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                  selected === idx
                    ? idx === question.answer
                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                      : 'border-rose-400 bg-rose-500/25 text-rose-100'
                    : selected !== null && idx === question.answer
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                      : 'border-white/15 bg-white/5 text-white/90 hover:border-white/45'
                }`}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            ))}
          </div>
        )}

        {selected !== null && (
          <div
            role="status"
            className={`space-y-1.5 rounded-xl border p-3 text-xs leading-relaxed ${
              isCorrect
                ? 'border-emerald-400/45 bg-emerald-500/10 text-emerald-100'
                : 'border-amber-400/45 bg-amber-500/10 text-amber-100'
            }`}
          >
            <div className="font-black">{isCorrect ? 'Correct — Mechanism:' : 'Review Explanation:'}</div>
            <p className="text-white/90">{question.explanation}</p>
            {question.source && (
              <div className="font-mono text-[10px] text-white/65">Source: {question.source}</div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              data-pmd-native="true"
              onClick={() => stepQuestion(-1)}
              className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-white/85 hover:border-white/40"
            >
              ← Previous
            </button>
            <button
              type="button"
              data-pmd-native="true"
              onClick={() => stepQuestion(1)}
              className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-white/85 hover:border-white/40"
            >
              Next Case →
            </button>
          </div>
          <Link
            to="/med-study"
            data-pmd-native="true"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 px-3 text-xs font-bold text-white/85 hover:border-white/40"
          >
            Open Full StudyClub &amp; Library →
          </Link>
        </div>
      </div>
    </div>
  )
}

function BodyBridgePanel() {
  const [selectedId, setSelectedId] = useState<string>(BODY_BRIDGES[0].id)
  const active = BODY_BRIDGES.find((item) => item.id === selectedId) ?? BODY_BRIDGES[0]

  const skdiCount = useMemo(
    () => SKDI_DISEASE_LIST.filter((entry) => entry.system === active.skdiSystem).length,
    [active.skdiSystem],
  )

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Anatomical bridge system">
        {BODY_BRIDGES.map((item) => (
          <button
            key={item.id}
            type="button"
            data-pmd-native="true"
            aria-pressed={item.id === active.id}
            onClick={() => setSelectedId(item.id)}
            className={`min-h-[44px] shrink-0 rounded-full border px-3 text-xs font-bold transition ${
              item.id === active.id
                ? 'border-white bg-white text-neutral-950'
                : 'border-white/15 bg-white/5 text-white/80 hover:border-white/40'
            }`}
          >
            {item.system}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-white/15 bg-black/45 p-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-300">
            Patient Visual Orientation ({skdiCount} SKDI topics)
          </div>
          <p className="text-xs leading-relaxed text-white/90">{active.patientSummary}</p>
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] font-black uppercase tracking-[.12em] text-cyan-300">
            Clinician Examination &amp; AI-EMR Focus
          </div>
          <p className="text-xs leading-relaxed text-white/90">{active.clinicianFocus}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={active.bodyRoute}
          data-pmd-native="true"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-500 px-4 text-xs font-black text-neutral-950 hover:bg-emerald-400"
        >
          Open in BODY Superpage →
        </Link>
        <Link
          to={active.explorerRoute}
          data-pmd-native="true"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-white/20 bg-white/5 px-4 text-xs font-bold text-white hover:border-white/50"
        >
          Open 3D Anatomy Explorer →
        </Link>
        <Link
          to="/emr"
          data-pmd-native="true"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-white/20 bg-white/5 px-4 text-xs font-bold text-white hover:border-white/50"
        >
          Document in AI-EMR →
        </Link>
        <Link
          to="/clinical-calculators"
          data-pmd-native="true"
          className="inline-flex min-h-[44px] items-center rounded-xl border border-white/20 bg-white/5 px-4 text-xs font-bold text-white hover:border-white/50"
        >
          Clinical Calculators →
        </Link>
      </div>
    </div>
  )
}

export function ClinicalMedSciStudyStudio() {
  const [tab, setTab] = useState<StudioTab>('medscihub')

  return (
    <section
      data-clinical-medsci-studyclub
      aria-label="MedSciHub and StudyClub integrated workspace"
      className="dark space-y-4 rounded-2xl border border-white/15 bg-neutral-950 p-4 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div role="tablist" aria-label="Clinical knowledge modes" className="flex flex-wrap gap-2">
          {(
            [
              ['medscihub', 'MedSciHub (SKDI & Drugs)'],
              ['studyclub', 'StudyClub Quiz'],
              ['body_bridge', 'BODY Visual Bridge'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              data-pmd-native="true"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-[44px] rounded-full border px-4 text-xs font-black transition ${
                tab === id
                  ? 'border-white bg-white text-neutral-950'
                  : 'border-white/15 bg-white/5 text-white/80 hover:border-white/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] font-bold text-amber-200/90">
          Reference &amp; study workspace · clinically_reviewed=false · clinician sign-off required for patient care
        </span>
      </div>

      {tab === 'medscihub' && <MedSciHubPanel />}
      {tab === 'studyclub' && <StudyClubPanel />}
      {tab === 'body_bridge' && <BodyBridgePanel />}
    </section>
  )
}

export default ClinicalMedSciStudyStudio
