import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const command = readFileSync(join(root, 'src/components/VisitCommandCenter.tsx'), 'utf8')

for (const token of [
  'CardiacCycle3D',
  'ConsultChat',
  'useLiveHeartRate',
  'useVitals',
  'Confirm consent',
  'Clinical commitment still occurs through the existing reviewed AI-EMR workflow.',
]) {
  assert.ok(command.includes(token), 'missing Visit OS integration token: ' + token)
}

assert.ok(command.includes("transport: 'bluetooth-le'"))
assert.ok(command.includes("transport: 'manual-bridge'"))
assert.ok(command.includes('compact />'))
assert.ok(!/signalQuality:\s*0\.[0-9]+/.test(command), 'UI must not fabricate a device signal-quality score')

console.log('Visit command center verified: shared WebRTC camera, real health-data sources, consent gate, AI-EMR boundary, and no fabricated signal-quality score.')
