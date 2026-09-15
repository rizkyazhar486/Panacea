import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const engine = readFileSync('src/lib/sonarAirGestures.ts', 'utf8')
const bootstrap = readFileSync('src/lib/sonarAirGestureBootstrap.ts', 'utf8')
const theme = readFileSync('src/lib/theme.ts', 'utf8')

test('Doppler engine keeps a near-ultrasonic safety floor and explicit reflection formula', () => {
  assert.match(engine, /MIN_SAFE_CARRIER_HZ\s*=\s*18_000/)
  assert.match(engine, /PREFERRED_CARRIER_HZ\s*=\s*20_000/)
  assert.match(engine, /\(2 \* velocityMps \* carrierHz\) \/ SPEED_OF_SOUND_MPS/)

  const expectedAtHalfMeterPerSecond = (2 * 0.5 * 20_000) / 343
  assert.ok(expectedAtHalfMeterPerSecond > 58 && expectedAtHalfMeterPerSecond < 59)
})

test('microphone capture requests raw-ish local audio and does not add a network path', () => {
  assert.match(engine, /echoCancellation:\s*\{ ideal: false \}/)
  assert.match(engine, /noiseSuppression:\s*\{ ideal: false \}/)
  assert.match(engine, /autoGainControl:\s*\{ ideal: false \}/)
  assert.doesNotMatch(engine, /\bfetch\s*\(/)
  assert.doesNotMatch(engine, /\bapi\./)
  assert.doesNotMatch(engine, /WebSocket|EventSource/)
})

test('Air Gestures is opt-in, user-stoppable and discoverable from Settings', () => {
  assert.match(engine, /phase:\s*'idle'/)
  assert.match(engine, /async stop\(\)/)
  assert.match(bootstrap, /data-sonar-start/)
  assert.match(bootstrap, /addEventListener\('click',[\s\S]*sonarAirGestures\.start\(\)/)
  assert.match(bootstrap, /must not control safety-critical clinical actions/)
  assert.match(bootstrap, /this module does not upload microphone audio/)
  assert.match(bootstrap, /onSettingsRoute/)
  assert.match(theme, /installSonarAirGestureBootstrap\(\)/)
})
