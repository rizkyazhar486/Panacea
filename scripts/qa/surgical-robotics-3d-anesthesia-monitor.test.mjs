import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('SurgicalRobotics3DViewport uses safe renderer, guarded loop, resource disposal and non-actuated boundary', () => {
  const vp = readFileSync(new URL('../../src/pages/bodyhub/SurgicalRobotics3DViewport.tsx', import.meta.url), 'utf8')
  assert.match(vp, /buatRendererAman/)
  assert.match(vp, /mulaiLoopTerjaga/)
  assert.match(vp, /data-surgical-robotics-3d="v1"/)
  assert.match(vp, /data-live-actuator-connected="false"/)
  assert.match(vp, /clinically_reviewed=false/)
  assert.match(vp, /renderer\.dispose\(\)/)
  assert.match(vp, /tissueGeo\.dispose\(\)/)
  assert.match(vp, /automatedSutureWaypoints/)
  assert.match(vp, /safeHoldTriggered/)
  assert.doesNotMatch(vp, /\bctx\.filter\b/)
  assert.doesNotMatch(vp, /\blocalStorage\b/)
  assert.doesNotMatch(vp, /\bas any\b/)
})

test('AnesthesiaMonitorCanvas exposes 4 live waveform channels, regional dermatomes and epistemic disclosure', () => {
  const mon = readFileSync(new URL('../../src/pages/bodyhub/AnesthesiaMonitorCanvas.tsx', import.meta.url), 'utf8')
  assert.match(mon, /data-anesthesia-monitor="v1"/)
  assert.match(mon, /ECG II/)
  assert.match(mon, /SpO₂ Pleth/)
  assert.match(mon, /EtCO₂/)
  assert.match(mon, /BIS EEG/)
  assert.match(mon, /brachial_plexus/)
  assert.match(mon, /neuraxial_T10/)
  assert.match(mon, /neuraxial_T4/)
  assert.match(mon, /clinically_reviewed=false/)
  assert.match(mon, /cancelAnimationFrame/)
  assert.doesNotMatch(mon, /\bctx\.filter\b/)
  assert.doesNotMatch(mon, /\blocalStorage\b/)
  assert.doesNotMatch(mon, /\bas any\b/)
})

test('SurgicalRoboticsAnesthesiaLab lazily mounts 3D Robotics/Tele-Robotics and live Anesthesia Monitor', () => {
  const lab = readFileSync(new URL('../../src/pages/bodyhub/SurgicalRoboticsAnesthesiaLab.tsx', import.meta.url), 'utf8')
  assert.match(lab, /data-robotics-anesthesia-lab="v1"/)
  assert.match(lab, /data-live-actuator-connected="false"/)
  assert.match(lab, /lazy\(\(\) => import\('\.\/SurgicalRobotics3DViewport'\)\)/)
  assert.match(lab, /lazy\(\(\) => import\('\.\/AnesthesiaMonitorCanvas'\)\)/)
  assert.match(lab, /jawOpenPct/)
  assert.match(lab, /autoSuturePlaying/)
  assert.match(lab, /mode="robotics"/)
  assert.match(lab, /mode="distant"/)
  assert.doesNotMatch(lab, /\blocalStorage\b/)
})
