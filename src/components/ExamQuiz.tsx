import { useEffect, useMemo, useState } from 'react'
import { EXAM_INFO, EXAM_ORDER, questionsForExam, type ExamTrack } from '../lib/examBank'

const SCORE_KEY = 'pmd_exam_scores'
interface Scores { [track: string]: { correct: number; total: number } }
function loadScores(): Scores { try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '{}') } catch { return {} } }
function saveScores(s: Scores) { try { localStorage.setItem(SCORE_KEY, JSON.stringify(s)) } catch { /* ignore */ } }

// Practice bank for international medical licensing exams — vignette-style
// MCQ modeled on each exam's real format, grouped by country. See
// lib/examBank.ts header for the important "these are original practice
// questions, not real past papers" disclosure.
export function ExamQuiz() {
  const [track, setTrack] = useState<ExamTrack>('usmle')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [scores, setScores] = useState<Scores>(loadScores)

  const info = EXAM_INFO[track]
  const questions = useMemo(() => questionsForExam(track), [track])
  const q = questions[qIdx % Math.max(questions.length, 1)]
  const score = scores[track] ?? { correct: 0, total: 0 }

  useEffect(() => { setQIdx(0); setSelected(null) }, [track])

  function answer(i: number) {
    if (selected !== null || !q) return
    setSelected(i)
    const correct = i === q.answer
    const next = { ...scores, [track]: { correct: score.correct + (correct ? 1 : 0), total: score.total + 1 } }
    setScores(next)
    saveScores(next)
  }
  function next() { setQIdx((i) => i + 1); setSelected(null) }

  if (!q) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black text-ink">🎓 Latihan Ujian Dokter Internasional</div>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">Skor: {score.correct}/{score.total}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXAM_ORDER.map((t) => (
          <button key={t} onClick={() => setTrack(t)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${track === t ? 'bg-ink text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            {EXAM_INFO[t].flag} {EXAM_INFO[t].country}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-neutral-50 p-2.5 text-[11px] text-neutral-500">
        <span className="font-bold text-neutral-700">{info.examName}</span> · {info.body}
        <div className="mt-0.5">{info.format}</div>
      </div>

      <p className="text-sm leading-relaxed text-neutral-700">{q.vignette}</p>

      <div className="space-y-1.5">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer
          const isPicked = selected === i
          const tone = selected === null ? 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            : isAnswer ? 'bg-brand/15 text-brand-dark font-bold'
            : isPicked ? 'bg-rose-50 text-rose-600' : 'bg-neutral-50 text-neutral-400'
          return (
            <button key={i} onClick={() => answer(i)} disabled={selected !== null}
              className={`block w-full rounded-xl px-3 py-2 text-left text-xs transition disabled:cursor-default ${tone}`}>
              {opt}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className={`rounded-xl border p-3 text-[12px] leading-relaxed ${selected === q.answer ? 'border-brand/20 bg-brand-50/60 text-brand-dark' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          <div className="font-bold">{selected === q.answer ? '✓ Benar!' : '✕ Kurang tepat.'}</div>
          <p className="mt-1 opacity-90">{q.explanation}</p>
          <button onClick={next} className="mt-2 rounded-full bg-white/60 px-3 py-1 text-[11px] font-bold text-inherit">Lanjut →</button>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-neutral-400">
        Soal latihan orisinal mengikuti format & blueprint ujian masing-masing negara — bukan soal resmi/bocoran (hak cipta milik badan penyelenggara).
      </p>
    </div>
  )
}

export default ExamQuiz
