import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const component = fs.readFileSync(path.join(root, 'src/components/DailyTrainingModes.tsx'), 'utf8')
const library = fs.readFileSync(path.join(root, 'src/lib/dailyTrainingModes.ts'), 'utf8')
const organizer = fs.readFileSync(path.join(root, 'src/pages/OrganizerLatihan.tsx'), 'utf8')

for (const mode of ['calisthenics', 'gymnastics', 'amrap', 'hyrox']) {
  assert.ok(library.includes(mode), `missing training mode: ${mode}`)
}

for (const marker of ['Push', 'Pull', 'Legs', 'Core', 'run']) {
  assert.ok((component + library + organizer).toLowerCase().includes(marker.toLowerCase()), `missing training category: ${marker}`)
}

assert.ok(component.includes('Daily reminder'), 'daily reminder control must remain visible')
assert.ok(component.includes('Notification.requestPermission'), 'browser notification permission flow missing')
assert.ok(component.includes('Closed-app delivery requires an installed PWA/push worker'), 'notification limitation must be explicit')
assert.ok(component.includes('min-h-11'), 'mobile touch targets must remain present')
assert.ok(component.includes('Session timer'), 'session timer missing')
assert.ok(component.includes('Completed rounds'), 'AMRAP round counter missing')
assert.ok(component.includes("mode === 'hyrox'"), 'HYROX progress handling missing')

assert.ok(organizer.includes("../components/DailyTrainingModes"), 'canonical organizer must import DailyTrainingModes')
assert.ok(organizer.includes('<DailyTrainingModes />'), 'canonical organizer must render DailyTrainingModes')
assert.ok(organizer.includes('Runs kept'), 'existing run-aware weekly planner must be preserved')
assert.ok(organizer.includes('susunPekan'), 'existing weekly organizer logic must be preserved')

console.log('athlete-daily-training-modes: ok')
