import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EMBODIED_PERCEPTION_ADAPTER_POLICY,
  adaptExternalEmbodiedPerceptionPacket,
  adaptExternalEmbodiedPerceptionStream,
} from '../../src/domains/observability/index.ts'

function packet(overrides = {}) {
  return {
    schemaVersion: '1',
    packetId: 'packet-1',
    workspaceId: 'bench-1',
    capturedAt: '2026-09-30T01:00:00.000Z',
    sequence: 10,
    authorization: {
      captureAuthorized: true,
      purposeRef: 'research-protocol:bench-observation',
      authorizedAt: '2026-09-30T00:55:00.000Z',
    },
    source: {
      kind: 'head-mounted-camera',
      id: 'headcam-1',
      modelVersion: 'perception-model-1',
      calibrationRef: 'calibration:headcam-1:2026-09-30',
    },
    detections: [
      {
        id: 'hand-1',
        kind: 'hand',
        label: 'right hand',
        handedness: 'right',
        confidence: 0.98,
        box: { xMin: 0, yMin: 0, xMax: 0.4, yMax: 0.8 },
      },
      {
        id: 'pipette-1',
        kind: 'instrument',
        label: 'pipette',
        confidence: 0.96,
        box: { xMin: 0.4, yMin: 0.1, xMax: 1, yMax: 0.9 },
      },
    ],
    relations: [
      {
        id: 'relation-1',
        handDetectionId: 'hand-1',
        objectDetectionId: 'pipette-1',
        actionLabel: 'grasp',
        spatialConfidence: 0.94,
        temporalConfidence: 0.93,
        contactConfidence: 0.92,
        actionConfidence: 0.91,
      },
    ],
    ...overrides,
  }
}

test('positive: authorized external packet normalizes into canonical embodied frame', () => {
  const frame = adaptExternalEmbodiedPerceptionPacket(packet())

  assert.equal(frame.id, 'packet-1')
  assert.equal(frame.workspaceId, 'bench-1')
  assert.equal(frame.source.kind, 'head-mounted-camera')
  assert.equal(frame.source.modelVersion, 'perception-model-1')
  assert.equal(frame.detections.length, 2)
  assert.equal(frame.relations.length, 1)
  assert.equal(frame.detections[0].box.xMin, 0)
  assert.equal(frame.detections[1].box.xMax, 1)
})

test('security: packet is rejected when capture authorization is absent', () => {
  const input = packet({
    authorization: {
      captureAuthorized: false,
      purposeRef: 'research-protocol:bench-observation',
      authorizedAt: '2026-09-30T00:55:00.000Z',
    },
  })

  assert.throws(
    () => adaptExternalEmbodiedPerceptionPacket(input),
    /captureAuthorized must be true/,
  )
})

test('security: packet is rejected when authorization was revoked before capture', () => {
  const input = packet({
    authorization: {
      captureAuthorized: true,
      purposeRef: 'research-protocol:bench-observation',
      authorizedAt: '2026-09-30T00:55:00.000Z',
      revokedAt: '2026-09-30T00:59:00.000Z',
    },
  })

  assert.throws(
    () => adaptExternalEmbodiedPerceptionPacket(input),
    /authorization is revoked/,
  )
})

test('privacy: raw media and identity-bearing fields fail closed at adapter boundary', () => {
  for (const field of ['rawMedia', 'imageData', 'patientId', 'operatorId']) {
    assert.throws(
      () => adaptExternalEmbodiedPerceptionPacket(packet({ [field]: 'forbidden' })),
      new RegExp('forbidden field: ' + field),
    )
  }

  assert.equal(EMBODIED_PERCEPTION_ADAPTER_POLICY.rawMediaAccepted, false)
  assert.equal(EMBODIED_PERCEPTION_ADAPTER_POLICY.identityFieldsAccepted, false)
})

test('privacy: nested raw media and identity-bearing fields fail closed anywhere in packet', () => {
  const baseSource = packet().source
  const cases = [
    [
      'rawMedia',
      packet({
        source: {
          ...baseSource,
          rawMedia: 'forbidden',
        },
      }),
    ],
    [
      'patientId',
      packet({
        detections: [
          {
            id: 'hand-1',
            kind: 'hand',
            label: 'right hand',
            handedness: 'right',
            confidence: 0.98,
            metadata: {
              patientId: 'patient-1',
            },
          },
        ],
        relations: [],
      }),
    ],
    [
      'imageData',
      packet({
        extension: {
          nested: {
            imageData: 'forbidden',
          },
        },
      }),
    ],
  ]

  for (const [field, input] of cases) {
    assert.throws(
      () => adaptExternalEmbodiedPerceptionPacket(input),
      new RegExp('forbidden field: ' + field),
    )
  }
})

test('privacy: benign nested extension data remains accepted when it has no forbidden fields', () => {
  const frame = adaptExternalEmbodiedPerceptionPacket(packet({
    extension: {
      vendor: {
        qualityTier: 'research',
      },
    },
  }))

  assert.equal(frame.id, 'packet-1')
  assert.equal(frame.source.id, 'headcam-1')
})

test('negative: confidence outside the closed unit interval is rejected', () => {
  const input = packet({
    detections: [
      {
        id: 'hand-1',
        kind: 'hand',
        label: 'right hand',
        handedness: 'right',
        confidence: 1.01,
      },
    ],
    relations: [],
  })

  assert.throws(
    () => adaptExternalEmbodiedPerceptionPacket(input),
    /confidence must be inside \[0, 1\]/,
  )
})

test('boundary: normalized boxes accept 0 and 1 but reject zero-width geometry', () => {
  const valid = adaptExternalEmbodiedPerceptionPacket(packet())
  assert.equal(valid.detections[0].box.xMin, 0)
  assert.equal(valid.detections[1].box.xMax, 1)

  const invalid = packet({
    detections: [
      {
        id: 'hand-1',
        kind: 'hand',
        label: 'right hand',
        handedness: 'right',
        confidence: 0.98,
        box: { xMin: 0.2, yMin: 0.2, xMax: 0.2, yMax: 0.4 },
      },
    ],
    relations: [],
  })
  assert.throws(
    () => adaptExternalEmbodiedPerceptionPacket(invalid),
    /positive width and height/,
  )
})

test('integrity: relation must reference an actual hand and non-hand object', () => {
  const invalid = packet({
    detections: [
      { id: 'tool-a', kind: 'instrument', label: 'pipette', confidence: 0.9 },
      { id: 'tool-b', kind: 'container', label: 'tube', confidence: 0.9 },
    ],
    relations: [
      {
        id: 'relation-bad',
        handDetectionId: 'tool-a',
        objectDetectionId: 'tool-b',
        actionLabel: 'grasp',
        spatialConfidence: 0.9,
        temporalConfidence: 0.9,
        contactConfidence: 0.9,
        actionConfidence: 0.9,
      },
    ],
  })

  assert.throws(
    () => adaptExternalEmbodiedPerceptionPacket(invalid),
    /handDetectionId must reference a hand/,
  )
})

test('continuity: missing packet sequence is preserved as an explicit gap', () => {
  const first = packet()
  const third = packet({
    packetId: 'packet-3',
    sequence: 12,
    capturedAt: '2026-09-30T01:00:02.000Z',
  })

  const stream = adaptExternalEmbodiedPerceptionStream([first, third])

  assert.equal(stream.continuity.firstSequence, 10)
  assert.equal(stream.continuity.lastSequence, 12)
  assert.equal(stream.continuity.missingPacketCount, 1)
  assert.deepEqual(stream.continuity.gaps, [{
    kind: 'sequence-gap',
    afterSequence: 10,
    beforeSequence: 12,
    missingPackets: 1,
  }])
})

test('continuity: timestamp regression is surfaced instead of silently reordered', () => {
  const first = packet()
  const second = packet({
    packetId: 'packet-2',
    sequence: 11,
    capturedAt: '2026-09-30T00:59:59.000Z',
  })

  const stream = adaptExternalEmbodiedPerceptionStream([first, second])

  assert.equal(stream.frames[0].id, 'packet-1')
  assert.equal(stream.frames[1].id, 'packet-2')
  assert.deepEqual(stream.continuity.gaps, [{
    kind: 'timestamp-regression',
    previousSequence: 10,
    currentSequence: 11,
    previousCapturedAt: '2026-09-30T01:00:00.000Z',
    currentCapturedAt: '2026-09-30T00:59:59.000Z',
  }])
})

test('integrity: duplicate or decreasing stream sequence fails closed', () => {
  const duplicate = packet({
    packetId: 'packet-2',
    sequence: 10,
    capturedAt: '2026-09-30T01:00:01.000Z',
  })

  assert.throws(
    () => adaptExternalEmbodiedPerceptionStream([packet(), duplicate]),
    /sequence must increase strictly/,
  )
})
