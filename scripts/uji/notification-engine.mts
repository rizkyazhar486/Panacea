import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SMART_NOTIFICATION_RULES,
  defaultEnabledRuleIds,
  evaluateNotificationRules,
  notificationEngineExtended,
  type NotificationContext,
} from '../../src/lib/notificationEngine.ts'
import { EXTRA_SMART_NOTIFICATION_RULES } from '../../src/lib/notificationEngineExtended.ts'

const base: NotificationContext = {
  now: new Date('2026-09-07T08:00:00+07:00'),
  hour: 8,
  quietHours: false,
  recentNotificationIds: new Set(),
  recentNotificationAtById: new Map(),
  heartRate: undefined,
  restingHr: undefined,
  hrvMs: undefined,
  sleepHours: undefined,
  sleepScore: undefined,
  steps: undefined,
  respRate: undefined,
  spo2Pct: undefined,
  bodyTempC: undefined,
  stress: undefined,
  activeKcal: undefined,
  moveGoal: undefined,
  waterMl: undefined,
  waterGoalMl: undefined,
  weightKg: undefined,
  weightDeltaKg30d: undefined,
  bodyFatPct: undefined,
  bodyFatDeltaPct30d: undefined,
  weeklyActiveMinutes: undefined,
  workoutToday: false,
  workoutYesterday: false,
  workoutMinutesToday: undefined,
  workoutIntensity: undefined,
  trainingLoadAcute: undefined,
  trainingLoadChronic: undefined,
  recoveryScore: undefined,
  readinessScore: undefined,
  vo2max: undefined,
  vo2maxDelta90d: undefined,
  recentHardDays: undefined,
  daysSinceRest: undefined,
  medicationDueCount: undefined,
  missedMedicationCount: undefined,
  fastingHours: undefined,
  caffeineMgToday: undefined,
  lastCaffeineHour: undefined,
  alcoholUnitsYesterday: undefined,
  moodScore: undefined,
  painScore: undefined,
  screenMinutesToday: undefined,
  sittingMinutesContinuous: undefined,
  uvIndex: undefined,
  airQualityIndex: undefined,
  outdoorMinutesToday: undefined,
  periodDay: undefined,
  cycleLength: undefined,
  pregnancyWeek: undefined,
  appointmentHoursAway: undefined,
  travelTimeZoneDeltaHours: undefined,
}

function evaluate(patch: Partial<NotificationContext>, enabled = SMART_NOTIFICATION_RULES.map((rule) => rule.id)) {
  return evaluateNotificationRules(notificationEngineExtended, { ...base, ...patch }, new Set(enabled))
}

assert.ok(SMART_NOTIFICATION_RULES.length >= 20, 'notification engine should expose a substantial rule set')
assert.ok(EXTRA_SMART_NOTIFICATION_RULES.length >= 10, 'wave-2 combinations should remain present')
assert.ok(defaultEnabledRuleIds().length > 0, 'safe low-friction rules should be enabled by default')

const sleepRecovery = evaluate({ sleepHours: 5.1, recoveryScore: 35, readinessScore: 42, recentHardDays: 2 })
assert.ok(sleepRecovery.some((item) => item.id === 'low-sleep-low-recovery'), 'low sleep + low recovery should generate the combined recovery rule')

const hydration = evaluate({ waterMl: 500, waterGoalMl: 2500, activeKcal: 900, bodyTempC: 37.7 })
assert.ok(hydration.some((item) => item.id === 'heat-hard-training-hydration'), 'heat + training + low hydration should generate a specific hydration rule')

const orthostatic = evaluate({ heartRate: 115, restingHr: 62, sleepHours: 5.5, waterMl: 700, waterGoalMl: 2500 })
assert.ok(orthostatic.some((item) => item.id === 'high-hr-low-sleep-hydration'), 'high HR + poor sleep + low hydration should generate a cautious context rule')

const medication = evaluate({ medicationDueCount: 2 }, ['medication-due'])
assert.ok(medication.some((item) => item.id === 'medication-due'), 'medication reminder should fire only from an explicit due count')

const quiet = evaluate({ quietHours: true, medicationDueCount: 2 }, ['medication-due'])
assert.equal(quiet.length, 0, 'quiet hours should suppress ordinary smart notifications')

const cooldown = evaluate({ medicationDueCount: 2, recentNotificationIds: new Set(['medication-due']) }, ['medication-due'])
assert.equal(cooldown.length, 0, 'recently emitted notifications should respect cooldown')

const prioritised = evaluate({ waterMl: 400, waterGoalMl: 2500, activeKcal: 1000, bodyTempC: 38, sleepHours: 5, recoveryScore: 30 })
assert.equal(prioritised[0]?.id, 'heat-hard-training-hydration', 'higher-priority and more specific combinations should rank first')

for (const rule of SMART_NOTIFICATION_RULES) {
  const text = `${rule.title} ${rule.body}`
  assert.doesNotMatch(text, /you have (?:a |an )?(?:disease|cancer|stroke|heart attack)|you are diagnosed|take \d+\s?mg|stop your medication/i, `${rule.id} must not make an autonomous diagnosis or dosing instruction`)
}

const orchestrator = readFileSync('src/components/SmartNotificationOrchestrator.tsx', 'utf8')
assert.match(orchestrator, /notificationEngineExtended/)
assert.match(orchestrator, /evaluateNotificationRules/)
assert.match(orchestrator, /document\.visibilityState === 'hidden'/)
assert.match(orchestrator, /One interruption per evaluation/)
assert.doesNotMatch(orchestrator, /Notification\.requestPermission/, 'ambient evaluator must never surprise the user with a permission prompt')

const settings = readFileSync('src/components/SmartNotificationSettings.tsx', 'utf8')
assert.match(settings, /notificationEngineExtended/)
assert.match(settings, /Smart combinations/)
assert.match(settings, /Quiet hours/)
assert.match(settings, /Interruption budget/)
assert.match(settings, /Test device/)

const notificationPage = readFileSync('src/pages/Notifications.tsx', 'utf8')
assert.match(notificationPage, /SmartNotificationSettings/)
assert.match(notificationPage, /Local smart combinations and achievement history remain available on this device/, 'notification fallback copy should still state that local smart evaluation/history remains available when the backend is offline')

const appStatus = readFileSync('src/components/AppStatus.tsx', 'utf8')
assert.match(appStatus, /SmartNotificationOrchestrator/)

const serviceWorker = readFileSync('public/sw.js', 'utf8')
assert.match(serviceWorker, /notificationclick/)
assert.match(serviceWorker, /new URL\(raw, self\.registration\.scope\)/, 'notification route must be resolved against the service-worker scope')
assert.match(serviceWorker, /\.navigate\(destination\)/, 'an existing app window must navigate to the notification destination')
assert.match(serviceWorker, /clients\.openWindow\(destination\)/, 'notification click must open the destination when no app window exists')
assert.doesNotMatch(serviceWorker, /addEventListener\(['"]fetch['"]/, 'stability worker must not intercept fetch requests')

console.log(`smart notifications: ${SMART_NOTIFICATION_RULES.length} rules (${EXTRA_SMART_NOTIFICATION_RULES.length} wave-2), ${defaultEnabledRuleIds().length} enabled by default; all assertions passed`)
