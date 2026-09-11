import {
  DEFAULT_NOTIFICATION_SETTINGS,
  SMART_NOTIFICATION_RULES as BASE_SMART_NOTIFICATION_RULES,
  isQuietTime,
  matchesCondition,
  matchesRule,
  type FiredNotification,
  type NotificationCondition,
  type NotificationDomain,
  type NotificationPriority,
  type NotificationRule,
  type NotificationSettings,
  type NotificationSnapshot,
  type SignalValue,
} from './notificationEngine'

export { DEFAULT_NOTIFICATION_SETTINGS, isQuietTime, matchesCondition, matchesRule }
export type {
  FiredNotification,
  NotificationCondition,
  NotificationDomain,
  NotificationPriority,
  NotificationRule,
  NotificationSettings,
  NotificationSnapshot,
  SignalValue,
}

const c = (key: string, op: NotificationCondition['op'], value?: SignalValue): NotificationCondition => ({ key, op, value })

// Wave 2 stays opt-in. These rules intentionally combine two or more app signals
// so Panacea can surface context rather than react to isolated measurements.
export const EXTRA_SMART_NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'sleep-debt-low-recovery', title: 'Sleep debt + low recovery', body: 'Sleep debt and low recovery are present together. Review today’s plan before adding intensity.',
    domains: ['sleep', 'recovery'], all: [c('sleep.debtHours', 'gte', 2), c('recovery.score', 'lt', 45)], priority: 'normal', cooldownMinutes: 720,
    route: '/tubuh?t=pulih', enabledByDefault: false, explanation: 'At least two hours of logged sleep debt coincide with a recovery score below 45.',
  },
  {
    id: 'sleep-debt-early-appointment', title: 'Protect sleep before an early visit', body: 'Sleep debt is present and an early appointment is approaching. Review tonight’s schedule and visit preparation.',
    domains: ['sleep', 'appointment'], all: [c('sleep.debtHours', 'gte', 2), c('appointment.earlyTomorrow', 'truthy')], priority: 'normal', cooldownMinutes: 720,
    route: '/catatan?t=kunjungan', enabledByDefault: false, explanation: 'Logged sleep debt coincides with an appointment flagged as early tomorrow.',
  },
  {
    id: 'recovery-trend-hard-training', title: 'Recovery trend + hard session', body: 'Recovery has been trending down while a hard session is planned. Review the trend before choosing intensity.',
    domains: ['recovery', 'body'], all: [c('recovery.downtrendDays', 'gte', 3), c('training.hardPlanned', 'truthy')], priority: 'high', cooldownMinutes: 720,
    route: '/latihan?t=analisis', enabledByDefault: false, explanation: 'Recovery has declined for at least three logged days while a hard session is planned.',
  },
  {
    id: 'hrv-drop-hard-training', title: 'HRV deviation + hard session', body: 'A downward HRV deviation and a hard training plan are both present. Review your broader recovery context first.',
    domains: ['recovery', 'body'], all: [c('recovery.hrvBelowBaselinePct', 'gte', 20), c('training.hardPlanned', 'truthy')], priority: 'high', cooldownMinutes: 720,
    route: '/tubuh?t=pulih', enabledByDefault: false, explanation: 'Logged HRV is at least 20% below the user baseline while a hard session is planned.',
  },
  {
    id: 'resting-hr-rise-hard-training', title: 'Resting HR deviation + hard session', body: 'Resting heart rate is above its saved baseline while a hard session is planned. Review recovery before proceeding.',
    domains: ['recovery', 'body'], all: [c('recovery.restingHrAboveBaseline', 'gte', 8), c('training.hardPlanned', 'truthy')], priority: 'high', cooldownMinutes: 720,
    route: '/tubuh?t=pulih', enabledByDefault: false, explanation: 'Resting heart rate is at least 8 bpm above the saved baseline while hard training is planned.',
  },
  {
    id: 'temperature-deviation-hard-training', title: 'Temperature deviation + hard session', body: 'A wearable temperature-deviation flag overlaps with a hard training plan. Review the signal and how you feel before training.',
    domains: ['recovery', 'body'], all: [c('recovery.temperatureDeviation', 'truthy'), c('training.hardPlanned', 'truthy')], priority: 'high', cooldownMinutes: 720,
    route: '/tubuh?t=pulih', enabledByDefault: false, explanation: 'A device-supplied temperature-deviation flag coincides with a planned hard session; no diagnosis is inferred.',
  },
  {
    id: 'soreness-load-mismatch', title: 'Soreness + high recent load', body: 'High soreness and elevated recent training load are both logged. Review the session plan before adding more load.',
    domains: ['recovery', 'body'], all: [c('recovery.soreness', 'gte', 7), c('training.loadRatio', 'gt', 1.3)], priority: 'normal', cooldownMinutes: 720,
    route: '/latihan?t=analisis', enabledByDefault: false, explanation: 'User-reported soreness of 7/10 or more coincides with a training-load ratio above 1.3.',
  },
  {
    id: 'inactivity-workday', title: 'Workday movement gap', body: 'A long waking inactivity block is occurring during a work period. Consider a brief movement break if practical.',
    domains: ['body', 'life'], all: [c('activity.inactiveMinutes', 'gte', 90), c('work.focusBlockActive', 'truthy')], priority: 'low', cooldownMinutes: 180,
    route: '/tubuh?t=postur', enabledByDefault: false, explanation: 'At least 90 waking inactive minutes overlap with a saved active work-focus block.',
  },
  {
    id: 'consecutive-meetings-movement', title: 'Meeting stack + movement gap', body: 'Several meetings are stacked and movement has been low. A short transition break may help reset the next block.',
    domains: ['body', 'life'], all: [c('work.consecutiveMeetings', 'gte', 3), c('activity.inactiveMinutes', 'gte', 75)], priority: 'low', cooldownMinutes: 240,
    route: '/tubuh?t=postur', enabledByDefault: false, explanation: 'Three or more consecutive meetings coincide with at least 75 waking inactive minutes.',
  },
  {
    id: 'workout-low-energy-intake', title: 'Training + low meal progress', body: 'A training session is complete while today’s logged meal progress remains low. Review your nutrition plan and actual intake.',
    domains: ['nutrition', 'body'], all: [c('training.completedToday', 'truthy'), c('nutrition.mealProgress', 'lt', 0.5)], priority: 'low', cooldownMinutes: 480,
    route: '/gizi', enabledByDefault: false, explanation: 'Training is complete while logged meal progress is below half of the user-defined daily plan.',
  },
  {
    id: 'heat-hard-training-hydration', title: 'Heat + hard training + hydration gap', body: 'Heat, a hard outdoor session, and low logged hydration progress overlap. Review the plan before starting.',
    domains: ['nutrition', 'body', 'recovery'], all: [c('environment.hot', 'truthy'), c('training.hardPlanned', 'truthy'), c('activity.outdoorPlanned', 'truthy'), c('nutrition.hydrationProgress', 'lt', 0.5)], priority: 'high', cooldownMinutes: 360,
    route: '/gizi?t=cairan', enabledByDefault: false, explanation: 'A hot-environment flag, hard outdoor training plan, and hydration progress below 50% occur together.',
  },
  {
    id: 'late-meal-sleep-window', title: 'Late meal + sleep window', body: 'A late meal is logged close to your saved sleep window. Review whether tonight’s routine still fits your plan.',
    domains: ['nutrition', 'sleep'], all: [c('nutrition.lateMeal', 'truthy'), c('sleep.minutesUntilTargetBed', 'lte', 90)], priority: 'low', cooldownMinutes: 720,
    route: '/tubuh?t=tidur', enabledByDefault: false, explanation: 'A late-meal flag occurs within 90 minutes of the user-saved target bedtime.',
  },
  {
    id: 'caffeine-sleep-window', title: 'Caffeine + near sleep target', body: 'Caffeine was logged while your target sleep window is approaching. Review timing if sleep quality is a priority tonight.',
    domains: ['nutrition', 'sleep'], all: [c('nutrition.caffeineRecently', 'truthy'), c('sleep.minutesUntilTargetBed', 'lte', 240)], priority: 'low', cooldownMinutes: 720,
    route: '/gizi?t=kafein', enabledByDefault: false, explanation: 'A recent caffeine signal occurs within four hours of the user-saved target bedtime.',
  },
  {
    id: 'medication-overdue-unlogged', title: 'Scheduled medicine still unlogged', body: 'A scheduled medicine is past its saved reminder time and is not marked taken. Check the actual prescription label and your record.',
    domains: ['medication'], all: [c('medication.minutesUntilDue', 'lte', -60), c('medication.taken', 'falsy')], priority: 'high', cooldownMinutes: 180,
    route: '/med-reminders', enabledByDefault: false, explanation: 'A registered medicine reminder is at least one hour past its saved time and remains unmarked.',
  },
  {
    id: 'medication-travel-supply', title: 'Travel + medication supply check', body: 'Upcoming travel overlaps with a short saved medication-supply estimate. Check the actual pack before departure.',
    domains: ['medication', 'life'], all: [c('travel.upcoming', 'truthy'), c('medication.refillDays', 'lte', 7)], priority: 'normal', cooldownMinutes: 1440,
    route: '/med-reminders', enabledByDefault: false, explanation: 'Upcoming travel coincides with seven days or less in the user-entered medication supply estimate.',
  },
  {
    id: 'medication-travel-schedule', title: 'Travel + medication schedule', body: 'Travel crosses time zones while scheduled medicines are active. Review your clinician-approved schedule before the trip.',
    domains: ['medication', 'life'], all: [c('travel.timeZoneChange', 'truthy'), c('medication.activeScheduleCount', 'gt', 0)], priority: 'normal', cooldownMinutes: 1440,
    route: '/med-reminders', enabledByDefault: false, explanation: 'A time-zone-changing trip is upcoming while at least one medication schedule is active.',
  },
  {
    id: 'appointment-documents-missing', title: 'Visit documents are incomplete', body: 'An appointment is approaching and one or more saved visit documents are still missing.',
    domains: ['appointment'], all: [c('appointment.hoursUntil', 'lte', 24), c('appointment.documentsComplete', 'falsy')], priority: 'normal', cooldownMinutes: 720,
    route: '/catatan?t=kunjungan', enabledByDefault: false, explanation: 'A saved appointment is within 24 hours and the visit-document checklist is incomplete.',
  },
  {
    id: 'appointment-questions-empty', title: 'Capture questions before the visit', body: 'A visit is approaching but no questions are saved yet. Add what you want to clarify before the appointment.',
    domains: ['appointment', 'life'], all: [c('appointment.hoursUntil', 'lte', 24), c('appointment.questionsCount', 'eq', 0)], priority: 'low', cooldownMinutes: 720,
    route: '/catatan?t=kunjungan', enabledByDefault: false, explanation: 'A saved appointment is within 24 hours and the visit question list is empty.',
  },
  {
    id: 'appointment-lab-review', title: 'New results before the visit', body: 'A visit is approaching and newly imported results have not yet been reviewed in Panacea.',
    domains: ['appointment', 'body', 'evidence'], all: [c('appointment.hoursUntil', 'lte', 48), c('labs.newResult', 'truthy'), c('labs.reviewed', 'falsy')], priority: 'normal', cooldownMinutes: 720,
    route: '/catatan?t=kunjungan', enabledByDefault: false, explanation: 'A visit within 48 hours coincides with a new imported lab result that is still marked unreviewed.',
  },
  {
    id: 'family-care-appointment-conflict', title: 'Family care + schedule conflict', body: 'A family-care task overlaps with a saved appointment or work commitment. Review ownership before the conflict arrives.',
    domains: ['family', 'life'], all: [c('family.tasksDue', 'gt', 0), c('calendar.careConflict', 'truthy')], priority: 'normal', cooldownMinutes: 720,
    route: '/family-health', enabledByDefault: false, explanation: 'At least one family-care task is due while the calendar reports a care-related schedule conflict.',
  },
  {
    id: 'data-stale-training', title: 'Training decision + stale wearable data', body: 'A hard session is planned but connected health data is stale. Sync first if you rely on those signals for today’s decision.',
    domains: ['body', 'recovery'], all: [c('training.hardPlanned', 'truthy'), c('data.connected', 'truthy'), c('data.syncAgeMinutes', 'gt', 180)], priority: 'normal', cooldownMinutes: 360,
    route: '/connect', enabledByDefault: false, explanation: 'A hard training plan coincides with a connected source that has not synced for more than three hours.',
  },
  {
    id: 'wearable-disconnected-training', title: 'Wearable disconnected before training', body: 'A workout is planned while the saved wearable connection is offline. Reconnect if you want live tracking.',
    domains: ['body'], all: [c('training.plannedToday', 'truthy'), c('device.wearableConnected', 'falsy')], priority: 'low', cooldownMinutes: 360,
    route: '/connect', enabledByDefault: false, explanation: 'A planned workout coincides with a wearable connection marked disconnected.',
  },
  {
    id: 'wearable-low-battery-sleep', title: 'Wearable battery + sleep tracking', body: 'Your wearable battery is low and overnight tracking is planned. Charge it if you want a complete night of data.',
    domains: ['body', 'sleep'], all: [c('device.batteryPct', 'lte', 20), c('sleep.trackingPlanned', 'truthy')], priority: 'low', cooldownMinutes: 360,
    route: '/connect', enabledByDefault: false, explanation: 'Wearable battery is at or below 20% while overnight sleep tracking is planned.',
  },
  {
    id: 'lab-result-unreviewed', title: 'New result ready to review', body: 'A new laboratory result was imported and is still unreviewed. Open the result with its source and reference range.',
    domains: ['body', 'evidence'], all: [c('labs.newResult', 'truthy'), c('labs.reviewed', 'falsy')], priority: 'normal', cooldownMinutes: 360,
    route: '/catatan?t=hasil', enabledByDefault: false, explanation: 'A new imported laboratory result exists and its review flag is still false; no diagnosis is inferred.',
  },
  {
    id: 'genomics-result-unreviewed', title: 'Genomics evidence ready to review', body: 'A new genomics evidence result is available and has not yet been reviewed. Open the provenance and interpretation context.',
    domains: ['evidence', 'body'], all: [c('genomics.newResult', 'truthy'), c('genomics.reviewed', 'falsy')], priority: 'normal', cooldownMinutes: 720,
    route: '/tubuh?t=dna', enabledByDefault: false, explanation: 'A genomics workflow published a new result while its review flag remains false; this does not imply clinical significance.',
  },
  {
    id: 'evidence-decision-refresh', title: 'Decision-linked evidence changed', body: 'Evidence linked to a saved decision has been refreshed. Re-open the source before relying on the older summary.',
    domains: ['evidence'], all: [c('evidence.refreshAvailable', 'truthy'), c('evidence.linkedDecisionCount', 'gt', 0)], priority: 'normal', cooldownMinutes: 1440,
    route: '/rujukan?t=bukti', enabledByDefault: false, explanation: 'A refreshed evidence source is linked to at least one saved decision context.',
  },
  {
    id: 'privacy-share-consent', title: 'Sharing is waiting for consent review', body: 'A data-sharing action is pending while current consent is not recorded. Review the destination and scope before anything is sent.',
    domains: ['privacy'], all: [c('privacy.sharePending', 'truthy'), c('privacy.consentCurrent', 'falsy')], priority: 'high', cooldownMinutes: 720,
    route: '/settings', enabledByDefault: false, explanation: 'A pending share action exists while the current-consent signal is false.',
  },
  {
    id: 'privacy-export-ready', title: 'Your data export is ready', body: 'A requested data export is ready. Review where you intend to store or share it before opening the package.',
    domains: ['privacy'], all: [c('privacy.exportReady', 'truthy')], priority: 'low', cooldownMinutes: 1440,
    route: '/settings', enabledByDefault: false, explanation: 'The app has marked a user-requested data export as ready.',
  },
  {
    id: 'finance-bill-cashflow-review', title: 'Upcoming expense + review flag', body: 'A recurring expense is approaching while your saved cash-flow review is still incomplete.',
    domains: ['finance'], all: [c('finance.recurringUpcoming', 'truthy'), c('finance.cashflowReviewComplete', 'falsy')], priority: 'low', cooldownMinutes: 2880,
    route: '/keuangan', enabledByDefault: false, explanation: 'An upcoming recurring-expense flag coincides with an incomplete user-defined cash-flow review.',
  },
  {
    id: 'career-deadline-calendar-conflict', title: 'Deadline + calendar conflict', body: 'A career deadline is close and your calendar shows a competing commitment. Review the next protected work block.',
    domains: ['career', 'life'], all: [c('career.deadlineDays', 'lte', 7), c('calendar.deadlineConflict', 'truthy')], priority: 'normal', cooldownMinutes: 720,
    route: '/learn', enabledByDefault: false, explanation: 'A saved career deadline is within seven days while a deadline-related calendar conflict is present.',
  },
  {
    id: 'exam-sleep-debt', title: 'Exam window + sleep debt', body: 'An exam or assessment is approaching while sleep debt is accumulating. Review the study plan and sleep window together.',
    domains: ['career', 'study', 'sleep'], all: [c('career.examDays', 'lte', 7), c('sleep.debtHours', 'gte', 2)], priority: 'normal', cooldownMinutes: 720,
    route: '/med-study', enabledByDefault: false, explanation: 'A saved exam is within seven days while logged sleep debt is at least two hours.',
  },
  {
    id: 'social-stress-isolation', title: 'Stress + low social contact', body: 'A high self-rated stress signal overlaps with a long gap since meaningful social contact. Consider one supportive connection if it fits.',
    domains: ['social', 'life'], all: [c('life.stressScore', 'gte', 8), c('social.daysSinceMeaningfulCheckin', 'gte', 7)], priority: 'low', cooldownMinutes: 2880,
    route: '/community', enabledByDefault: false, explanation: 'Self-rated stress of 8/10 or more coincides with at least seven days since a saved meaningful social check-in.',
  },
  {
    id: 'life-overload-recovery-buffer', title: 'Packed day + low recovery buffer', body: 'Your calendar is heavily loaded and the saved recovery buffer is low. Review which block can be simplified or moved.',
    domains: ['life', 'recovery'], all: [c('calendar.loadPct', 'gte', 85), c('life.recoveryBufferMinutes', 'lt', 30)], priority: 'normal', cooldownMinutes: 720,
    route: '/ikhtisar', enabledByDefault: false, explanation: 'Calendar load is at least 85% while less than 30 minutes of user-defined recovery buffer remains.',
  },
  {
    id: 'outdoor-heat-uv', title: 'Heat + high UV + outdoor plan', body: 'Heat and high-UV flags overlap with planned outdoor activity. Review timing, hydration and sun protection before you go.',
    domains: ['body', 'nutrition'], all: [c('activity.outdoorPlanned', 'truthy'), c('environment.hot', 'truthy'), c('environment.uvHigh', 'truthy')], priority: 'normal', cooldownMinutes: 360,
    route: '/sun-exposure', enabledByDefault: false, explanation: 'Planned outdoor activity coincides with both hot-environment and high-UV flags supplied by the app.',
  },
  {
    id: 'outdoor-air-quality-hard-session', title: 'Hard outdoor plan + poor air quality', body: 'A hard outdoor session is planned while the saved air-quality flag is poor. Review conditions and an indoor alternative.',
    domains: ['body', 'recovery'], all: [c('training.hardPlanned', 'truthy'), c('activity.outdoorPlanned', 'truthy'), c('environment.airQualityPoor', 'truthy')], priority: 'normal', cooldownMinutes: 360,
    route: '/air-quality', enabledByDefault: false, explanation: 'A planned hard outdoor session coincides with a poor-air-quality flag supplied by the app.',
  },
  {
    id: 'weekly-summary-unreviewed', title: 'Weekly picture + pending review', body: 'Your weekly summary is ready and newly imported health data is still unreviewed. Review the raw update before the summary.',
    domains: ['body', 'life'], all: [c('summary.weeklyReady', 'truthy'), c('data.newImport', 'truthy'), c('data.reviewed', 'falsy')], priority: 'low', cooldownMinutes: 10080,
    route: '/ikhtisar', enabledByDefault: false, explanation: 'The weekly summary is ready while a newly imported data set remains marked unreviewed.',
  },
]

export const SMART_NOTIFICATION_RULES: NotificationRule[] = [
  ...BASE_SMART_NOTIFICATION_RULES,
  ...EXTRA_SMART_NOTIFICATION_RULES,
]

export function defaultEnabledRuleIds(): string[] {
  return SMART_NOTIFICATION_RULES.filter((rule) => rule.enabledByDefault).map((rule) => rule.id)
}

function specificity(rule: NotificationRule): number {
  return (rule.all?.length || 0) * 2 + (rule.any?.length || 0)
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
  const priorityWeight: Record<NotificationPriority, number> = { high: 3, normal: 2, low: 1 }

  return SMART_NOTIFICATION_RULES
    .filter((rule) => enabled.has(rule.id))
    .filter((rule) => matchesRule(snapshot, rule))
    .filter((rule) => nowMs - (lastFiredByRule[rule.id] || 0) >= rule.cooldownMinutes * 60_000)
    .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || specificity(b) - specificity(a) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, settings.maxPerDay - todayCount))
}
