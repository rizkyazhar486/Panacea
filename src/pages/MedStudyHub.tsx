import { lazy, Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, Badge } from '../components/ui'
import { RangkaDaftar } from '../components/Rangka'
import { IconBook, IconStethoscope, IconSparkle, IconActivity } from '../components/icons'
import { STUDY_TECHNIQUES, OSCE_TECHNIQUE, MOTIVATION, EXAM_TIMELINE } from '../lib/studyContent'
import { EXAM_INFO, EXAM_ORDER, questionsForExam, type ExamTrack } from '../lib/examBank'

type Section = 'practice' | 'osce' | 'case-bank' | 'station-sim' | 'skills' | 'procedures' | 'therapy' | 'diseases' | 'mnemonik' | 'techniques' | 'timeline'

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'practice', label: 'Question Bank', emoji: '❓' },
  { id: 'osce', label: 'OSCE Technique', emoji: '🩺' },
  { id: 'case-bank', label: 'OSCE Case Bank', emoji: '📋' },
  { id: 'station-sim', label: 'Station Simulator', emoji: '🎭' },
  { id: 'skills', label: 'SKDI Skills Checklist', emoji: '✅' },
  { id: 'procedures', label: 'Keterampilan Klinis', emoji: '🧰' },
  { id: 'therapy', label: 'SKDI Therapy Reference', emoji: '💊' },
  { id: 'diseases', label: 'Daftar Penyakit SKDI', emoji: '📖' },
  { id: 'mnemonik', label: 'Jembatan Keledai', emoji: '🔤' },
  { id: 'techniques', label: 'Cara Belajar', emoji: '🧠' },
  { id: 'timeline', label: 'Exam Plan', emoji: '📅' },
]

// The reference sections carry large data tables (the SKDI disease directory
// alone is ~400 kB of source). Loading them on demand keeps the initial Med
// Study Hub payload small — a user opening the Question Bank never downloads
// the disease notes.
const SkdiSkillsSection = lazy(() => import('./medstudy/SkdiSkillsSection'))
const SkdiTherapySection = lazy(() => import('./medstudy/SkdiTherapySection'))
const SkdiDiseaseDirectorySection = lazy(() => import('./medstudy/SkdiDiseaseDirectorySection'))
const OsceCaseBankSection = lazy(() => import('./medstudy/OsceCaseBankSection'))
const StationSimulatorSection = lazy(() => import('./medstudy/StationSimulatorSection'))
const ClinicalSkillsSection = lazy(() => import('./medstudy/ClinicalSkillsSection'))
const MnemonikSection = lazy(() => import('./medstudy/MnemonikSection'))

function SectionFallback() {
  return <RangkaDaftar jumlah={4} />
}


const SCORE_KEY = 'pmd_medstudy_scores'
interface Scores { [track: string]: { correct: number; total: number } }
function loadScores(): Scores { try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '{}') } catch { return {} } }
function saveScores(s: Scores) { try { localStorage.setItem(SCORE_KEY, JSON.stringify(s)) } catch { /* ignore */ } }

export function MedStudyHub() {
  // Deep link: the home widget sends people straight to a section (and, for the
  // therapy reference, straight to a search) so looking up one drug regimen is
  // one tap instead of open-hub → pick-section → type.
  const [params] = useSearchParams()
  const diminta = params.get('bagian') as Section | null
  const [section, setSection] = useState<Section>(
    diminta && SECTIONS.some((s) => s.id === diminta) ? diminta : 'practice',
  )
  const [motiveIdx, setMotiveIdx] = useState(() => Math.floor(Math.random() * MOTIVATION.length))
  const motive = MOTIVATION[motiveIdx]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* Hero */}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconBook size={20} />}
          title="Med Study Hub"
          subtitle="Untuk OSCE · UKMPPD · koas · PPDS — latihan, teknik & menjaga kewarasan"
        />
        {/* Motivation — honest encouragement for the grind */}
        <div className="mt-3 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/40 p-4">
          <div className="text-2xl">💚</div>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">“{motive.quote}”</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-brand-dark">{motive.context}</span>
            <button
              onClick={() => setMotiveIdx((i) => (i + 1) % MOTIVATION.length)}
              /* h-10: batas bawah sasaran sentuh. Dengan py-1 tingginya hanya
                 26 px. */
              className="flex h-10 shrink-0 items-center rounded-full bg-white/70 px-3 text-[11px] font-bold text-brand-dark transition active:scale-95"
            >
              Kutipan lain →
            </button>
          </div>
        </div>
      </Card>

      {/* Section switcher */}
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            /* h-10: 40 px adalah batas bawah sasaran sentuh. Dengan py-1.5 keping
               ini hanya 30 px, dan pada kisi sepuluh keping yang saling
               berdempetan meleset satu keping berarti membuka bagian lain. */
            className={`flex h-10 items-center rounded-full px-3 text-xs font-bold transition ${section === s.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

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
      </Suspense>
    </div>
  )
}

function PracticeBank() {
  const [track, setTrack] = useState<ExamTrack>('usmle')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [scores, setScores] = useState<Scores>(loadScores)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  // Shuffle the deck per track/seed so repeat sessions aren't identical.
  const questions = useMemo(() => {
    const q = [...questionsForExam(track)]
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(((Math.sin(shuffleSeed + i) + 1) / 2) * (i + 1))
      ;[q[i], q[j]] = [q[j], q[i]]
    }
    return q
  }, [track, shuffleSeed])

  const q = questions[qIdx % Math.max(questions.length, 1)]
  const info = EXAM_INFO[track]
  const score = scores[track] ?? { correct: 0, total: 0 }

  function pick(track: ExamTrack) { setTrack(track); setQIdx(0); setSelected(null); setShuffleSeed((s) => s + 1) }
  function answer(i: number) {
    if (selected !== null || !q) return
    setSelected(i)
    const correct = i === q.answer
    const next = { ...scores, [track]: { correct: score.correct + (correct ? 1 : 0), total: score.total + 1 } }
    setScores(next); saveScores(next)
  }
  function next() { setQIdx((i) => i + 1); setSelected(null) }

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black text-ink">❓ Practice Questions</div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-500">Score: {score.correct}/{score.total}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAM_ORDER.map((t) => (
          <button key={t} onClick={() => pick(t)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${track === t ? 'bg-ink text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            {EXAM_INFO[t].flag} {EXAM_INFO[t].examName.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 p-2.5 text-[11px] text-neutral-500">
        <span className="font-bold text-neutral-700">{info.examName}</span> · {info.body}
        <div className="mt-0.5">{info.format}</div>
      </div>

      {q && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{q.vignette}</p>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answer
              const isChosen = i === selected
              const show = selected !== null
              return (
                <button key={i} onClick={() => answer(i)} disabled={show}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                    show && isAnswer ? 'border-brand bg-brand-50 font-semibold text-brand-dark'
                    : show && isChosen ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-neutral-200 hover:bg-neutral-50'
                  }`}>
                  <span className="mr-1.5 font-bold">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              )
            })}
          </div>
          {selected !== null && (
            <div className="mt-3 rounded-xl bg-neutral-50 p-3">
              <div className="mb-1 text-xs font-black text-ink">{selected === q.answer ? '✓ Correct' : '✗ Not quite'}</div>
              <p className="text-[13px] leading-relaxed text-neutral-600">{q.explanation}</p>
              <button onClick={next} className="mt-3 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition active:scale-95">Next question →</button>
            </div>
          )}
        </>
      )}

      <Prosa kelas="mt-4 text-[10px] leading-relaxed text-neutral-500">Ini soal latihan asli yang ditulis mengikuti format dan cetak biru tiap ujian — bukan soal ujian sungguhan atau bocoran, yang hak ciptanya dipegang penyelenggara masing-masing. Bagi peserta UKMPPD: bank soal USMLE dan PLAB mengikuti kemampuan penalaran klinis dan cetak biru yang sama dengan yang menjadi acuan UKMPPD.</Prosa>
    </Card>
  )
}

function OsceSection() {
  return (
    <div className="space-y-3">
      <Card className="!p-4">
        <SectionTitle icon={<IconStethoscope size={20} />} title="OSCE Station Technique" subtitle="Marks are for observable behaviours — technique is as scoreable as knowledge" />
      </Card>
      {OSCE_TECHNIQUE.map((tip) => (
        <Card key={tip.station} className="!p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">{tip.emoji}</span>
            <span className="text-sm font-black text-ink">{tip.station}</span>
          </div>
          <ul className="space-y-2">
            {tip.points.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-neutral-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}

function TechniquesSection() {
  return (
    <div className="space-y-3">
      <Card className="!p-4">
        <SectionTitle icon={<IconSparkle size={20} />} title="Cara Belajar" subtitle="Evidence-based methods, ordered by effect size in the learning-science literature" />
      </Card>
      {STUDY_TECHNIQUES.map((t) => (
        <Card key={t.title} className="!p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xl">{t.emoji}</span>
            <span className="text-sm font-black text-ink">{t.title}</span>
          </div>
          <p className="text-[13px] leading-relaxed text-neutral-700"><b className="text-neutral-500">How:</b> {t.how}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600"><b className="text-neutral-500">Why it works:</b> {t.why}</p>
        </Card>
      ))}
    </div>
  )
}

function TimelineSection() {
  return (
    <div className="space-y-3">
      <Card className="!p-4">
        <SectionTitle icon={<IconActivity size={20} />} title="Countdown Plan" subtitle="An operational plan for the weeks before OSCE / UKMPPD" />
      </Card>
      {EXAM_TIMELINE.map((item, i) => (
        <Card key={item.title} className="!p-4">
          <div className="flex items-center gap-2">
            <Badge tone={i >= EXAM_TIMELINE.length - 2 ? 'critical' : 'brand'}>{item.title}</Badge>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{item.body}</p>
        </Card>
      ))}
    </div>
  )
}

export default MedStudyHub
