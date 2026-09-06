import { useEffect, useState } from 'react'
import {
  LEARNING_MODES,
  getLearningMode,
  learningModeProfile,
  setLearningMode,
  subscribeLearningMode,
  type LearningMode,
} from '../lib/learningMode'

export function LearningModeSwitch({ compact = false }: { compact?: boolean }) {
  const [mode, setModeState] = useState<LearningMode>(getLearningMode)
  useEffect(() => subscribeLearningMode(setModeState), [])
  const profile = learningModeProfile(mode)

  return (
    <div className={`learning-depth ${compact ? 'learning-depth--compact' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="panacea-kicker !text-neutral-500 dark:!text-white/55">Explanation depth</div>
          {!compact && <p className="mt-1 text-xs text-neutral-500 dark:text-white/55">Same topic, different language and clinical depth.</p>}
        </div>
        <span className="rounded-full border border-black/5 bg-white/55 px-2.5 py-1 text-[10px] font-black text-neutral-600 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white/75">{profile.shortLabel}</span>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LEARNING_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.description}
            onClick={() => { setLearningMode(item.id); setModeState(item.id) }}
            className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-black transition ${mode === item.id ? 'border-[#d7b76a]/60 bg-[#d7b76a]/16 text-[#8a6a20] shadow-[inset_0_1px_rgba(255,255,255,.7)] dark:text-[#f2d993]' : 'border-black/[.06] bg-white/45 text-neutral-500 hover:bg-white/80 dark:border-white/10 dark:bg-white/[.04] dark:text-white/55 dark:hover:bg-white/[.08]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!compact && (
        <div className="mt-3 rounded-2xl border border-black/[.05] bg-white/45 p-3 text-xs leading-relaxed text-neutral-600 dark:border-white/10 dark:bg-white/[.035] dark:text-white/65">
          <span className="font-black text-neutral-800 dark:text-white">{profile.vocabulary}.</span> {profile.emphasis}.
        </div>
      )}
    </div>
  )
}
