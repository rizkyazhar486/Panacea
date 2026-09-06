export type NotificationDomain =
  | 'medication'
  | 'study'
  | 'recovery'
  | 'sleep'
  | 'nutrition'
  | 'appointment'
  | 'family'
  | 'evidence'
  | 'body'
  | 'life'
  | 'privacy'
  | 'finance'
  | 'social'
  | 'career'

export type NotificationPriority = 'low' | 'normal' | 'high'
export type SignalValue = string | number | boolean | null
export type NotificationSnapshot = Record<string, SignalValue | undefined>
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'truthy' | 'falsy' | 'exists'

export interface NotificationCondition {
  key: string
  op: ConditionOperator
  value?: SignalValue
}

export interface NotificationRule {
  id: string
  title: string
  body: string
  domains: NotificationDomain[]
  all?: NotificationCondition[]
  any?: NotificationCondition[]
  priority: NotificationPriority
  cooldownMinutes: number
  route: string
  enabledByDefault: boolean
  explanation: string
}

export interface NotificationSettings {
  enabled: boolean
  enabledRuleIds: string[]
  quietStart: string
  quietEnd: string
  maxPerDay: number
}

export interface FiredNotification {
  ruleId: string
  title: string
  body: string
  route: string
  priority: NotificationPriority
  domains: NotificationDomain[]
  explanation: string
  at: string
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  enabledRuleIds: [],
  quietStart: '22:30',
  quietEnd: '07:00',
  maxPerDay: 6,
}

const c = (key: string, op: ConditionOperator, value?: SignalValue): NotificationCondition => ({ key, op, value })

// Rules are deliberately conservative. They describe combinations of already-known
// app signals; they never infer a diagnosis, prescribe treatment, or manufacture a
// health measurement. Most are opt-in so a new user does not receive alert spam.
export const SMART_NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'study-review-due', title: 'A review is due', body: 'Your spaced-review queue has material ready to reconstruct.',
    domains: ['study'], all: [c('study.reviewDue', 'gt', 0)], priority: 'normal', cooldownMinutes: 360,
    route: '/med-study', enabledByDefault: true, explanation: 'Spaced-review items are due now.',
  },
  {
    id: 'study-review-pileup', title: 'Protect the review queue', body: 'Several weak concepts are due. A short review block can keep the queue from compounding.',
    domains: ['study'], all: [c('study.reviewDue', 'gte', 4)], priority: 'normal', cooldownMinutes: 720,
    route: '/med-study', enabledByDefault: false, explanation: 'Four or more spaced-review items are simultaneously due.',
  },
  {
    id: 'study-no-goal', title: 'Choose one study outcome', body: 'Your review queue is active but today’s study outcome is still empty.',
    domains: ['study'], all: [c('study.reviewDue', 'gt', 0), c('study.goalPresent', 'falsy')], priority: 'low', cooldownMinutes: 720,
    route: '/med-study', enabledByDefault: false, explanation: 'A review is due and no study outcome is saved for today.',
  },
  {
    id: 'sleep-hard-training', title: 'Reconsider today’s intensity', body: 'Short sleep and a planned hard session are both present. Review recovery before deciding intensity.',
    domains: ['sleep', 'recovery'], all: [c('sleep.hours', 'lt', 6.5), c('training.hardPlanned', 'truthy')], priority: 'high', cooldownMinutes: 720,
    route: '/tubuh?t=pulih', enabledByDefault: true, explanation: 'Sleep is under 6.5 h while a hard training session is planned.',
  },
  {
    id: 'recovery-hard-training', title: 'Recovery and plan disagree', body: 'Recovery is low while a hard session is planned. Check the signals before choosing your session.',
    domains: ['recovery'], all: [c('recovery.score', 'lt', 40), c('training.hardPlanned', 'truthy')], priority: 'high', cooldownMinutes: 720,
    route: '/tubuh?t=pulih', enabledByDefault: true, explanation: 'A low recovery signal coincides with a planned hard session.',
  },
  {
    id: 'load-recovery-mismatch', title: 'Training load is outrunning recovery', body: 'Recent load is high and recovery is low. Open the training view before adding more intensity.',
    domains: ['recovery', 'body'], all: [c('training.loadRatio', 'gt', 1.5), c('recovery.score', 'lt', 50)], priority: 'high', cooldownMinutes: 720,
    route: '/latihan?t=analisis', enabledByDefault: false, explanation: 'Training-load ratio is above 1.5 while recovery is below 50.',
  },
  {
    id: 'sleep-debt-caffeine', title: 'Sleep debt + late caffeine', body: 'Sleep debt and late caffeine are both logged. Consider protecting tonight’s sleep window.',
    domains: ['sleep', 'nutrition'], all: [c('sleep.debtHours', 'gte', 2), c('nutrition.lateCaffeine', 'truthy')], priority: 'normal', cooldownMinutes: 720,
    route: '/gizi?t=kafein', enabledByDefault: false, explanation: 'At least two hours of sleep debt coincide with late caffeine.',
  },
  {
    id: 'sleep-irregularity', title: 'Your sleep timing is drifting', body: 'Bedtime variability is high. Review the week before changing your target schedule.',
    domains: ['sleep'], all: [c('sleep.timingVariabilityMin', 'gt', 90)], priority: 'low', cooldownMinutes: 1440,
    route: '/tubuh?t=tidur', enabledByDefault: false, explanation: 'Recorded bedtime variability is greater than 90 minutes.',
  },
  {
    id: 'workout-hydration', title: 'Close the loop after training', body: 'A workout is logged but hydration has not been logged yet.',
    domains: ['nutrition', 'body'], all: [c('training.completedToday', 'truthy'), c('nutrition.hydrationLogged', 'falsy')], priority: 'low', cooldownMinutes: 360,
    route: '/gizi?t=cairan', enabledByDefault: true, explanation: 'Training is complete and hydration has not been logged.',
  },
  {
    id: 'long-inactivity', title: 'A small movement break?', body: 'You have been inactive for a while during your waking period. A brief movement break may be useful.',
    domains: ['body'], all: [c('activity.inactiveMinutes', 'gte', 120), c('activity.awake', 'truthy')], priority: 'low', cooldownMinutes: 180,
    route: '/tubuh?t=postur', enabledByDefault: false, explanation: 'At least 120 waking minutes are marked inactive.',
  },
  {
    id: 'training-low-protein-progress', title: 'Training day nutrition check', body: 'A training session is logged while protein progress is still below half of the saved target.',
    domains: ['nutrition', 'body'], all: [c('training.completedToday', 'truthy'), c('nutrition.proteinProgress', 'lt', 0.5)], priority: 'low', cooldownMinutes: 480,
    route: '/gizi?t=makro', enabledByDefault: false, explanation: 'Training is complete while protein progress is below 50% of the user-set target.',
  },
  {
    id: 'heat-hydration', title: 'Heat + hydration check', body: 'A hot-environment flag and low hydration progress are present before outdoor activity.',
    domains: ['nutrition', 'body'], all: [c('environment.hot', 'truthy'), c('activity.outdoorPlanned', 'truthy'), c('nutrition.hydrationProgress', 'lt', 0.5)], priority: 'normal', cooldownMinutes: 360,
    route: '/gizi?t=cairan', enabledByDefault: false, explanation: 'Outdoor activity, heat, and low logged hydration progress coincide.',
  },
  {
    id: 'medication-due-unlogged', title: 'Medication reminder', body: 'A scheduled medicine is due soon and no taken entry is recorded yet. Follow your actual prescription label.',
    domains: ['medication'], all: [c('medication.minutesUntilDue', 'lte', 30), c('medication.taken', 'falsy')], priority: 'high', cooldownMinutes: 120,
    route: '/med-reminders', enabledByDefault: true, explanation: 'A registered reminder is within 30 minutes and is not marked taken.',
  },
  {
    id: 'medication-refill', title: 'Medication supply may be running low', body: 'The saved supply estimate is near its end. Check the actual pack and arrange a refill if appropriate.',
    domains: ['medication'], all: [c('medication.refillDays', 'lte', 3)], priority: 'normal', cooldownMinutes: 1440,
    route: '/med-reminders', enabledByDefault: false, explanation: 'The user-entered medication supply estimate has three days or less remaining.',
  },
  {
    id: 'medication-list-before-visit', title: 'Refresh your medication list', body: 'A visit is approaching and the saved medication list has not been reviewed recently.',
    domains: ['medication', 'appointment'], all: [c('appointment.hoursUntil', 'lte', 24), c('medication.listAgeDays', 'gt', 30)], priority: 'normal', cooldownMinutes: 720,
    route: '/catatan?t=kunjungan', enabledByDefault: false, explanation: 'An appointment is within 24 h and the medication list is older than 30 days.',
  },
  {
    id: 'appointment-prep', title: 'Prepare for the visit', body: 'An appointment is within 24 hours and your visit-prep checklist is not complete.',
    domains: ['appointment'], all: [c('appointment.hoursUntil', 'lte', 24), c('appointment.prepComplete', 'falsy')], priority: 'normal', cooldownMinutes: 720,
    route: '/catatan?t=kunjungan', enabledByDefault: true, explanation: 'A saved appointment is within 24 h and visit preparation is incomplete.',
  },
  {
    id: 'appointment-travel', title: 'Leave-time check', body: 'Your appointment is close and travel readiness is not marked complete.',
    domains: ['appointment'], all: [c('appointment.hoursUntil', 'lte', 2), c('appointment.travelReady', 'falsy')], priority: 'high', cooldownMinutes: 180,
    route: '/consult', enabledByDefault: false, explanation: 'A saved appointment is within two hours and travel readiness is incomplete.',
  },
  {
    id: 'family-care-task', title: 'Family care task due', body: 'A shared family-care task is due. Open the family view to decide who will handle it.',
    domains: ['family'], all: [c('family.tasksDue', 'gt', 0)], priority: 'normal', cooldownMinutes: 720,
    route: '/family-health', enabledByDefault: true, explanation: 'At least one saved family-care task is due.',
  },
  {
    id: 'family-travel-emergency-card', title: 'Travel + emergency information', body: 'Travel is upcoming but the saved emergency card is not complete.',
    domains: ['family'], all: [c('travel.upcoming', 'truthy'), c('family.emergencyCardComplete', 'falsy')], priority: 'normal', cooldownMinutes: 1440,
    route: '/emergency', enabledByDefault: false, explanation: 'Upcoming travel coincides with an incomplete emergency card.',
  },
  {
    id: 'evidence-refresh', title: 'Saved evidence has an update', body: 'One of your saved evidence questions has a newer source available to review.',
    domains: ['evidence'], all: [c('evidence.savedQuestions', 'gt', 0), c('evidence.refreshAvailable', 'truthy')], priority: 'normal', cooldownMinutes: 1440,
    route: '/rujukan?t=bukti', enabledByDefault: false, explanation: 'A saved evidence question has a refresh flag from its source workflow.',
  },
  {
    id: 'trial-status-change', title: 'A saved trial changed status', body: 'A clinical trial you saved has a status update. Review the registry record for details.',
    domains: ['evidence'], all: [c('trials.savedStatusChanged', 'truthy')], priority: 'normal', cooldownMinutes: 720,
    route: '/rujukan?t=uji', enabledByDefault: false, explanation: 'A saved trial carries a status-change signal.',
  },
  {
    id: 'health-data-stale', title: 'Connected health data is stale', body: 'A connected source has not refreshed recently. Check sync before interpreting today’s dashboard.',
    domains: ['body'], all: [c('data.connected', 'truthy'), c('data.syncAgeMinutes', 'gt', 180)], priority: 'normal', cooldownMinutes: 720,
    route: '/connect', enabledByDefault: true, explanation: 'A connected data source has not synced for more than three hours.',
  },
  {
    id: 'new-data-review', title: 'New health data is ready to review', body: 'New imported data is present and has not yet been reviewed in the app.',
    domains: ['body'], all: [c('data.newImport', 'truthy'), c('data.reviewed', 'falsy')], priority: 'low', cooldownMinutes: 360,
    route: '/ikhtisar', enabledByDefault: false, explanation: 'A new-import flag exists and the review flag is false.',
  },
  {
    id: 'privacy-consent-before-external', title: 'Review consent before external analysis', body: 'An external analysis is pending but current consent is not recorded. Nothing should be sent until you approve it.',
    domains: ['privacy'], all: [c('privacy.externalAnalysisPending', 'truthy'), c('privacy.consentCurrent', 'falsy')], priority: 'high', cooldownMinutes: 720,
    route: '/settings', enabledByDefault: true, explanation: 'External analysis is pending without a current consent signal.',
  },
  {
    id: 'privacy-consent-change', title: 'Privacy preference changed', body: 'A consent or privacy preference changed recently. Review the setting if this was unexpected.',
    domains: ['privacy'], all: [c('privacy.consentChanged', 'truthy')], priority: 'normal', cooldownMinutes: 1440,
    route: '/settings', enabledByDefault: false, explanation: 'The app received a recent consent-change signal.',
  },
  {
    id: 'life-reading-nudge', title: 'Continue one saved reading', body: 'You saved material in the Life Library and still have unread items. One short reading is enough.',
    domains: ['life'], all: [c('life.savedUnread', 'gt', 0)], priority: 'low', cooldownMinutes: 2880,
    route: '/learn', enabledByDefault: false, explanation: 'At least one saved Life Library item is unread.',
  },
  {
    id: 'life-reflection', title: 'Turn a recent event into one action', body: 'A recent story entry is waiting for reflection. Capture what mattered and one next action.',
    domains: ['life'], all: [c('life.recentStory', 'truthy'), c('life.reflectionComplete', 'falsy')], priority: 'low', cooldownMinutes: 1440,
    route: '/jiwa?t=kisah', enabledByDefault: false, explanation: 'A recent story entry exists without a completed reflection flag.',
  },
  {
    id: 'social-checkin', title: 'Someone may be worth checking in on', body: 'Your saved social check-in interval has elapsed. Choose one person who matters and reach out.',
    domains: ['social'], all: [c('social.daysSinceMeaningfulCheckin', 'gte', 7)], priority: 'low', cooldownMinutes: 2880,
    route: '/community', enabledByDefault: false, explanation: 'The saved interval since a meaningful social check-in is at least seven days.',
  },
  {
    id: 'finance-review', title: 'Money review due', body: 'A recurring expense is approaching while your periodic finance review is due.',
    domains: ['finance'], all: [c('finance.reviewDue', 'truthy'), c('finance.recurringUpcoming', 'truthy')], priority: 'low', cooldownMinutes: 2880,
    route: '/keuangan', enabledByDefault: false, explanation: 'A finance-review flag and an upcoming recurring-expense flag coincide.',
  },
  {
    id: 'career-study-deadline', title: 'Deadline + study queue', body: 'A career or exam deadline is close while study reviews remain due. Open the plan and choose the next block.',
    domains: ['career', 'study'], all: [c('career.deadlineDays', 'lte', 7), c('study.reviewDue', 'gt', 0)], priority: 'normal', cooldownMinutes: 720,
    route: '/med-study', enabledByDefault: false, explanation: 'A saved career deadline is within seven days while study reviews are due.',
  },
  {
    id: 'outdoor-air-quality', title: 'Outdoor plan + air-quality flag', body: 'An outdoor session is planned while the saved air-quality flag is poor. Review conditions before deciding where to train.',
    domains: ['body'], all: [c('activity.outdoorPlanned', 'truthy'), c('environment.airQualityPoor', 'truthy')], priority: 'normal', cooldownMinutes: 360,
    route: '/air-quality', enabledByDefault: false, explanation: 'A planned outdoor activity coincides with a poor-air-quality signal supplied by the app.',
  },
  {
    id: 'sun-outdoor-plan', title: 'Outdoor plan + high UV flag', body: 'A high-UV flag overlaps with planned outdoor activity. Review sun-exposure guidance before you go.',
    domains: ['body'], all: [c('activity.outdoorPlanned', 'truthy'), c('environment.uvHigh', 'truthy')], priority: 'low', cooldownMinutes: 360,
    route: '/sun-exposure', enabledByDefault: false, explanation: 'A planned outdoor activity coincides with a high-UV signal supplied by the app.',
  },
  {
    id: 'weekly-summary', title: 'Your weekly picture is ready', body: 'Enough new data has accumulated for a weekly review across body, habits and training.',
    domains: ['body', 'life'], all: [c('summary.weeklyReady', 'truthy')], priority: 'low', cooldownMinutes: 10080,
    route: '/ikhtisar', enabledByDefault: true, explanation: 'The app marks the weekly summary as ready.',
  },
]

export function matchesCondition(snapshot: NotificationSnapshot, condition: NotificationCondition): boolean {
  const actual = snapshot[condition.key]
  switch (condition.op) {
    case 'exists': return actual !== undefined && actual !== null
    case 'truthy': return Boolean(actual)
    case 'falsy': return !actual
    case 'eq': return actual === condition.value
    case 'neq': return actual !== condition.value
    case 'gt': return typeof actual === 'number' && typeof condition.value === 'number' && actual > condition.value
    case 'gte': return typeof actual === 'number' && typeof condition.value === 'number' && actual >= condition.value
    case 'lt': return typeof actual === 'number' && typeof condition.value === 'number' && actual < condition.value
    case 'lte': return typeof actual === 'number' && typeof condition.value === 'number' && actual <= condition.value
  }
}

export function matchesRule(snapshot: NotificationSnapshot, rule: NotificationRule): boolean {
  const allOk = !rule.all?.length || rule.all.every((condition) => matchesCondition(snapshot, condition))
  const anyOk = !rule.any?.length || rule.any.some((condition) => matchesCondition(snapshot, condition))
  return allOk && anyOk
}

function minutesOfDay(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!match) return null
  const hour = Number(match[1]); const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}

export function isQuietTime(now: Date, start: string, end: string): boolean {
  const a = minutesOfDay(start); const b = minutesOfDay(end)
  if (a == null || b == null || a === b) return false
  const current = now.getHours() * 60 + now.getMinutes()
  return a < b ? current >= a && current < b : current >= a || current < b
}

export function defaultEnabledRuleIds(): string[] {
  return SMART_NOTIFICATION_RULES.filter((rule) => rule.enabledByDefault).map((rule) => rule.id)
}

export function evaluateNotificationRules(
  snapshot: NotificationSnapshot,
  settings: NotificationSettings,
  lastFiredByRule: Record<string, number>,
  todayCount: number,
  now = new Date(),
): NotificationRule[] {
  if (!settings.enabled || todayCount >= Math.max(1, settings.maxPerDay)) return []
  if (isQuietTime(now, settings.quietStart, settings.quietEnd)) return []
  const enabled = new Set(settings.enabledRuleIds.length ? settings.enabledRuleIds : defaultEnabledRuleIds())
  const nowMs = now.getTime()
  return SMART_NOTIFICATION_RULES
    .filter((rule) => enabled.has(rule.id))
    .filter((rule) => matchesRule(snapshot, rule))
    .filter((rule) => nowMs - (lastFiredByRule[rule.id] || 0) >= rule.cooldownMinutes * 60_000)
    .sort((a, b) => ({ high: 3, normal: 2, low: 1 }[b.priority] - { high: 3, normal: 2, low: 1 }[a.priority]))
    .slice(0, Math.max(0, settings.maxPerDay - todayCount))
}
