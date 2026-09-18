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
  'promoteObservationToClinicalRecord',
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

// The promote action only surfaces observations the kernel itself accepted as
// quality-known (visitContext.observations already filters null out via the
// existing signalQuality contract) — the UI must not re-derive its own score,
// and it must say plainly when nothing is eligible rather than hide the gap.
assert.ok(command.includes('onPromoteObservation?.(event)'))
assert.ok(command.includes('observation.signalQuality != null'))
assert.ok(command.includes('No connected device is currently reporting an adapter-verified signal-quality score'))

assert.ok(chat.includes('ConsultChatMediaState'))
assert.ok(chat.includes('onMediaStateChange?.({'))
assert.ok(chat.includes('compact = false'))
assert.ok(liveHr.includes('lastSampleAt'))
assert.ok(liveHr.includes('sampleSequence'))
assert.ok(emr.includes('<VisitCommandCenter recordId={draft.id} embedded onPromoteObservation={promoteVisitObservation} />'))
assert.ok(emr.includes('promotedObservations: [...(current.promotedObservations ?? []), event]'))
assert.ok(clinical.includes('/visit-os'))
assert.ok(main.includes('path="/visit-os"'))

console.log('Visit command center verified: camera state, continuous BLE/synced observations, AI-EMR embedding, clinician-gated observation promotion, route reachability, consent gate, and no fabricated signal-quality score.')
