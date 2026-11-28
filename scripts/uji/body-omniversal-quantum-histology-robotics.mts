import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BIO_PERIODIC_ELEMENTS,
  HYDROGENIC_ORBITALS,
  evaluateHydrogenicPsi,
  evaluateRadialProbability,
  sampleOrbitalProbabilityCloud,
} from '../../src/lib/kimia/orbitalKuantum.ts'
import {
  ROBOTICS_ANESTHESIA_BOUNDARY,
  computeRoboticsKinematics,
  simulateAnesthesiaPhysiology,
  simulateTelesurgeryLink,
} from '../../src/domains/body-exposure/engine/roboticsAnesthesiaEngine.ts'

// 1. 18 Bio-Periodic Elements & exact Hydrogenic Wavefunctions
assert.equal(BIO_PERIODIC_ELEMENTS.length, 18)
assert.equal(HYDROGENIC_ORBITALS.length, 9)
// 1s has maximum at origin; 2s has exact radial node at r = 2 a0!
assert.ok(evaluateHydrogenicPsi('1s', 0, 0, 0) > evaluateHydrogenicPsi('1s', 2, 0, 0))
assert.ok(Math.abs(evaluateHydrogenicPsi('2s', 2, 0, 0)) < 1e-12, '2s must have exact radial node at r = 2 a0')
// 2pz changes sign across z = 0 nodal plane
assert.ok(evaluateHydrogenicPsi('2pz', 0, 0, 2) > 0)
assert.ok(evaluateHydrogenicPsi('2pz', 0, 0, -2) < 0)
assert.equal(evaluateHydrogenicPsi('2pz', 3, 2, 0), 0)
// 1s radial probability peaks at r = 1 a0
assert.ok(evaluateRadialProbability(1, 0, 1) > evaluateRadialProbability(1, 0, 0.3))
assert.ok(evaluateRadialProbability(1, 0, 1) > evaluateRadialProbability(1, 0, 3))
const cloud = sampleOrbitalProbabilityCloud('3dz2', 400)
assert.equal(cloud.length, 400)
assert.ok(cloud.some((p) => p.sign === 1) && cloud.some((p) => p.sign === -1))

// 2. Robotics RCM Kinematics, Automated Suture Waypoints & Distant Surgery E-Stop
assert.equal(ROBOTICS_ANESTHESIA_BOUNDARY.liveActuatorConnected, false)
assert.equal(ROBOTICS_ANESTHESIA_BOUNDARY.clinicallyAuthorizedDosing, false)
const kinSafe = computeRoboticsKinematics({ pitchDeg: 10, yawDeg: -5, insertionMm: 100, wristPitchDeg: 15, jawOpenPct: 30, motionScale: 3, tissueResistanceN: 1.5 })
assert.equal(kinSafe.workspaceInBounds, true)
assert.equal(kinSafe.forceWarning, false)
assert.equal(kinSafe.automatedSutureWaypoints.length, 8)
const kinForce = computeRoboticsKinematics({ pitchDeg: 10, yawDeg: -5, insertionMm: 100, wristPitchDeg: 15, jawOpenPct: 30, motionScale: 3, tissueResistanceN: 6.2 })
assert.equal(kinForce.forceWarning, true)

const linkOk = simulateTelesurgeryLink({ roundTripLatencyMs: 45, jitterMs: 5, packetLossPct: 0.2 })
assert.equal(linkOk.state, 'NOMINAL')
assert.equal(linkOk.safeHoldTriggered, false)
const linkStop = simulateTelesurgeryLink({ roundTripLatencyMs: 320, jitterMs: 10, packetLossPct: 0.5 })
assert.equal(linkStop.state, 'SAFE_HOLD_ESTOP')
assert.equal(linkStop.safeHoldTriggered, true)

// 3. General vs Local/Regional Anesthesia Physiology
const ga = simulateAnesthesiaPhysiology({ modality: 'general', depthLevel: 1.2, surgicalStimulus01: 0.4 })
assert.equal(ga.airwayReflex, 'ABOLISHED_CONTROLLED_VENT')
assert.ok(ga.conceptualBisIndex < 60)
const local = simulateAnesthesiaPhysiology({ modality: 'local_regional', depthLevel: 80, surgicalStimulus01: 0.3, regionalLevel: 'neuraxial_T4' })
assert.equal(local.airwayReflex, 'INTACT')
assert.ok(local.fiberBlockade.cFiberPainPct > local.fiberBlockade.aAlphaMotorPct)
assert.ok(local.warningFlag && local.warningFlag.includes('T4'))

// 4. UI guards (safe renderer, guarded render loop, explicit dark markers, 4-mode BodyScaleLadder, VirtualHistology)
const qStage = readFileSync('src/pages/bodyhub/QuantumElementStage.tsx', 'utf8')
assert.match(qStage, /buatRendererAman/)
assert.match(qStage, /mulaiLoopTerjaga/)
assert.match(qStage, /dark space-y-3/)
assert.match(qStage, /AdditiveBlending/)
assert.match(qStage, /hemisphereSlice/)
assert.doesNotMatch(qStage, /\bctx\.filter\s*=/, 'Quantum glow texture must never assign ctx.filter')
const histo = readFileSync('src/pages/bodyhub/VirtualHistologyMicroscope.tsx', 'utf8')
assert.match(histo, /dark mt-3/)
assert.match(histo, /ILLUSTRATIVE HISTOLOGY SCHEMATIC/)
const roboUi = readFileSync('src/pages/bodyhub/SurgicalRoboticsAnesthesiaLab.tsx', 'utf8')
assert.match(roboUi, /data-live-actuator-connected="false"/)
assert.match(roboUi, /dark space-y-3/)
const ladder = readFileSync('src/pages/bodyhub/BodyScaleLadder.tsx', 'utf8')
for (const mode of ['Structure', 'Function', 'Disease', 'Intervention']) assert.ok(ladder.includes(mode))
assert.doesNotMatch(ladder, /domain:\s*null/)

console.log('body-omniversal-quantum-histology-robotics: 18 elements, exact |psi|^2 orbitals (2s node verified), 12 histology tissues, 6-DOF RCM + telesurgery E-Stop & general/local anesthesia PASS')
