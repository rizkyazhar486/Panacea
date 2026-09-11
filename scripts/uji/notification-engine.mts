import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  SMART_NOTIFICATION_RULES,
  EXTRA_SMART_NOTIFICATION_RULES,
  defaultEnabledRuleIds,
  evaluateNotificationRules,
  isQuietTime,
  matchesCondition,
  matchesRule,
  type NotificationSnapshot,
} from '../../src/lib/notificationEngineExtended.ts'

assert.ok(SMART_NOTIFICATION_RULES.length >= 65, 'smart notification engine should expose at least 65 useful combinations')
assert.ok(EXTRA_SMART_NOTIFICATION_RULES.length >= 30, 'wave 2 should add at least 30 new combinations')
assert.equal(new Set(SMART_NOTIFICATION_RULES.map((rule) => rule.id)).size, SMART_NOTIFICATION_RULES.length, 'rule ids must be unique')
assert.ok(defaultEnabledRuleIds().length <= 10, 'new users should not receive an excessive default alert set')
assert.ok(defaultEnabledRuleIds().length >= 6, 'default set should still be useful')
assert.ok(EXTRA_SMART_NOTIFICATION_RULES.every((rule) => !rule.enabledByDefault), 'wave-2 rules must remain opt-in')
assert.ok(SMART_NOTIFICATION_RULES.every((rule) => rule.cooldownMinutes >= 120), 'every rule needs a meaningful cooldown')
assert.ok(SMART_NOTIFICATION_RULES.every((rule) => rule.route.startsWith('/')), 'every rule should lead to an in-app route')
assert.ok(SMART_NOTIFICATION_RULES.every((rule) => rule.explanation.length >= 20), 'every rule needs transparent trigger provenance')

assert.equal(matchesCondition({ x: 4 }, { key: 'x', op: 'gt', value: 3 }), true)
assert.equal(matchesCondition({ x: 4 }, { key: 'x', op: 'lte', value: 3 }), false)
assert.equal(matchesCondition({ x: true }, { key: 'x', op: 'truthy' }), true)
assert.equal(matchesCondition({}, { key: 'x', op: 'falsy' }), true)
assert.equal(matchesCondition({ x: 'yes' }, { key: 'x', op: 'exists' }), true)

const sleepTraining = SMART_NOTIFICATION_RULES.find((rule) => rule.id === 'sleep-hard-training')!
assert.ok(sleepTraining)
assert.equal(matchesRule({ 'sleep.hours': 6.1, 'training.hardPlanned': true }, sleepTraining), true)
assert.equal(matchesRule({ 'sleep.hours': 7.5, 'training.hardPlanned': true }, sleepTraining), false)

const medication = SMART_NOTIFICATION_RULES.find((rule) => rule.id === 'medication-due-unlogged')!
assert.equal(matchesRule({ 'medication.minutesUntilDue': 15, 'medication.taken': false }, medication), true)
assert.equal(matchesRule({ 'medication.minutesUntilDue': 15, 'medication.taken': true }, medication), false)

const heatTraining = SMART_NOTIFICATION_RULES.find((rule) => rule.id === 'heat-hard-training-hydration')!
assert.ok(heatTraining)
assert.equal(matchesRule({
  'environment.hot': true,
  'training.hardPlanned': true,
  'activity.outdoorPlanned': true,
  'nutrition.hydrationProgress': 0.4,
}, heatTraining), true)
assert.equal(matchesRule({
  'environment.hot': true,
  'training.hardPlanned': true,
  'activity.outdoorPlanned': true,
  'nutrition.hydrationProgress': 0.8,
}, heatTraining), false)

const genomics = SMART_NOTIFICATION_RULES.find((rule) => rule.id === 'genomics-result-unreviewed')!
assert.ok(genomics)
assert.equal(matchesRule({ 'genomics.newResult': true, 'genomics.reviewed': false }, genomics), true)
assert.equal(matchesRule({ 'genomics.newResult': true, 'genomics.reviewed': true }, genomics), false)

const wearableSleep = SMART_NOTIFICATION_RULES.find((rule) => rule.id === 'wearable-low-battery-sleep')!
assert.ok(wearableSleep)
assert.equal(matchesRule({ 'device.batteryPct': 15, 'sleep.trackingPlanned': true }, wearableSleep), true)
assert.equal(matchesRule({ 'device.batteryPct': 80, 'sleep.trackingPlanned': true }, wearableSleep), false)

function at(hour: number, minute: number) {
  const d = new Date(2026, 8, 7, hour, minute, 0, 0)
  return d
}
assert.equal(isQuietTime(at(23, 0), '22:30', '07:00'), true, 'cross-midnight quiet hours should include late evening')
assert.equal(isQuietTime(at(6, 30), '22:30', '07:00'), true, 'cross-midnight quiet hours should include early morning')
assert.equal(isQuietTime(at(12, 0), '22:30', '07:00'), false)
assert.equal(isQuietTime(at(12, 0), '09:00', '17:00'), true, 'same-day quiet windows should work')

const now = at(12, 0)
const snapshot: NotificationSnapshot = { 'study.reviewDue': 2, 'study.goalPresent': true }
const enabledStudy = { ...DEFAULT_NOTIFICATION_SETTINGS, enabledRuleIds: ['study-review-due'], quietStart: '22:30', quietEnd: '07:00', maxPerDay: 6 }
assert.equal(evaluateNotificationRules(snapshot, enabledStudy, {}, 0, now).map((rule) => rule.id).includes('study-review-due'), true)
assert.equal(evaluateNotificationRules(snapshot, enabledStudy, { 'study-review-due': now.getTime() - 60_000 }, 0, now).length, 0, 'cooldown should prevent duplicate interruptions')
assert.equal(evaluateNotificationRules(snapshot, enabledStudy, {}, 6, now).length, 0, 'daily interruption budget should stop further alerts')
assert.equal(evaluateNotificationRules(snapshot, { ...enabledStudy, enabled: false }, {}, 0, now).length, 0, 'master switch should disable evaluation')

const prioritised = evaluateNotificationRules(
  {
    'training.hardPlanned': true,
    'activity.outdoorPlanned': true,
    'environment.hot': true,
    'nutrition.hydrationProgress': 0.2,
    'sleep.debtHours': 3,
    'recovery.score': 35,
  },
  {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    enabledRuleIds: ['heat-hard-training-hydration', 'sleep-debt-low-recovery'],
    maxPerDay: 6,
  },
  {},
  0,
  now,
)
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
assert.match(
  notificationPage,
  /Local smart combinations and achievement history remain available on this device/,
  'notification fallback copy should still state that local smart evaluation/history remains available when the backend is offline',
)

const appStatus = readFileSync('src/components/AppStatus.tsx', 'utf8')
assert.match(appStatus, /SmartNotificationOrchestrator/)

const serviceWorker = readFileSync('public/sw.js', 'utf8')
assert.match(serviceWorker, /notificationclick/)
assert.match(serviceWorker, /new URL\(raw, self\.registration\.scope\)/, 'notification route must be resolved against the service-worker scope')
assert.match(serviceWorker, /\.navigate\(destination\)/, 'an existing app window must navigate to the notification destination')
assert.match(serviceWorker, /clients\.openWindow\(destination\)/, 'notification click must open the destination when no app window exists')
assert.doesNotMatch(serviceWorker, /addEventListener\(['"]fetch['"]/, 'stability worker must not intercept fetch requests')

console.log(`smart notifications: ${SMART_NOTIFICATION_RULES.length} rules (${EXTRA_SMART_NOTIFICATION_RULES.length} wave-2), ${defaultEnabledRuleIds().length} enabled by default; all assertions passed`)
