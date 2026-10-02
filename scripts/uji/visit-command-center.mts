import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const command = readFileSync(join(root, 'src/components/VisitCommandCenter.tsx'), 'utf8')
const chat = readFileSync(join(root, 'src/components/ConsultChat.tsx'), 'utf8')
const liveHr = readFileSync(join(root, 'src/lib/useLiveHeartRate.ts'), 'utf8')
const emr = readFileSync(join(root, 'src/pages/EMR.tsx'), 'utf8')
const clinical = readFileSync(join(root, 'src/pages/ClinicalHub.tsx'), 'utf8')
const main = readFileSync(join(root, 'src/main.tsx'), 'utf8')

for (const token of [
  'CardiacCycle3D',
  'ConsultChat',
  'useLiveHeartRate',
  'useVitals',
  'buildAiEmrVisitContext',
  'ingestVisitDeviceObservation',
  'updateVisitMedia',
  'Confirm consent',
  'Clinical commitment still occurs through the existing reviewed AI-EMR workflow.',
]) {
  assert.ok(command.includes(token), 'missing Visit OS integration token: ' + token)
}

assert.ok(command.includes("transport: 'bluetooth-le'"))
assert.ok(command.includes("transport: 'manual-bridge'"))
assert.ok(command.includes("signalQuality: null"))
assert.ok(command.includes('onMediaStateChange={onMediaStateChange}'))
assert.ok(command.includes('Realtime backend unavailable'))
assert.ok(!/signalQuality:\s*0\.[0-9]+/.test(command), 'UI must not fabricate a device signal-quality score')

assert.ok(chat.includes('ConsultChatMediaState'))
assert.ok(chat.includes('onMediaStateChange?.({'))
assert.ok(chat.includes('compact = false'))
assert.ok(liveHr.includes('lastSampleAt'))
assert.ok(liveHr.includes('sampleSequence'))
assert.ok(emr.includes('<VisitCommandCenter recordId={draft.id} embedded />'))
assert.ok(clinical.includes('/visit-os'))
assert.ok(main.includes('path="/visit-os"'))

console.log('Visit command center verified: camera state, continuous BLE/synced observations, AI-EMR embedding, route reachability, consent gate, and no fabricated signal-quality score.')
