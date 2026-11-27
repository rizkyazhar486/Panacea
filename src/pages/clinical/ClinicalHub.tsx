import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PanaceaZoneNav } from '../../components/PanaceaZoneNav'
import { SuperPageCapabilityRail } from '../../components/SuperPageCapabilityRail'
import { SurfaceDepthNavigator } from '../../components/SurfaceDepthNavigator'
import { ClinicalPatientContext } from '../../components/ClinicalPatientContext'
import { LabPasienUntukDokter } from '../../components/LabPasienUntukDokter'
import { StudiValidasiKlinis } from '../../components/StudiValidasiKlinis'
import { useStore } from '../../lib/store'
import { PersonalBodyUnifiedSurface } from '../../components/PersonalBodyUnifiedSurface'
import { SurfaceGuide } from '../../components/SurfaceGuide'
import { MentalHealthClinicalResearchLab } from '../../components/MentalHealthClinicalResearchLab'
import { Fold } from '../../shared/ui/Fold'
import { WhenOpened } from '../../shared/ui/WhenOpened'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { readUnifiedLocalVitals } from '../../domains/identity/localRecovery'

const ClinicalInteropSection = lazy(() => import('./ClinicalInteropSection'))
const ClinicalToClaimShieldWorkbench = lazy(() => import('../../components/clinical/ClinicalToClaimShieldWorkbench'))
const ClinicalMedSciStudyStudio = lazy(() => import('../../components/clinical/ClinicalMedSciStudyStudio'))

export const GROUPS = [
  {
    name: 'Clinical',
    tools: [
      { to: '/visit-os', name: 'Visit OS', kw: 'doctor visit camera medical device realtime ai emr' },
      { to: '/body-explorer', name: 'Body Explorer', kw: 'anatomy physiology imaging atlas' },
      { to: '/frontier-health', name: 'Discovery & Innovation', kw: 'research discovery invention simulation' },
      { to: '/genome-lab', name: 'Genome Databank', kw: 'gene genome dna variant genetics' },
      { to: '/rujukan?t=obat', name: 'Drugs', kw: 'drug medication pharmacology mechanism safety' },
      { to: '/med-study', name: 'Medical Library', kw: 'library evidence guideline journal' },
      { to: '/chatbot', name: 'Ask Health', kw: 'health question ai clinical assistant' },
      { to: '/emr', name: 'AI-EMR', kw: 'medical record longitudinal care documentation' },
      { to: '/doctor-review', name: 'Doctor Review Checklist', kw: 'doctor human review checklist clinical notes provenance safety' },
      { to: '/doctor-review/lab-results', name: 'Lab Result Review', kw: 'lab result review queue clinician communicate close backend audit' },
      { to: '/doctor-review/body', name: 'Body Structure Review', kw: 'doctor review checklist anatomy body structure clinical review ledger body exposure' },
      { to: '/clinical-calculators', name: 'Calculators & Lab', kw: 'calculator laboratory clinical score' },
      { to: '/learn', name: 'Learn & Look Up', kw: 'learn lookup study reference' },
    ],
  },
]

type Calculator = 'bmi' | 'map'

const PRIMARY_ACTIONS = [
  { to: '/visit-os', label: 'Visit OS' },
  { to: '/emr', label: 'AI-EMR' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/care-episode', label: 'Care' },
  { to: '/body-explorer', label: 'Body Explorer' },
  { to: '/med-study', label: 'MedSciHub' },
] as const

const CLINICAL_DEPTH_ROUTES = {
  overview: '/clinical-hub',
  condition: '/learn',
  mechanism: '/body-explorer',
  assessment: '/clinical-calculators',
  management: '/rujukan?t=empiris',
  coding: '/emr',
  evidence: '/evidence',
} as const

const REFERENCE_LINKS = [
  { to: '/learn', label: 'Diseases' },
  { to: '/clinical-calculators', label: 'Calculators' },
  { to: '/radiology', label: 'Imaging' },
  { to: '/rujukan?t=obat', label: 'Doses & Drugs' },
  { to: '/rujukan?t=empiris', label: 'Management' },
  { to: '/emr', label: 'ICD-10 ↔ 11' },
  { to: '/evidence', label: 'Evidence' },
  { to: '/med-study', label: 'Library' },
] as const

export function ClinicalHub() {
  const { account, activePatient, state } = useStore()
  const [calculator, setCalculator] = useState<Calculator>('bmi')
  const [question, setQuestion] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [sbp, setSbp] = useState('')
  const [dbp, setDbp] = useState('')
  const [lab, setLab] = useState('')
  const [low, setLow] = useState('')
  const [high, setHigh] = useState('')
  const [rev, setRev] = useState(0)


  useEffect(() => {
    const refresh = () => setRev((x) => x + 1)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('panacea:body-character-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('panacea:body-character-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const vitals = useMemo(() => {
    void rev
    const current = readUnifiedLocalVitals(account, {
      patient: activePatient,
      patientVitals: activePatient?.id ? state.vitals[activePatient.id] : undefined,
      sleepLogs: state.sleepLogs,
    })
    return {
      ...current,
      weightKg: Number(weight) > 0 ? Number(weight) : current.weightKg,
      heightCm: Number(height) > 0 ? Number(height) : current.heightCm,
      systolic: Number(sbp) > 0 ? Number(sbp) : current.systolic,
      diastolic: Number(dbp) > 0 ? Number(dbp) : current.diastolic,
    }
  }, [account, activePatient, state.vitals, state.sleepLogs, weight, height, sbp, dbp, rev])

  const emrCount = activePatient?.id && state.records[activePatient.id] ? 1 : 0

  const bmi = useMemo(() => {
    const kg = Number(weight)
    const cm = Number(height)
    return kg > 0 && cm > 0 ? kg / ((cm / 100) ** 2) : null
  }, [height, weight])
  const map = useMemo(() => {
    const systolic = Number(sbp)
    const diastolic = Number(dbp)
    return systolic > 0 && diastolic > 0 ? (systolic + 2 * diastolic) / 3 : null
  }, [sbp, dbp])
  const labState = useMemo(() => {
    const value = Number(lab)
    const min = Number(low)
    const max = Number(high)
    if (!lab || !low || !high || ![value, min, max].every(Number.isFinite)) return '—'
    if (value < min) return 'LOW'
    if (value > max) return 'HIGH'
    return 'IN RANGE'
  }, [high, lab, low])

  const handoffQuestion = () => {
    const draft = question.trim()
    if (draft) window.sessionStorage.setItem('pm_chat_draft', draft)
  }

  return (
    // `dark` bukan hiasan di sini. Permukaan ini memang ruang komando gelap
    // apa pun tema aplikasinya, sementara tema aplikasi bisa saja terang —
    // dan seluruh gaya `dark:` serta lapisan pemetaan `.dark` di index.css
    // dipasang pada kelas itu. Tanpa penandanya, setiap komponen di dalam
    // sini merender versi TERANGnya di atas latar gelap: panduan "How to
    // use" muncul sebagai lempengan putih menyilaukan pada halaman hitam.
    <div className="dark mx-auto w-full max-w-[1380px] space-y-8 pb-20 text-white">
      <PanaceaZoneNav />

      <main aria-label="Clinical command surface" className="space-y-9">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h1 className="truncate text-2xl font-black tracking-[-.04em] sm:text-3xl">Clinical</h1>
          <span className="shrink-0 text-[9px] font-black uppercase tracking-[.14em] text-[#a7f3d0]">clinician-in-loop</span>
        </header>
        <BatasKlaimKesehatan
          permukaan="clinical.hub"
          className="mt-0 text-[11px] leading-snug text-white/55"
        />

        <section aria-label="Ask and record" className="border-b border-white/10 pb-8">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px]">
            <label className="flex min-h-[52px] items-center gap-3 border-b border-white/20 px-1 focus-within:border-white/70">
              <span className="text-white/38" aria-hidden>✦</span>
              <span className="sr-only">Ask Panacea</span>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask Panacea"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-white/30"
              />
            </label>
            <Link
              to="/chatbot"
              onClick={handoffQuestion}
              className="grid min-h-[52px] place-items-center rounded-full bg-white px-4 text-xs font-black text-black transition active:scale-[.98]"
            >
              Ask →
            </Link>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-x-5 sm:grid-cols-6" aria-label="Primary clinical actions">
            {PRIMARY_ACTIONS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-h-[48px] items-center justify-between border-b border-white/10 text-xs font-black text-white/72 transition hover:text-white"
              >
                <span>{item.label}</span>
                <span aria-hidden>→</span>
              </Link>
            ))}
          </nav>
          {(account?.role === 'dokter' || account?.isOwner) && (
            <Link
              to="/doctor-review"
              className="mt-4 flex min-h-[48px] items-center justify-between border-y border-white/10 text-xs font-black text-emerald-200/80 transition hover:text-emerald-100"
            >
              <span>Doctor Review Checklist</span>
              <span aria-hidden>→</span>
            </Link>
          )}
          {(account?.role === 'dokter' || account?.isOwner) && (
            <Link
              to="/doctor-review/lab-results"
              className="flex min-h-[48px] items-center justify-between border-b border-white/10 text-xs font-black text-emerald-200/80 transition hover:text-emerald-100"
            >
              <span>Lab Result Review</span>
              <span aria-hidden>→</span>
            </Link>
          )}
          {(account?.role === 'dokter' || account?.isOwner) && (
            <Link
              to="/doctor-review/body"
              className="flex min-h-[48px] items-center justify-between border-b border-white/10 text-xs font-black text-emerald-200/80 transition hover:text-emerald-100"
            >
              <span>Body Structure Review</span>
              <span aria-hidden>→</span>
            </Link>
          )}
        </section>

        <Fold label="Calculators">
        <section className="grid gap-8 lg:grid-cols-2" aria-label="Clinical quick tools">
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm">Calculator</strong>
              <Link to="/clinical-calculators" className="inline-flex min-h-[44px] items-center text-[10px] font-black text-white/45 hover:text-white">All calculators →</Link>
            </div>

            <div className="mt-4 flex gap-5" role="tablist" aria-label="Quick calculator">
              {(['bmi', 'map'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={calculator === item}
                  onClick={() => setCalculator(item)}
                  className={`min-h-[44px] border-b px-1 text-[10px] font-black uppercase tracking-[.12em] ${calculator === item ? 'border-white text-white' : 'border-transparent text-white/38'}`}
                >
                  {item}
                </button>
              ))}
            </div>

            {calculator === 'bmi' ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="border-b border-white/10 pb-2">
                  <span className="block text-[9px] font-black uppercase tracking-[.12em] text-white/35">Weight · kg</span>
                  <input inputMode="decimal" type="number" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="—" className="mt-2 w-full bg-transparent text-lg font-black outline-none placeholder:text-white/20" />
                </label>
                <label className="border-b border-white/10 pb-2">
                  <span className="block text-[9px] font-black uppercase tracking-[.12em] text-white/35">Height · cm</span>
                  <input inputMode="decimal" type="number" value={height} onChange={(event) => setHeight(event.target.value)} placeholder="—" className="mt-2 w-full bg-transparent text-lg font-black outline-none placeholder:text-white/20" />
                </label>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="border-b border-white/10 pb-2">
                  <span className="block text-[9px] font-black uppercase tracking-[.12em] text-white/35">SBP</span>
                  <input inputMode="numeric" type="number" value={sbp} onChange={(event) => setSbp(event.target.value)} placeholder="—" className="mt-2 w-full bg-transparent text-lg font-black outline-none placeholder:text-white/20" />
                </label>
                <label className="border-b border-white/10 pb-2">
                  <span className="block text-[9px] font-black uppercase tracking-[.12em] text-white/35">DBP</span>
                  <input inputMode="numeric" type="number" value={dbp} onChange={(event) => setDbp(event.target.value)} placeholder="—" className="mt-2 w-full bg-transparent text-lg font-black outline-none placeholder:text-white/20" />
                </label>
              </div>
            )}

            <output className="mt-5 block text-4xl font-black tracking-[-.05em] tabular-nums">
              {calculator === 'bmi'
                ? bmi == null ? '—' : bmi.toFixed(1)
                : map == null ? '—' : `${Math.round(map)} mmHg`}
            </output>
            <div className="mt-1 truncate text-[9px] font-bold text-white/30">
              {calculator === 'bmi' ? 'BMI = kg ÷ m²' : 'MAP = (SBP + 2×DBP) ÷ 3'}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm">Lab range</strong>
              <Link to="/data-lab" className="inline-flex min-h-[44px] items-center text-[10px] font-black text-white/45 hover:text-white">Data lab →</Link>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Value', value: lab, set: setLab },
                { label: 'Low', value: low, set: setLow },
                { label: 'High', value: high, set: setHigh },
              ].map((item) => (
                <label key={item.label} className="border-b border-white/10 pb-2">
                  <span className="block text-[9px] font-black uppercase tracking-[.12em] text-white/35">{item.label}</span>
                  <input
                    inputMode="decimal"
                    value={item.value}
                    onChange={(event) => item.set(event.target.value)}
                    className="mt-2 w-full bg-transparent text-lg font-black outline-none"
                  />
                </label>
              ))}
            </div>

            <output aria-live="polite" className="mt-5 block text-3xl font-black tracking-[-.04em]">{labState}</output>
          </div>
        </section>

        <WhenOpened>
          <Suspense fallback={<div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">Loading clinical workbench…</div>}>
            <ClinicalInteropSection
              vitals={vitals}
              activePatient={activePatient}
              account={account}
              emrCount={emrCount}
              rev={rev}
            />
          </Suspense>
        </WhenOpened>
        </Fold>

        <Fold label="Claim Shield" subtitle="BPJS · iDRG">
        <WhenOpened>
          <Suspense fallback={<div className="py-4 text-xs text-white/50">Loading Clinical-to-Claim Shield…</div>}>
            <ClinicalToClaimShieldWorkbench />
          </Suspense>
        </WhenOpened>
        </Fold>

        <Fold label="Research">
        <MentalHealthClinicalResearchLab />
        </Fold>

        <Fold label="MedSciHub & StudyClub" subtitle="732 SKDI · INN Drugs · StudyClub Quiz · BODY Bridge">
        <WhenOpened>
          <Suspense fallback={<div className="py-4 text-xs text-white/60">Loading MedSciHub &amp; StudyClub…</div>}>
            <ClinicalMedSciStudyStudio />
          </Suspense>
        </WhenOpened>
        </Fold>

        <Fold label="Patient">
        <ClinicalPatientContext />
        </Fold>

        <Fold label="Depth">
        <SurfaceDepthNavigator surface="clinical" routes={CLINICAL_DEPTH_ROUTES} />
        </Fold>

        {account?.role === 'dokter' && <LabPasienUntukDokter />}
        {(account?.role === 'dokter' || account?.isOwner) && <StudiValidasiKlinis pemimpin={!!account?.isOwner} />}

        {/* Tubuh ditaruh SETELAH aksi klinis. Permukaan tubuh setinggi ~4.400px
            pada 390px; di atas, ia mendorong "Ask Panacea", aksi utama dan
            kalkulator ke y~5.000 — enam layar gulir sebelum pemakai klinis
            bisa melakukan apa pun. */}
        <Fold label="Guide">
        <SurfaceGuide
          summary="see the body → ask one question → record only reviewed facts"
          steps={[
            'Use the body surface to orient the region and system.',
            'Ask Panacea for sourced context, not an autonomous diagnosis.',
            'Promote findings into AI-EMR only after clinician review.',
          ]}
        />
        </Fold>

        <PersonalBodyUnifiedSurface compact defaultFocus="clinical" shareable={false} cameraCapture={false} />

        <Fold label="Frontier & Surgical OS">
          <div className="space-y-3 border-t border-white/10 pt-3">
            <p className="text-[11px] leading-snug text-white/65">
              Clinician-in-loop workflow links: pre-arrival zero-queue triage, draft AI-EMR sign-off, 3D/4D anatomical &amp; surgical simulation, and low-bandwidth 2G/Starlink sync (simulation &amp; draft only; clinical authority remains with licensed doctors).
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/doctor-review"
                className="flex min-h-[48px] flex-col justify-center rounded-xl border border-emerald-400/35 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white transition hover:border-emerald-400"
              >
                <span>AI + Human Doctor Step-In</span>
                <span className="text-[10px] font-normal text-emerald-300">Review &amp; sign draft notes / labs →</span>
              </Link>
              <Link
                to="/emergency"
                className="flex min-h-[48px] flex-col justify-center rounded-xl border border-cyan-400/30 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white transition hover:border-cyan-400"
              >
                <span>Zero-Queue Triage &amp; Emergency OS</span>
                <span className="text-[10px] font-normal text-cyan-300">Live triage routing &amp; escalation →</span>
              </Link>
              <Link
                to="/body-explorer"
                className="flex min-h-[48px] flex-col justify-center rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white transition hover:border-emerald-400"
              >
                <span>3D/4D Anatomy &amp; Surgical Orientation</span>
                <span className="text-[10px] font-normal text-white/65">Interactive anatomical simulation studio →</span>
              </Link>
              <Link
                to="/frontier-health"
                className="flex min-h-[48px] flex-col justify-center rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white transition hover:border-cyan-400"
              >
                <span>Frontier Multiscale &amp; Bio-Discovery</span>
                <span className="text-[10px] font-normal text-white/65">Research &amp; multiscale physiology hub →</span>
              </Link>
            </div>
          </div>
        </Fold>

        <nav aria-label="Clinical references" className="border-y border-white/10">
          <div className="flex gap-6 overflow-x-auto py-1 no-scrollbar">
            {REFERENCE_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-h-[48px] shrink-0 items-center gap-2 text-xs font-black text-white/55 transition hover:text-white"
              >
                {item.label}<span aria-hidden>↗</span>
              </Link>
            ))}
          </div>
        </nav>
      </main>

      <Fold label="Capabilities"><SuperPageCapabilityRail domain="clinical" initialLimit={28} /></Fold>
    </div>
  )
}

export default ClinicalHub
