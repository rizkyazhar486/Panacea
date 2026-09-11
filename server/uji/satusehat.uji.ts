import assert from 'node:assert/strict'
import { buildEmrBundle, getAccessToken, postResource, submitEmr } from '../src/satusehat'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const originalClientId = process.env.SATUSEHAT_CLIENT_ID
const originalClientSecret = process.env.SATUSEHAT_CLIENT_SECRET

try {
  {
    const uuids = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ]
    const bundle = buildEmrBundle(
      { id: 'local-7', name: '  Test   Patient  ', sex: '?', dob: '2026-02-30', mrn: ' MRN-1 ' },
      {
        problems: [
          { title: '  Hypertension  ', assessment: ' reviewed   clinically ' },
          { title: '   ', assessment: 'must be skipped' },
        ],
        vitals: [
          { label: 'Heart rate', value: '72', unit: ' bpm ', at: '2026-09-08T07:00:00Z' },
          { label: 'Broken', value: 'not-a-number', unit: 'x' },
        ],
      },
      '  Dr   Example ',
      {
        now: new Date('2026-09-08T08:00:00.000Z'),
        uuid: () => uuids.shift() as string,
      },
    )

    assert.equal(bundle.resourceType, 'Bundle')
    assert.equal(bundle.type, 'transaction')
    assert.equal(bundle.entry.length, 4)

    const patient = bundle.entry[0]
    const encounter = bundle.entry[1]
    const condition = bundle.entry[2]
    const observation = bundle.entry[3]

    assert.equal(patient.fullUrl, 'urn:uuid:11111111-1111-4111-8111-111111111111')
    assert.equal(encounter.fullUrl, 'urn:uuid:22222222-2222-4222-8222-222222222222')
    assert.equal(patient.resource.name[0].text, 'Test Patient')
    assert.equal(patient.resource.gender, 'unknown')
    assert.equal(patient.resource.birthDate, undefined)
    assert.equal(patient.resource.identifier[0].system, 'https://panaceamed.id/mrn')
    assert.equal(patient.resource.identifier[0].value, 'MRN-1')

    assert.equal(encounter.resource.subject.reference, patient.fullUrl)
    assert.equal(encounter.resource.participant[0].individual.display, 'Dr Example')
    assert.equal(encounter.resource.period.start, '2026-09-08T08:00:00.000Z')

    assert.equal(condition.resource.code.text, 'Hypertension')
    assert.equal(condition.resource.note[0].text, 'reviewed clinically')
    assert.equal(condition.resource.subject.reference, patient.fullUrl)
    assert.equal(condition.resource.encounter.reference, encounter.fullUrl)

    assert.equal(observation.resource.valueQuantity.value, 72)
    assert.equal(observation.resource.valueQuantity.unit, 'bpm')
    assert.equal(observation.resource.effectiveDateTime, '2026-09-08T07:00:00.000Z')
  }

  {
    let calls = 0
    const neverFetch: typeof fetch = async () => {
      calls++
      throw new Error('network should not be reached')
    }
    await assert.rejects(
      postResource('../Patient', { resourceType: 'Patient' }, neverFetch),
      /satusehat_invalid_resource_type/,
    )
    await assert.rejects(
      postResource('Observation', { resourceType: 'Condition' }, neverFetch),
      /satusehat_resource_type_mismatch/,
    )
    assert.equal(calls, 0)
  }

  process.env.SATUSEHAT_CLIENT_ID = 'ci-client'
  process.env.SATUSEHAT_CLIENT_SECRET = 'ci-secret'

  {
    let signalSeen = false
    const badAuthFetch: typeof fetch = async (_input, init) => {
      signalSeen = init?.signal instanceof AbortSignal
      return jsonResponse({ access_token: '', expires_in: 3600 })
    }
    await assert.rejects(getAccessToken(badAuthFetch), /satusehat_auth_invalid_payload/)
    assert.equal(signalSeen, true)
  }

  {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch: typeof fetch = async (input, init) => {
      const url = String(input)
      calls.push({ url, init })
      if (url.includes('/oauth2/v1/accesstoken')) {
        return jsonResponse({ access_token: 'token-123', expires_in: 3600 })
      }
      return jsonResponse({ resourceType: 'Observation', id: 'obs-1' })
    }

    const result = await postResource(
      'Observation',
      { resourceType: 'Observation', status: 'final' },
      fakeFetch,
    ) as { id?: string }

    assert.equal(result.id, 'obs-1')
    assert.equal(calls.length, 2)
    assert.match(calls[0].url, /accesstoken\?grant_type=client_credentials$/)
    assert.doesNotMatch(calls[0].url, /ci-secret/)
    assert.equal(calls[0].init?.method, 'POST')
    assert.match(String(calls[0].init?.body), /client_id=ci-client/)
    assert.match(String(calls[0].init?.body), /client_secret=ci-secret/)
    assert.equal(calls[0].init?.signal instanceof AbortSignal, true)

    assert.match(calls[1].url, /\/fhir-r4\/v1\/Observation$/)
    assert.equal(calls[1].init?.method, 'POST')
    assert.equal((calls[1].init?.headers as Record<string, string>).authorization, 'Bearer token-123')
    assert.equal(calls[1].init?.signal instanceof AbortSignal, true)
  }

  {
    delete process.env.SATUSEHAT_CLIENT_ID
    delete process.env.SATUSEHAT_CLIENT_SECRET
    let calls = 0
    const neverFetch: typeof fetch = async () => {
      calls++
      throw new Error('network should not be reached')
    }
    const result = await submitEmr(
      { name: 'Preview Patient', sex: 'P', dob: '2000-01-01' },
      { problems: [], vitals: [] },
      'Preview Clinician',
      neverFetch,
    )
    assert.equal(result.configured, false)
    assert.equal(calls, 0)
    assert.equal(result.summary.resources, 2)
    assert.equal(result.preview.resourceType, 'Bundle')
  }

  console.log('SATUSEHAT FHIR boundary regression checks passed.')
} finally {
  if (originalClientId === undefined) delete process.env.SATUSEHAT_CLIENT_ID
  else process.env.SATUSEHAT_CLIENT_ID = originalClientId
  if (originalClientSecret === undefined) delete process.env.SATUSEHAT_CLIENT_SECRET
  else process.env.SATUSEHAT_CLIENT_SECRET = originalClientSecret
}
