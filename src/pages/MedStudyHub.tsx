import { lazy, Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Prosa } from '../components/Prosa'
import { Card, Badge } from '../components/ui'
import { RangkaDaftar } from '../components/Rangka'
import { StudyStartPanel, type StudyStartSection } from '../components/medstudy/StudyStartPanel'
import { STUDY_TECHNIQUES, OSCE_TECHNIQUE, MOTIVATION, EXAM_TIMELINE } from '../lib/studyContent'
import { EXAM_INFO, EXAM_ORDER, questionsForExam, type ExamTrack } from '../lib/examBank'
import '../styles/panacea2026.css'

type Section = 'practice' | 'osce' | 'case-bank' | 'station-sim' | 'skills' | 'procedures' | 'therapy' | 'diseases' | 'mnemonik' | 'techniques' | 'timeline' | 'usmle'

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'practice', label: 'Questions', emoji: '❓' },
  { id: 'diseases', label: 'Diseases', emoji: '🧬' },
  { id: 'therapy', label: 'Drugs & Therapy', emoji: '💊' },
  { id: 'osce', label: 'OSCE', emoji: '🩺' },
  { id: 'case-bank', label: 'Cases', emoji: '📋' },
  { id: 'station-sim', label: 'Simulator', emoji: '🎭' },
  { id: 'skills', label: 'SKDI Skills', emoji: '✅' },
  { id: 'procedures', label: 'Procedures', emoji: '🧰' },
  { id: 'mnemonik', label: 'Memory', emoji: '🔗' },
  { id: 'techniques', label: 'Study Method', emoji: '🧠' },
  { id: 'usmle', label: 'Foundations', emoji: '🎓' },
  { id: 'timeline', label: 'Exam Plan', emoji: '📅' },
]

const SkdiSkillsSection = lazy(() => import('./medstudy/SkdiSkillsSection'))
const SkdiTherapySection = lazy(() => import('./medstudy/SkdiTherapySection'))
const SkdiDiseaseDirectorySection = lazy(() => import('./medstudy/SkdiDiseaseDirectorySection'))
const OsceCaseBankSection = lazy(() => import('./medstudy/OsceCaseBankSection'))
const StationSimulatorSection = lazy(() => import('./medstudy/StationSimulatorSection'))
const ClinicalSkillsSection = lazy(() => import('./medstudy/ClinicalSkillsSection'))
const MnemonikSection = lazy(() => import('./medstudy/MnemonikSection'))
const UsmleSection = lazy(() => import('./medstudy/UsmleSection'))

const SCORE_KEY = 'pmd_medstudy_scores'
interface Scores { [track: string]: { correct: number; total: number } }
function loadScores(): Scores { try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '{}') } catch { return {} } }
function saveScores(scores: Scores) { try { localStorage.setItem(SCORE_KEY, JSON.stringify(scores)) } catch { /* unavailable */ } }

function SectionFallback() { return <RangkaDaftar jumlah={4} /> }

export function MedStudyHub() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('bagian') as Section | null
  const [section, setSectionState] = useState<Section>(requested && SECTIONS.some((s) => s.id === requested) ? requested : 'practice')
  const motivation = useMemo(() => MOTIVATION[new Date().getDate() % Math.max(MOTIVATION.length, 1)], [])

  function setSection(next: Section) {
    setSectionState(next)
    const updated = new URLSearchParams(params)
    updated.set('bagian', next)
    setParams(updated, { replace: true })
  }

  return (
    <main className="panacea-app-surface mx-auto max-w-5xl space-y-4 px-3 pb-24 pt-2 sm:px-5">
      <section className="panacea-dashboard-hero p-5 sm:p-7">
        <div className="relative z-10 max-w-3xl">
          <div className="panacea-kicker">PanaceaMed learning system</div>
          <h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">Learn difficult medicine without making the interface difficult.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/58">The existing disease, therapy, question, OSCE and foundational datasets stay available. The interface now starts with your intention and explanation depth instead of a wall of categories.</p>
          {motivation && <div className="mt-5 inline-flex max-w-xl rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-xs leading-relaxed text-white/65">“{motivation.quote}”</div>}
        </div>
      </section>

      <StudyStartPanel onSelect={(next: StudyStartSection) => setSection(next)} current={section} />

      <section className="liquid-panel p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Full library</div><div className="text-[10px] text-neutral-400">Nothing removed · reorganized by purpose</div></div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-black transition ${section === item.id ? 'border-[#d8bb70]/35 bg-[#d8bb70]/12 text-[#8a6a20] dark:text-[#f0d68a]' : 'border-black/[.05] bg-white/45 text-neutral-500 dark:border-white/10 dark:bg-white/[.035] dark:text-white/50'}`}>{item.emoji} {item.label}</button>)}
        </div>
      </section>

      {section === 'practice' && <PracticeBank />}
      {section === 'osce' && <OsceSection />}
      {section === 'techniques' && <TechniquesSection />}
      {section === 'timeline' && <TimelineSection />}

      <Suspense fallback={<SectionFallback />}>
        {section === 'case-bank' && <OsceCaseBankSection />}
        {section === 'station-sim' && <StationSimulatorSection />}
        {section === 'skills' && <SkdiSkillsSection />}
        {section === 'procedures' && <ClinicalSkillsSection />}
        {section === 'therapy' && <SkdiTherapySection cariAwal={params.get('cari') ?? ''} />}
        {section === 'diseases' && <SkdiDiseaseDirectorySection />}
        {section === 'mnemonik' && <MnemonikSection />}
        {section === 'usmle' && <UsmleSection cariAwal={params.get('cari') ?? ''} />}
      </Suspense>
    </main>
  )
}

function PracticeBank() {
  const [track, setTrack] = useState<ExamTrack>('usmle')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [scores, setScores] = useState<Scores>(loadScores)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  const questions = useMemo(() => {
    const deck = [...questionsForExam(track)]
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(((Math.sin(shuffleSeed + i) + 1) / 2) * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
  }, [track, shuffleSeed])

  const q = questions[qIdx % Math.max(questions.length, 1)]
  const info = EXAM_INFO[track]
  const score = scores[track] ?? { correct: 0, total: 0 }

  function pick(next: ExamTrack) { setTrack(next); setQIdx(0); setSelected(null); setShuffleSeed((s) => s + 1) }
  function answer(i: number) {
    if (selected !== null || !q) return
    setSelected(i)
    const next = { ...scores, [track]: { correct: score.correct + (i === q.answer ? 1 : 0), total: score.total + 1 } }
    setScores(next); saveScores(next)
  }

  return (
    <Card className="!p-4 sm:!p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-black text-ink">Practice by reasoning, not recognition</div><p className="mt-1 text-xs text-neutral-500">Answer first. Explanation appears after commitment.</p></div><Badge tone="brand">{score.correct}/{score.total}</Badge></div>
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{EXAM_ORDER.map((item) => <button key={item} onClick={() => pick(item)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black ${track === item ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-500'}`}>{EXAM_INFO[item].flag} {EXAM_INFO[item].examName.split(' ')[0]}</button>)}</div>
      <div className="mt-3 rounded-2xl bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-500"><b>{info.examName}</b> · {info.format}</div>
      {q && <><p className="mt-5 text-sm leading-relaxed text-neutral-700">{q.vignette}</p><div className="mt-3 grid gap-2">{q.options.map((opt, i) => { const show = selected !== null; const correct = i === q.answer; const chosen = i === selected; return <button key={i} disabled={show} onClick={() => answer(i)} className={`rounded-2xl border p-3 text-left text-sm transition ${show && correct ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800' : show && chosen ? 'border-red-300 bg-red-50 text-red-700' : 'border-neutral-200 hover:bg-neutral-50'}`}><b className="mr-2">{String.fromCharCode(65 + i)}.</b>{opt}</button> })}</div>{selected !== null && <div className="mt-3 rounded-2xl bg-neutral-50 p-4"><div className="text-xs font-black text-ink">{selected === q.answer ? '✓ Correct' : 'Why the better answer wins'}</div><p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{q.explanation}</p><button onClick={() => { setQIdx((i) => i + 1); setSelected(null) }} className="mt-3 w-full rounded-full bg-neutral-900 py-3 text-sm font-black text-white">Next question →</button></div>}</>}
      <Prosa kelas="mt-4 text-[10px] leading-relaxed text-neutral-500">Practice items are original educational questions following exam style and blueprint; they are not leaked or reproduced examination material.</Prosa>
    </Card>
  )
}

function OsceSection() {
  return <div className="grid gap-3 md:grid-cols-2">{OSCE_TECHNIQUE.map((tip) => <Card key={tip.station} className="!p-4"><div className="flex items-center gap-2"><span className="text-xl">{tip.emoji}</span><span className="text-sm font-black text-ink">{tip.station}</span></div><ul className="mt-3 space-y-2">{tip.points.map((point, i) => <li key={i} className="flex gap-2 text-xs leading-relaxed text-neutral-600"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{point}</li>)}</ul></Card>)}</div>
}

function TechniquesSection() {
  return <div className="grid gap-3 md:grid-cols-2">{STUDY_TECHNIQUES.map((item) => <Card key={item.title} className="!p-4"><div className="text-sm font-black text-ink">{item.emoji} {item.title}</div><p className="mt-2 text-xs leading-relaxed text-neutral-700"><b>How:</b> {item.how}</p><p className="mt-2 text-xs leading-relaxed text-neutral-500"><b>Why:</b> {item.why}</p></Card>)}</div>
}

function TimelineSection() {
  return <div className="space-y-3">{EXAM_TIMELINE.map((item, i) => <Card key={item.title} className="!p-4"><Badge tone={i >= EXAM_TIMELINE.length - 2 ? 'critical' : 'brand'}>{item.title}</Badge><p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.body}</p></Card>)}</div>
}

export default MedStudyHub
