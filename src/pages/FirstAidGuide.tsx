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
      'Ask "Are you choking?" — if they can still cough forcefully or speak, encourage continued coughing and don\'t intervene yet.',
      'If they cannot breathe, cough, or speak: stand behind them and lean their upper body forward.',
      'Give 5 firm back blows between the shoulder blades using the heel of your hand.',
      'If that doesn\'t work, give 5 abdominal thrusts (Heimlich maneuver): make a fist above the navel, grasp it with your other hand, and pull sharply inward and upward.',
      'Alternate 5 back blows and 5 abdominal thrusts until the object comes out or the person becomes unconscious.',
      'If they become unconscious, lower them to the floor and start CPR — call emergency services immediately if not already done.',
    ],
    doNot: ['Do not perform abdominal thrusts on an infant under 1 year old — use back blows and chest thrusts instead.', 'Do not blindly sweep the mouth with a finger unless the object is visible.'],
  },
  {
    id: 'cpr',
    title: 'Adult CPR (by a bystander)',
    emoji: '❤️',
    category: 'Cardiac',
    whenToCall911: 'Immediately — if you are alone, call first before starting chest compressions, then begin CPR.',
    steps: [
      'Check responsiveness: tap their shoulder firmly and shout. Check for normal breathing (no more than 10 seconds).',
      'If unresponsive and not breathing normally, call emergency services (or have someone else call) and get an AED if available.',
      'Place the heel of one hand in the center of the chest, the other hand on top, fingers interlocked.',
      'Push hard and fast: at least 5 cm deep, 100-120 compressions per minute, and let the chest fully recoil between compressions.',
      'If trained and willing, give 2 rescue breaths every 30 compressions (30:2). If untrained or unwilling, continue compression-only CPR.',
      'Continue until the AED arrives (follow its voice prompts), professional help takes over, or the person starts breathing normally.',
    ],
    doNot: ['Do not stop compressions for more than 10 seconds at a time.', 'Do not perform CPR on someone who is breathing normally.'],
  },
  {
    id: 'bleeding',
    title: 'Severe bleeding',
    emoji: '🩸',
    category: 'Trauma',
    whenToCall911: 'Any bleeding that does not stop with direct pressure, spurting blood, or a deep/extensive wound.',
    steps: [
      'Call emergency services if the bleeding is severe.',
      'Press firmly and directly on the wound with a clean cloth or bandage — if it soaks through, do not remove it, just add more layers on top.',
      'If possible, raise the injured part above the level of the heart.',
      'If bleeding continues despite direct pressure and the wound is on a limb, apply a tourniquet a few centimeters above the wound (not over a joint), tightening it until the bleeding stops. Note the time it was applied.',
      'Keep the person warm and still to reduce the risk of shock.',
    ],
    doNot: ['Do not remove an object that is impaled in the wound — pad around it and press at its edges.', 'Do not loosen a tourniquet that is already in place unless directed by medical personnel.'],
  },
  {
    id: 'burns',
    title: 'Burns',
    emoji: '🔥',
    category: 'Trauma',
    whenToCall911: 'A burn larger than the person\'s palm, one affecting the face/hands/genitals, a deep or charred wound, or one caused by chemicals/electricity.',
    steps: [
      'Move the person away from the heat source and remove jewelry/tight clothing near the burn before swelling starts.',
      'Cool the burn under cool (not ice-cold) running water for 20 minutes.',
      'Cover loosely with a clean, non-stick dressing or plastic wrap.',
      'For chemical burns, brush off dry chemical residue first, then flush with plenty of running water for at least 20 minutes.',
      'Treat for shock (lay flat, raise the legs, keep warm) if the burn is extensive.',
    ],
    doNot: ['Do not apply ice, butter, oil, or toothpaste to a burn.', 'Do not pop blisters.', 'Do not pull off clothing stuck to a burn.'],
  },
  {
    id: 'seizure',
    title: 'Seizure',
    emoji: '🧠',
    category: 'Neurological',
    whenToCall911: 'A first-ever seizure, one lasting more than 5 minutes, another seizure starting before recovery, an injury during the seizure, breathing difficulty afterward, or the person is pregnant/diabetic/not known to have epilepsy.',
    steps: [
      'Stay calm and time how long the seizure lasts.',
      'Clear hard/sharp objects nearby to prevent injury; do not hold them down.',
      'Place something soft under their head.',
      'Once the seizure stops, roll them onto their side (recovery position) to keep the airway clear.',
      'Stay with them until they are fully alert; speak calmly as their awareness returns.',
    ],
    doNot: ['Do not put anything in their mouth.', 'Do not try to restrain their movements.', 'Do not give them anything to drink or eat before they are fully alert.'],
  },
  {
    id: 'fainting',
    title: 'Fainting',
    emoji: '💫',
    category: 'General',
    whenToCall911: 'Not regaining consciousness within a minute, injury from the fall, chest pain, an irregular heartbeat, or the person is pregnant/elderly.',
    steps: [
      'Lay the person flat and raise their legs about 30 cm to improve blood flow to the brain.',
      'Loosen tight clothing at the neck/waist.',
      'Check their breathing; if not breathing normally, start CPR and call emergency services.',
      'Once they come to, let them lie down for a few minutes before slowly sitting up.',
    ],
    doNot: ['Do not sit or wake the person up quickly.', 'Do not give food or drink before they are fully alert.'],
  },
  {
    id: 'stroke',
    title: 'Suspected stroke (FAST)',
    emoji: '🧠',
    category: 'Neurological',
    whenToCall911: 'Any one FAST sign, even if it resolves afterward — call immediately and note the time symptoms started.',
    steps: [
      'F — Face: ask them to smile. Does one side droop?',
      'A — Arms: ask them to raise both arms. Does one drift down?',
      'S — Speech: ask them to repeat a sentence. Is their speech slurred or strange?',
      'T — Time: if even one sign is present, call emergency services immediately and note the exact time symptoms started (this determines treatment options).',
      'Keep the person calm, sitting or lying with their head slightly raised, and do not give food or drink (their ability to swallow may be affected).',
    ],
    doNot: ['Do not wait for symptoms to improve before seeking help — every minute matters for brain tissue.', 'Do not give aspirin or any medication without medical guidance.'],
  },
  {
    id: 'allergic',
    title: 'Severe allergic reaction (anaphylaxis)',
    emoji: '⚠️',
    category: 'Allergy',
    whenToCall911: 'Any sign of difficulty breathing, swelling of the face/throat, widespread hives with dizziness, or a known severe allergen exposure.',
    steps: [
      'Call emergency services immediately.',
      'If the person has an epinephrine auto-injector (e.g. EpiPen), help them use it — inject into the outer thigh and hold for the time stated on the device.',
      'Lay them flat with legs raised (unless they have trouble breathing, in which case let them sit up).',
      'A second dose of epinephrine can be given after 5-15 minutes if symptoms haven\'t improved and another auto-injector is available.',
      'Begin CPR if they stop breathing or become unresponsive.',
    ],
    doNot: ['Do not wait for symptoms to improve before using epinephrine if it\'s available and anaphylaxis is suspected.', 'Do not have them stand or walk suddenly — this can worsen the drop in blood pressure.'],
  },
]

const CATEGORY_ALL = 'All'
const CATEGORIES = [CATEGORY_ALL, ...Array.from(new Set(GUIDES.map((g) => g.category)))]

export function FirstAidGuide() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState(CATEGORY_ALL)
  const [open, setOpen] = useState<string | null>(null)
  const q = query.trim().toLowerCase()

  const filtered = useMemo(
    () => GUIDES.filter((g) => (cat === CATEGORY_ALL || g.category === cat) && (!q || (g.title + g.category).toLowerCase().includes(q))),
    [q, cat],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="First Aid Quick Guide" subtitle="Plain-language emergency steps for bystanders" />
        <p className="mt-2 text-[13px] leading-relaxed text-red-600 dark:text-red-300">
          <b>This does not replace calling emergency services.</b> In a real emergency,
          call for help first (or have someone else call) — the steps here are what to
          do while help is on the way, following bystander first-aid guidance from the
          Red Cross / AHA.
        </p>
        <input className={`${inputClass} mt-3`} placeholder="Search: choking, bleeding, seizure…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${cat === c ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{c}</button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 && <Card className="!p-5 text-center text-sm text-neutral-500">No guide matches "{query}".</Card>}

      {filtered.map((g) => {
        const isOpen = open === g.id
        return (
          <Card key={g.id} className="!p-0 overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : g.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl dark:bg-red-500/10">{g.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-black text-ink dark:text-ink">{g.title}</div>
                <Badge tone="low">{g.category}</Badge>
              </div>
              <span className="shrink-0 text-neutral-300">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="border-t border-neutral-100 p-4 dark:border-white/10">
                <div className="rounded-xl bg-red-50 p-3 text-[12px] leading-relaxed text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  <b>Call emergency services if:</b> {g.whenToCall911}
                </div>
                <div className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-500">Steps</div>
                <ol className="mt-1.5 list-inside list-decimal space-y-1.5 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {g.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                <div className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-500">Do not</div>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-neutral-500">
                  {g.doNot.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </Card>
        )
      })}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Follows standard bystander first-aid sequences (Red Cross / American Heart Association guidance for laypeople).
        For learning reference only — take a certified first aid / CPR course for hands-on practice,
        and in a real emergency always call your local emergency number.
      </div>
    </div>
  )
}

export default FirstAidGuide
