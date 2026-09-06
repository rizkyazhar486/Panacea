import { LearningModeSwitch } from '../LearningModeSwitch'
import { ENRICHMENT_LIBRARY } from '../../data/enrichmentLibrary'
import { getLearningMode, learningModeProfile } from '../../lib/learningMode'

export type StudyStartSection = 'practice' | 'osce' | 'case-bank' | 'procedures' | 'therapy' | 'diseases' | 'mnemonik' | 'usmle'

const PATHS: { section: StudyStartSection; icon: string; title: string; body: string }[] = [
  { section: 'diseases', icon: '🧬', title: 'Understand a disease', body: 'Etiology → mechanism → pathology → symptoms → diagnosis → treatment.' },
  { section: 'therapy', icon: '💊', title: 'Learn drugs & therapy', body: 'Start with why a treatment works, then indications, risks and practical use.' },
  { section: 'practice', icon: '🧠', title: 'Practice questions', body: 'Use active recall and explanations instead of rereading notes.' },
  { section: 'osce', icon: '🩺', title: 'Practice an OSCE', body: 'Turn knowledge into observable actions, communication and examination flow.' },
  { section: 'case-bank', icon: '📋', title: 'Learn through cases', body: 'Reason from presentation to differential diagnosis and next steps.' },
  { section: 'procedures', icon: '🧰', title: 'Clinical skills', body: 'Learn indications, sequence, anatomy, safety and common errors.' },
  { section: 'mnemonik', icon: '🔗', title: 'Make it stick', body: 'Use memory aids only after you understand the mechanism they compress.' },
  { section: 'usmle', icon: '🎓', title: 'Build the foundations', body: 'Connect preclinical mechanisms with clinical reasoning and exam framing.' },
]

export function StudyStartPanel({ onSelect, current }: { onSelect: (section: StudyStartSection) => void; current: string }) {
  const mode = getLearningMode()
  const profile = learningModeProfile(mode)
  const stories = ENRICHMENT_LIBRARY.filter((x) => x.kind === 'story')
  const seed = new Date().getDate() % Math.max(stories.length, 1)
  const story = stories[seed]

  return (
    <div className="space-y-3">
      <LearningModeSwitch />
      <section className="liquid-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Start by intention</div>
            <h2 className="mt-1 text-lg font-black tracking-tight text-neutral-900 dark:text-white">What are you trying to understand?</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-neutral-500 dark:text-white/50">Current depth: <b>{profile.label}</b>. {profile.description}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {PATHS.map((path) => (
            <button key={path.section} onClick={() => onSelect(path.section)} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${current === path.section ? 'border-[#d8bb70]/35 bg-[#d8bb70]/10' : 'border-black/[.055] bg-white/45 hover:bg-white/75 dark:border-white/10 dark:bg-white/[.035] dark:hover:bg-white/[.065]'}`}>
              <span className="text-xl">{path.icon}</span>
              <span className="mt-2 block text-xs font-black text-neutral-900 dark:text-white">{path.title}</span>
              <span className="mt-1 block text-[10px] leading-relaxed text-neutral-500 dark:text-white/45">{path.body}</span>
            </button>
          ))}
        </div>
      </section>
      {story && (
        <section className="liquid-panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="max-w-xl"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Visual story of the day</div><div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">{story.title}</div><p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">{story.summary}</p></div>
          <button onClick={() => onSelect('diseases')} className="rounded-full border border-black/[.06] bg-white/60 px-3 py-2 text-[10px] font-black text-neutral-700 dark:border-white/10 dark:bg-white/[.05] dark:text-white">Explore related mechanisms →</button>
        </section>
      )}
    </div>
  )
}
