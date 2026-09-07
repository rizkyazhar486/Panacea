import assert from 'node:assert/strict'
import {
  normalizeNotificationRoute,
  notificationPresentation,
  type UnifiedNotification,
} from '../../src/lib/notificationPresentation.ts'
import {
  canSurfaceUtilityNotification,
  ownerMilestoneToSurface,
} from '../../src/lib/notificationUtilities.ts'
import { DEFAULT_NOTIFICATION_SETTINGS } from '../../src/lib/notificationEngine.ts'

assert.equal(normalizeNotificationRoute('https://panaceamed.id/#/owner'), '/owner')
assert.equal(normalizeNotificationRoute('/latihan?t=analisis'), '/latihan?t=analisis')
assert.equal(normalizeNotificationRoute('https://external.example/path'), null)
assert.equal(normalizeNotificationRoute('//external.example/path'), null)
assert.equal(normalizeNotificationRoute('javascript:alert(1)'), null)

const base: UnifiedNotification = {
  id: 'smart:test',
  title: 'Notification',
  body: 'Body',
  route: null,
  at: '2026-09-07T00:00:00.000Z',
  read: true,
  source: 'smart',
  priority: 'normal',
  domains: [],
}

assert.equal(notificationPresentation({ ...base, title: 'Achievement unlocked · 10 km' }).label, 'Achievement')
assert.equal(notificationPresentation({ ...base, title: 'Ayat hari ini & arah kiblat' }).label, 'Faith & daily')
assert.equal(notificationPresentation({ ...base, title: 'Owner milestone · 500 users' }).label, 'Owner growth')
assert.equal(notificationPresentation({ ...base, title: 'Medication refill' }).label, 'Medication')

assert.equal(ownerMilestoneToSurface(99, []), null)
assert.equal(ownerMilestoneToSurface(100, []), 100)
assert.equal(ownerMilestoneToSurface(700, []), 500)
assert.equal(ownerMilestoneToSurface(700, [100, 250, 500]), null)
assert.equal(ownerMilestoneToSurface(1000, [100, 250, 500]), 1000)

const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, quietStart: '22:30', quietEnd: '07:00', maxPerDay: 6 }
assert.equal(canSurfaceUtilityNotification(settings, new Date(2026, 8, 7, 9, 0), 0), true)
assert.equal(canSurfaceUtilityNotification(settings, new Date(2026, 8, 7, 23, 0), 0), false)
assert.equal(canSurfaceUtilityNotification(settings, new Date(2026, 8, 7, 9, 0), 6), false)
assert.equal(canSurfaceUtilityNotification({ ...settings, enabled: false }, new Date(2026, 8, 7, 9, 0), 0), false)

console.log('notification presentation + utility guards: OK')
