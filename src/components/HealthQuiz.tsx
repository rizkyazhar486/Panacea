import { useEffect, useMemo, useState } from 'react'
import { BANDS, TIER_LABEL, questionsForTier, type Band, type Tier, type QuizQuestion } from '../lib/quizBank'

// Graded health-knowledge quiz — Fakta/Mitos for quick questions, MCQ for
// mechanism-heavy ones. Difficulty runs from layperson to frontier science;
// explanations get progressively more pathophysiological/biochemical as the
// tier rises. Score is tracked per tier in localStorage (no server round-trip
// needed for something this lightweight).

const SCORE_KEY = 'pmd_quiz_scores'

interface Scores { [tier: string]: { correct: number; total: number } }

function loadScores(): Scores {
  try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '{}') } catch { return {} }
}
function saveScores(s: Scores) {
  try { localStorage.setItem(SCORE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

const BAND_COLOR: Record<Band, string> = {
  mudah: 'bg-brand text-white',
  menengah: 'bg-amber-500 text-white',
  sulit: 'bg-rose-500 text-white',
}

export function HealthQuiz() {
  const [band, setBand] = useState<Band>('mudah')
  const [tier, setTier] = useState<Tier>('awam')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | boolean | null>(null)
  const [scores, setScores] = useState<Scores>(loadScores)

  const questions = useMemo(() => questionsForTier(tier), [tier])
  const q: QuizQuestion | undefined = questions[qIdx % Math.max(questions.length, 1)]
  const tierScore = scores[tier] ?? { correct: 0, total: 0 }

  useEffect(() => { setQIdx(0); setSelected(null) }, [tier])

  function pickBand(b: Band) {
    setBand(b)
    const firstTier = BANDS.find((x) => x.id === b)!.tiers[0]
    setTier(firstTier)
  }

  function answer(choice: number | boolean) {
    if (selected !== null || !q) return
    setSelected(choice)
    const correct = choice === q.answer
    const next = { ...scores, [tier]: { correct: tierScore.correct + (correct ? 1 : 0), total: tierScore.total + 1 } }
    setScores(next)
    saveScores(next)
  }

  function next() {
    setQIdx((i) => i + 1)
    setSelected(null)
  }

  if (!q) return null
  const isCorrect = selected !== null && selected === q.answer

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black text-ink">🧠 Kuis Fakta vs Mitos</div>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">Skor {tier}: {tierScore.correct}/{tierScore.total}</span>
      </div>

      {/* Band selector */}
      <div className="flex gap-1.5">
        {BANDS.map((b) => (
          <button key={b.id} onClick={() => pickBand(b.id)}
            className={`flex-1 rounded-xl py-1.5 text-[11px] font-bold transition ${band === b.id ? BAND_COLOR[b.id] : 'bg-neutral-100 text-neutral-500'}`}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Tier selector within band */}
      <div className="flex flex-wrap gap-1.5">
        {BANDS.find((b) => b.id === band)!.tiers.map((t) => (
          <button key={t} onClick={() => setTier(t)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${tier === t ? 'bg-ink text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}>
            {TIER_LABEL[t]}
          </button>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-neutral-700">{q.q}</p>

      {q.type === 'tf' ? (
        <div className="flex gap-2">
          <button onClick={() => answer(true)} disabled={selected !== null}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition disabled:opacity-60 ${selected !== null && q.answer === true ? 'bg-brand text-white' : 'bg-brand/10 text-brand-dark'}`}>Fakta</button>
          <button onClick={() => answer(false)} disabled={selected !== null}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition disabled:opacity-60 ${selected !== null && q.answer === false ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600'}`}>Mitos</button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {q.options!.map((opt, i) => {
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
      )}

      {selected !== null && (
        <div className={`rounded-xl border p-3 text-[12px] leading-relaxed ${isCorrect ? 'border-brand/20 bg-brand-50/60 text-brand-dark' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          <div className="font-bold">{isCorrect ? '✓ Benar!' : '✕ Kurang tepat.'}</div>
          <p className="mt-1 opacity-90">{q.explanation}</p>
          {q.source && <p className="mt-1 text-[10px] opacity-60">Sumber: {q.source}</p>}
          <button onClick={next} className="mt-2 rounded-full bg-white/60 px-3 py-1 text-[11px] font-bold text-inherit">Lanjut →</button>
        </div>
      )}
    </div>
  )
}

export default HealthQuiz
