import {
  fetchHraReferenceOrgans,
  HRA_REFERENCE_ORGANS_URL,
} from '../src/hraReference.ts'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) {
    lulus++
    console.log('ok    ', nama)
  } else {
    gagal++
    console.log('GAGAL ', nama, ket)
  }
}

{
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    ok('endpoint HRA fixed ke reference-organs production', url === HRA_REFERENCE_ORGANS_URL, url)
    ok('request mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)
    ok('request hanya meminta JSON', new Headers(init?.headers).get('Accept') === 'application/json')

    return new Response(JSON.stringify([
      {
        '@id': 'http://purl.org/ccf/1.5/entity/heart-male',
        '@type': 'SpatialEntity',
        entityId: 'http://purl.obolibrary.org/obo/UBERON_0000948',
        label: '  Heart   reference organ  ',
        ccf_annotations: [
          'http://purl.obolibrary.org/obo/UBERON_0000948',
          'http://purl.obolibrary.org/obo/UBERON_0000948',
          '',
          42,
        ],
        representation_of: 'http://purl.obolibrary.org/obo/UBERON_0000948',
        reference_organ: 'http://purl.org/ccf/1.5/entity/heart',
        sex: 'Male',
        side: 'Left',
        object: { file: 'heart.glb', file_format: 'model/gltf-binary' },
      },
      {
        '@type': 'SpatialEntity',
        label: 'missing id must be ignored',
      },
      {
        '@id': 'http://example.test/not-spatial',
        '@type': 'OtherType',
        label: 'wrong record type must be ignored',
      },
      {
        '@id': 'http://purl.org/ccf/1.5/entity/heart-male',
        '@type': 'SpatialEntity',
        label: 'duplicate id must be ignored',
      },
    ]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const hasil = await fetchHraReferenceOrgans(fakeFetch)
  ok('hanya record SpatialEntity valid dan unik dipertahankan', hasil.length === 1, String(hasil.length))
  const organ = hasil[0]
  ok('HRA @id dipertahankan sebagai identity', organ?.id === 'http://purl.org/ccf/1.5/entity/heart-male')
  ok('entity ontology IRI dipertahankan tanpa mapping buatan', organ?.entityId === 'http://purl.obolibrary.org/obo/UBERON_0000948')
  ok('label whitespace dinormalisasi', organ?.label === 'Heart reference organ', organ?.label ?? '')
  ok('annotation dideduplikasi dan malformed dibuang', organ?.annotations.length === 1, String(organ?.annotations.length))
  ok('representation_of dipertahankan', organ?.representationOf === 'http://purl.obolibrary.org/obo/UBERON_0000948')
  ok('reference_organ dipertahankan', organ?.referenceOrgan === 'http://purl.org/ccf/1.5/entity/heart')
  ok('sex dan side hanya menerima enum resmi', organ?.sex === 'Male' && organ.side === 'Left')
  ok('provenance source eksplisit', organ?.source === 'hubmap-hra')
  ok('provenance URL menunjuk request HRA asli', organ?.sourceUrl === HRA_REFERENCE_ORGANS_URL)
  ok('mesh/object upstream tidak bocor ke normalized semantic contract', !('object' in (organ ?? {})))
}

{
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({ not: 'an array' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
  let pesan = ''
  try {
    await fetchHraReferenceOrgans(fakeFetch)
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('payload top-level malformed gagal tertutup', pesan === 'hra_reference_organs_invalid_payload', pesan)
}

{
  const fakeFetch: typeof fetch = async () => new Response(null, { status: 503 })
  let pesan = ''
  try {
    await fetchHraReferenceOrgans(fakeFetch)
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('HTTP failure tidak disamarkan sebagai data kosong', pesan === 'hra_reference_organs_503', pesan)
}

{
  const fakeFetch: typeof fetch = async () => {
    const payload = Array.from({ length: 300 }, (_, i) => ({
      '@id': `http://purl.org/ccf/1.5/entity/test-${i}`,
      '@type': 'SpatialEntity',
      label: `Organ ${i}`,
      ccf_annotations: Array.from({ length: 80 }, (_, j) => `http://example.test/annotation/${j}`),
      sex: 'Unknown',
      side: 'Central',
    }))
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  const hasil = await fetchHraReferenceOrgans(fakeFetch)
  ok('jumlah reference organ dibatasi 256', hasil.length === 256, String(hasil.length))
  ok('annotation per organ dibatasi 64', hasil[0]?.annotations.length === 64, String(hasil[0]?.annotations.length))
  ok('sex di luar enum tidak ditebak', hasil[0]?.sex === null)
  ok('side di luar enum tidak ditebak', hasil[0]?.side === null)
}

console.log(`\nHRA reference organ adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
