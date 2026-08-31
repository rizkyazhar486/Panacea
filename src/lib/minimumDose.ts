// "Minimum effective dose" library for people who want to be healthy but have
// no time and little energy.
//
// The design premise, which is a criticism of how most wearables behave: giving
// someone a bad score without a solution is worse than saying nothing. A busy
// person who is told "your recovery is 31%" and nothing else learns only that
// they are failing. So every entry here is an ACTION first — small enough to
// actually happen today — and the number is only ever context for the action.
//
// Every action is capped at what genuinely fits the stated time budget, and
// each carries the honest reason it works, so users can judge it rather than
// obey it.

export type Effort = 'zero' | 'low' | 'medium'
export type Slot = 2 | 10 | 30

export interface DoseAction {
  id: string
  title: string
  /** What to actually do, concretely enough to start without deciding anything. */
  how: string
  /** Why it works — kept honest, including where the evidence is modest. */
  why: string
  minutes: Slot
  effort: Effort
  /** Domains this helps, used to match against what the user says is worst. */
  helps: Domain[]
  /** Shown when the user is running on very little sleep or energy. */
  safeWhenWrecked: boolean
}

export type Domain = 'energy' | 'sleep' | 'stress' | 'movement' | 'food' | 'pain'

export const DOMAIN_LABEL: Record<Domain, string> = {
  energy: 'Always tired',
  sleep: 'Sleep is a mess',
  stress: 'Stress / anxiety',
  movement: 'Never moving',
  food: 'Eating carelessly',
  pain: 'Aches / pain',
}

export const DOSES: DoseAction[] = [
  // ── 2 minutes ──────────────────────────────────────────────────────────────
  {
    id: 'water-first',
    title: 'Drink a glass of water now',
    how: 'A full glass (about 250 ml), now, before anything else.',
    why: 'Mild dehydration lowers concentration and adds to fatigue, and thirst is a poor signal — in busy people, thirst is often felt only after performance has already dropped. This is no miracle cure, just the cheapest cause of tiredness to rule out.',
    minutes: 2, effort: 'zero', helps: ['energy', 'food'], safeWhenWrecked: true,
  },
  {
    id: 'sunlight-2',
    title: 'Step into daylight for 2 minutes',
    how: 'Stand outside or by an open window. No sunbathing needed — outdoor light reaching your eyes is enough (do not look at the sun).',
    why: 'Bright morning light is the strongest regulator of the body clock. It improves how sleepy you feel tonight, not how tired you feel now — so the benefit arrives this evening, not within these two minutes.',
    minutes: 2, effort: 'zero', helps: ['sleep', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'breath-2',
    title: '4-6 breathing for 2 minutes',
    how: 'Breathe in for 4 seconds, out for 6. The out-breath is longer than the in-breath. Repeat until the 2 minutes are up.',
    why: 'A longer out-breath activates the parasympathetic pathway and lowers heart rate within minutes. The effect is real but temporary — this is a tool for cutting a stress peak, not for resolving what causes the stress.',
    minutes: 2, effort: 'zero', helps: ['stress', 'sleep'], safeWhenWrecked: true,
  },
  {
    id: 'stand-2',
    title: 'Stand up and walk around the room',
    how: 'Stand up and walk for 2 minutes, anywhere. To the pantry, the toilet, out the door.',
    why: 'Hours of uninterrupted sitting carries a metabolic risk of its own, separate from whether you exercise. Breaking up sitting time is worth something in itself, even when the total never adds up to "a workout".',
    minutes: 2, effort: 'zero', helps: ['movement', 'pain', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'neck-2',
    title: 'Release the neck and shoulders',
    how: 'Lift the shoulders to your ears, hold 5 seconds, drop them. Repeat 5 times. Then turn the head slowly left and right, holding each for 15 seconds.',
    why: 'Neck and shoulder pain in screen workers comes mostly from static posture, not from structural damage. What helps is changing position regularly — far more decisive than which stretch you pick.',
    minutes: 2, effort: 'zero', helps: ['pain'], safeWhenWrecked: true,
  },
  {
    id: 'protein-grab',
    title: 'Add one protein source to your next meal',
    how: 'Egg, tofu, tempeh, tinned fish, chicken breast, or yoghurt. Replacing nothing — just adding.',
    why: 'Adding is easier to follow than forbidding. Protein slows the return of hunger and helps preserve muscle mass — the two things lost fastest by busy people eating whatever is at hand.',
    minutes: 2, effort: 'zero', helps: ['food', 'energy'], safeWhenWrecked: true,
  },

  // ── 10 minutes ─────────────────────────────────────────────────────────────
  {
    id: 'walk-10',
    title: 'Walk for 10 minutes',
    how: 'A pace where you can still talk but not sing. Anywhere — around the office, around the block.',
    why: 'Moderate activity has a dose-response relationship: the largest benefit per minute comes from going from none to a little, not from a lot to a great deal. Ten minutes is not a failed version of 30 — it is the most valuable part.',
    minutes: 10, effort: 'low', helps: ['movement', 'energy', 'stress'], safeWhenWrecked: true,
  },
  {
    id: 'walk-after-meal',
    title: 'Walk 10 minutes after your largest meal',
    how: 'Right after lunch or dinner, take an easy 10-minute walk.',
    why: 'Walking after eating blunts the post-meal blood sugar spike better than walking at other times. It is the timing that works, not the intensity — which makes it one of the highest-return actions per unit of effort.',
    minutes: 10, effort: 'low', helps: ['movement', 'food', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'wind-down',
    title: 'Screens off 10 minutes before bed',
    how: 'Put the phone out of arm’s reach from the bed. Ten minutes only, not an hour.',
    why: 'What disturbs sleep is usually not the blue light but the content that keeps the mind active. Putting the phone out of reach works better than intending "not to open it" — changing the environment is more reliable than relying on willpower when tired.',
    minutes: 10, effort: 'zero', helps: ['sleep', 'stress'], safeWhenWrecked: true,
  },
  {
    id: 'strength-10',
    title: '10 minutes of strength, no equipment',
    how: '3 rounds: 10 sit-to-stand squats from a chair, 8 push-ups (against a desk is fine), 20 seconds of plank. Rest as much as you like.',
    why: 'Strength training twice a week gives benefits aerobic work cannot replace — muscle mass, bone density, and insulin sensitivity. Ten minutes twice a week already clears the "never at all" threshold, and that is the biggest jump there is.',
    minutes: 10, effort: 'medium', helps: ['movement', 'energy'], safeWhenWrecked: false,
  },
  {
    id: 'meal-prep-lite',
    title: 'Prepare one thing for tomorrow',
    how: 'Boil 4 eggs, wash some fruit, or cook extra rice. Just one thing, not a week of meal prep.',
    why: 'Poor food decisions almost always happen when you are hungry and nothing is ready. Preparing one ready option changes tomorrow’s decision without needing tomorrow’s discipline.',
    minutes: 10, effort: 'low', helps: ['food'], safeWhenWrecked: true,
  },

  // ── 30 minutes ─────────────────────────────────────────────────────────────
  {
    id: 'zone2-30',
    title: '30 minutes of easy cardio',
    how: 'Brisk walking, cycling, or swimming at a pace where you can still speak in full sentences.',
    why: 'Low intensity you can repeat beats high intensity that stops you for a week. Consistency is the deciding variable, and low intensity is what you are most likely to repeat next week.',
    minutes: 30, effort: 'medium', helps: ['movement', 'energy', 'stress'], safeWhenWrecked: false,
  },
  {
    id: 'sleep-anchor',
    title: 'Fix your WAKE time, not your bedtime',
    how: 'Pick one wake time and keep it every day, weekends included. Let the bedtime settle itself.',
    why: 'Wake time is far more controllable than bedtime, and a consistent wake time is what stabilises the circadian rhythm. Trying to "sleep earlier" while not yet sleepy usually fails and adds anxiety about sleep instead.',
    minutes: 30, effort: 'low', helps: ['sleep', 'energy'], safeWhenWrecked: true,
  },
  {
    id: 'full-strength',
    title: 'Full 30-minute strength session',
    how: '2-3 rounds: squat, push (push-up/dumbbell press), pull (row), hip hinge, plank. 8-12 repetitions.',
    why: 'Covers every basic movement pattern in one session. Two sessions a week meet the strength recommendation without needing the gym every day.',
    minutes: 30, effort: 'medium', helps: ['movement', 'pain'], safeWhenWrecked: false,
  },
]

/** Actions that fit the time and energy the user actually has right now. */
export function pickDoses(opts: { slot: Slot; wrecked: boolean; worst: Domain | null }): DoseAction[] {
  const fits = DOSES.filter((d) => d.minutes <= opts.slot)
  const safe = opts.wrecked ? fits.filter((d) => d.safeWhenWrecked) : fits
  const matched = opts.worst ? safe.filter((d) => d.helps.includes(opts.worst!)) : safe
  // Never return an empty list — an empty state is exactly the failure mode
  // this page exists to avoid.
  const pool = matched.length ? matched : safe.length ? safe : fits
  return pool.sort((a, b) => b.minutes - a.minutes || a.effort.localeCompare(b.effort))
}

/**
 * Turns a poor wearable reading into something actionable.
 *
 * Wearables routinely tell people they slept badly and stop there. What a busy
 * person needs is: is this actually dangerous, and what is the one thing worth
 * doing today. So this deliberately reframes a low number as information about
 * TODAY'S PLAN rather than as a verdict on the person.
 */
export function triageBadReading(input: {
  sleepH?: number
  restingHr?: number
  baselineRestingHr?: number
  hrvMs?: number
}): { headline: string; meaning: string; doToday: string; seeDoctor?: string } | null {
  const { sleepH, restingHr, baselineRestingHr } = input

  if (typeof sleepH === 'number' && sleepH > 0 && sleepH < 5) {
    return {
      headline: 'Last night was short on sleep. That is all it means.',
      meaning:
        'One short night lowers concentration and raises hunger, but it does not permanently damage your health. The body repays part of the debt itself the following night. What harms you is not this one night but a pattern lasting months.',
      doToday:
        'Do not add load today: skip heavy training, add no caffeine after the afternoon, and keep tomorrow’s wake time as usual. A nap is fine — 20 minutes at most, and before 3 pm.',
      seeDoctor:
        'If you are so sleepy you nearly nod off while driving, snore loudly with pauses in breathing that others have witnessed, or are always tired despite sleeping enough — that needs medical assessment, not self-repair.',
    }
  }

  if (typeof restingHr === 'number' && typeof baselineRestingHr === 'number'
    && baselineRestingHr > 0 && restingHr - baselineRestingHr >= 7) {
    return {
      headline: 'Your resting heart rate is higher than usual.',
      meaning:
        'A clear rise in resting heart rate usually means the body is handling something — short sleep, alcohol, stress, dehydration, or an infection under way. It is a marker of load, not a marker of failure.',
      doToday:
        'Lower the intensity today, drink more, and sleep earlier if you can. If it is back to normal tomorrow, there is nothing to worry about.',
      seeDoctor:
        'If it comes with fever, breathlessness, chest pain, or an irregular pounding heartbeat — get it checked today.',
    }
  }

  return null
}
