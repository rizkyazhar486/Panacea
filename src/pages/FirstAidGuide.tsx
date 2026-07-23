import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconShield } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// First Aid Quick Guide — plain-language emergency steps for bystanders, not
// clinicians (the clinician-facing ACLS/BLS algorithms already live in
// Clinical Calculators). Sourced from the standard lay-rescuer sequences
// taught in Red Cross / American Heart Association bystander courses:
// call for help first, then act. Pure static content, no external API.
// ─────────────────────────────────────────────────────────────────────────────

interface Guide { id: string; title: string; emoji: string; category: string; whenToCall911: string; steps: string[]; doNot: string[] }

const GUIDES: Guide[] = [
  {
    id: 'choking',
    title: 'Choking (adult/child, conscious)',
    emoji: '🫁',
    category: 'Airway',
    whenToCall911: 'If the person cannot cough, speak, or breathe at all, or becomes unconscious.',
    steps: [
      'Ask "Are you choking?" — if they can cough forcefully or speak, encourage coughing and do not intervene yet.',
      'If they cannot breathe, cough, or speak: stand behind them, lean them forward.',
      'Give 5 firm back blows between the shoulder blades with the heel of your hand.',
      'If that fails, give 5 abdominal thrusts (Heimlich): fist above the navel, grasp with other hand, pull sharply inward and upward.',
      'Alternate 5 back blows and 5 abdominal thrusts until the object is expelled or the person becomes unconscious.',
      'If they become unconscious, lower them to the ground and begin CPR — call emergency services immediately if not already done.',
    ],
    doNot: ['Do not perform abdominal thrusts on infants under 1 year — use back blows and chest thrusts instead.', 'Do not blindly sweep the mouth with a finger unless you can see the object.'],
  },
  {
    id: 'cpr',
    title: 'CPR for adults (bystander)',
    emoji: '❤️',
    category: 'Cardiac',
    whenToCall911: 'Immediately — before starting compressions if you are alone, call first, then start CPR.',
    steps: [
      'Check responsiveness: tap shoulders firmly and shout. Check for normal breathing (no more than 10 seconds).',
      'If unresponsive and not breathing normally, call emergency services (or ask someone else to) and get an AED if one is available.',
      'Place the heel of one hand on the center of the chest, other hand on top, fingers interlaced.',
      'Push hard and fast: at least 5 cm (2 in) deep, 100-120 compressions per minute, allowing full chest recoil between compressions.',
      'If trained and willing, give 2 rescue breaths after every 30 compressions (30:2). If untrained or unwilling, continue compression-only CPR.',
      'Continue until an AED arrives (follow its voice prompts), professional help takes over, or the person starts breathing normally.',
    ],
    doNot: ['Do not stop compressions for more than 10 seconds at a time.', 'Do not perform CPR on someone who is breathing normally.'],
  },
  {
    id: 'bleeding',
    title: 'Severe bleeding',
    emoji: '🩸',
    category: 'Trauma',
    whenToCall911: 'Any bleeding that won\'t stop with direct pressure, spurting blood, or a deep/large wound.',
    steps: [
      'Call emergency services if bleeding is severe.',
      'Apply firm, direct pressure to the wound with a clean cloth or bandage — do not remove it if it soaks through, add more layers on top.',
      'If possible, raise the injured area above heart level.',
      'If bleeding continues despite direct pressure and the wound is on a limb, apply a tourniquet a few inches above the wound (not on a joint), tightened until bleeding stops. Note the time it was applied.',
      'Keep the person warm and still to reduce shock risk.',
    ],
    doNot: ['Do not remove an embedded object — pack around it and apply pressure at the edges instead.', 'Do not loosen a tourniquet once applied unless directed by medical personnel.'],
  },
  {
    id: 'burns',
    title: 'Burns',
    emoji: '🔥',
    category: 'Trauma',
    whenToCall911: 'Burns larger than the person\'s palm, on the face/hands/genitals, deep/charred burns, or from chemicals/electricity.',
    steps: [
      'Remove the person from the heat source and remove jewelry/tight clothing near the burn before swelling starts.',
      'Cool the burn under cool (not ice-cold) running water for 20 minutes.',
      'Cover loosely with a clean, non-stick dressing or cling film.',
      'For chemical burns, brush off dry chemical first, then flush with large amounts of water for at least 20 minutes.',
      'Treat for shock (lie down, raise legs, keep warm) if the burn is large.',
    ],
    doNot: ['Do not apply ice, butter, oil, or toothpaste to a burn.', 'Do not pop blisters.', 'Do not pull off clothing stuck to the burn.'],
  },
  {
    id: 'seizure',
    title: 'Seizure',
    emoji: '🧠',
    category: 'Neurological',
    whenToCall911: 'First seizure ever, lasts longer than 5 minutes, another starts before recovery, injury during the seizure, difficulty breathing after, or the person is pregnant/diabetic/known not to have epilepsy.',
    steps: [
      'Stay calm and time the seizure.',
      'Clear the area of hard/sharp objects to prevent injury; do not restrain the person\'s movements.',
      'Place something soft under their head.',
      'Once convulsions stop, roll them onto their side (recovery position) to keep the airway clear.',
      'Stay with them until they are fully alert; speak calmly as they regain awareness.',
    ],
    doNot: ['Do not put anything in their mouth.', 'Do not try to hold them down.', 'Do not give water or food until fully alert.'],
  },
  {
    id: 'fainting',
    title: 'Fainting',
    emoji: '💫',
    category: 'General',
    whenToCall911: 'Doesn\'t regain consciousness within a minute, is injured from the fall, has chest pain, irregular heartbeat, or is pregnant/elderly.',
    steps: [
      'Lay the person flat and raise their legs about 30 cm (12 in) to improve blood flow to the brain.',
      'Loosen tight clothing around the neck/waist.',
      'Check for breathing; if not breathing normally, begin CPR and call emergency services.',
      'Once they come round, keep them lying down for a few minutes before slowly sitting up.',
    ],
    doNot: ['Do not sit or stand the person up quickly.', 'Do not give food or water until they are fully alert.'],
  },
  {
    id: 'stroke',
    title: 'Suspected stroke (FAST)',
    emoji: '🧠',
    category: 'Neurological',
    whenToCall911: 'Any of the FAST signs, even if they resolve — call immediately, note the time symptoms started.',
    steps: [
      'F — Face: ask them to smile. Does one side droop?',
      'A — Arms: ask them to raise both arms. Does one drift downward?',
      'S — Speech: ask them to repeat a phrase. Is it slurred or strange?',
      'T — Time: if any sign is present, call emergency services immediately and note the exact time symptoms started (this determines treatment options).',
      'Keep the person calm, seated or lying with head slightly raised, and do not give food or water (swallowing may be impaired).',
    ],
    doNot: ['Do not wait to see if symptoms improve before calling for help — every minute matters for brain tissue.', 'Do not give aspirin or any medication without medical guidance.'],
  },
  {
    id: 'allergic',
    title: 'Severe allergic reaction (anaphylaxis)',
    emoji: '⚠️',
    category: 'Allergic',
    whenToCall911: 'Any signs of difficulty breathing, swelling of the face/throat, widespread hives with dizziness, or known severe allergy exposure.',
    steps: [
      'Call emergency services immediately.',
      'If the person has an epinephrine auto-injector (e.g. EpiPen), help them use it — inject into the outer thigh, hold for the time stated on the device.',
      'Have them lie flat with legs raised (unless they are having trouble breathing, in which case let them sit up).',
      'A second dose of epinephrine can be given after 5-15 minutes if symptoms don\'t improve and another auto-injector is available.',
      'Begin CPR if they stop breathing or become unresponsive.',
    ],
    doNot: ['Do not wait to see if symptoms improve before using epinephrine if it\'s available and anaphylaxis is suspected.', 'Do not have them stand or walk suddenly — this can worsen a drop in blood pressure.'],
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(GUIDES.map((g) => g.category)))]

export function FirstAidGuide() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('All')
  const [open, setOpen] = useState<string | null>(null)
  const q = query.trim().toLowerCase()

  const filtered = useMemo(
    () => GUIDES.filter((g) => (cat === 'All' || g.category === cat) && (!q || (g.title + g.category).toLowerCase().includes(q))),
    [q, cat],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="First Aid Quick Guide" subtitle="Plain-language emergency steps for bystanders" />
        <p className="mt-2 text-[13px] leading-relaxed text-red-600 dark:text-red-300">
          <b>This does not replace calling emergency services.</b> In a real emergency, call for help first
          (or have someone else call) — these steps are what to do while help is on the way, based on
          standard Red Cross / AHA bystander first-aid guidance.
        </p>
        <input className={`${inputClass} mt-3`} placeholder="Search: choking, bleeding, seizure…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{c}</button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-400">No guide matches "{query}".</Card>}

      {filtered.map((g) => {
        const isOpen = open === g.id
        return (
          <Card key={g.id} className="!p-0 overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : g.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl dark:bg-red-500/10">{g.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-black text-ink dark:text-white">{g.title}</div>
                <Badge tone="low">{g.category}</Badge>
              </div>
              <span className="shrink-0 text-neutral-300">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="border-t border-neutral-100 p-4 dark:border-white/10">
                <div className="rounded-xl bg-red-50 p-3 text-[12px] leading-relaxed text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  <b>Call emergency services when:</b> {g.whenToCall911}
                </div>
                <div className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-400">Steps</div>
                <ol className="mt-1.5 list-inside list-decimal space-y-1.5 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {g.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                <div className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-400">Do not</div>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-500">
                  {g.doNot.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </Card>
        )
      })}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Based on standard lay-rescuer sequences (Red Cross / American Heart Association bystander
        guidance). Educational reference only — take an accredited first aid / CPR course for hands-on
        training, and always call your local emergency number in a real emergency.
      </div>
    </div>
  )
}

export default FirstAidGuide
