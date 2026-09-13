import fs from 'node:fs'
import assert from 'node:assert/strict'
import {
  TRAINING_MODE_META,
  dateKey,
  getDailyTrainingSession,
  isValidReminderTime,
  reminderDue,
  trainingLoadModifier,
  type TrainingLevel,
  type TrainingMode,
} from '../../src/lib/dailyTrainingModes.ts'

const modes = Object.keys(TRAINING_MODE_META) as TrainingMode[]
const levels: TrainingLevel[] = ['beginner', 'intermediate', 'advanced']
assert.deepEqual(modes, ['calisthenics', 'gymnastics', 'amrap', 'hyrox'])

for (const mode of modes) {
  for (const level of levels) {
    const session = getDailyTrainingSession(mode, level, new Date(2026, 8, 13, 10, 0, 0))
    assert.equal(session.mode, mode)
    assert.equal(session.level, level)
    assert.ok(session.durationMin >= 20)
    assert.ok(session.blocks.length >= 1)
    assert.ok(session.safety.length >= 1)
    for (const block of session.blocks) {
      assert.ok(block.label.length > 2)
      assert.ok(block.prescription.length > 1)
      assert.ok(block.cue.length > 5)
    }
  }
}

const hyroxAdvanced = getDailyTrainingSession('hyrox', 'advanced', new Date(2026, 8, 13))
assert.equal(hyroxAdvanced.blocks.length, 8)
assert.ok(hyroxAdvanced.blocks.every((block) => /1 km/.test(block.prescription)))
assert.match(hyroxAdvanced.safety.join(' '), /current event rules/i)

const gymnasticsAdvanced = getDailyTrainingSession('gymnastics', 'advanced', new Date(2026, 8, 13))
assert.match(gymnasticsAdvanced.safety.join(' '), /excludes flips, release moves/i)

assert.equal(isValidReminderTime('07:00'), true)
assert.equal(isValidReminderTime('23:59'), true)
assert.equal(isValidReminderTime('24:00'), false)
assert.equal(isValidReminderTime('7:00'), false)

const before = new Date(2026, 8, 13, 6, 59)
const due = new Date(2026, 8, 13, 7, 0)
const settings = { enabled: true, time: '07:00', lastDeliveredDate: null }
assert.equal(reminderDue(settings, before), false)
assert.equal(reminderDue(settings, due), true)
assert.equal(reminderDue({ ...settings, lastDeliveredDate: dateKey(due) }, new Date(2026, 8, 13, 22, 0)), false)
assert.equal(reminderDue({ ...settings, enabled: false }, due), false)

assert.equal(trainingLoadModifier({ recoveryHrs: 30, sleepScore: 85 }).factor, 0.6)
assert.equal(trainingLoadModifier({ recoveryHrs: 5, sleepScore: 55 }).factor, 0.6)
assert.equal(trainingLoadModifier({ acuteLoad: 160, chronicLoad: 100 }).factor, 0.6)
assert.equal(trainingLoadModifier({ recoveryHrs: 14, sleepScore: 80 }).factor, 0.8)
assert.equal(trainingLoadModifier({ recoveryHrs: 0, sleepScore: 90, acuteLoad: 90, chronicLoad: 100 }).factor, 1)

const ui = fs.readFileSync('src/components/DailyTrainingModes.tsx', 'utf8')
for (const term of [
  'Daily Training Modes', 'Calisthenics', 'Gymnastics', 'AMRAP', 'HYROX',
  'Notification.requestPermission()', 'new Notification', '30_000',
  'data-daily-training-modes="true"', 'min-h-11', 'aria-pressed',
  'Closed-app delivery requires an installed PWA/push worker',
  'Completed rounds', 'Session timer', 'Daily reminder',
]) {
  assert.ok(ui.includes(term), `Missing daily training UI guard: ${term}`)
}

const wrapper = fs.readFileSync('src/pages/Athlete.tsx', 'utf8')
assert.ok(wrapper.includes("from './AthleteCore'"), 'Athlete wrapper must preserve the original page byte-for-byte through AthleteCore')
assert.ok(wrapper.includes('DailyTrainingModes'), 'Athlete route must expose daily training modes')

console.log('athlete daily training modes: four-mode engine, safety scaling, reminder semantics and Athlete reachability guarded')
