import { searchTrials } from '../src/trials.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const fetchAsli = globalThis.fetch

async function denganFetchPalsu(
  fn: typeof fetch,
  run: () => Promise<void>,
) {
  globalThis.fetch = fn
  try {
    await run()
  } finally {
    globalThis.fetch = fetchAsli
  }
}

await denganFetchPalsu(async (input, init) => {
  const url = new URL(String(input))
  ok('query dinormalisasi sebelum dikirim upstream', url.searchParams.get('query.term') === 'stem cell osteoarthritis')
  ok('recruiting filter diteruskan', url.searchParams.get('filter.overallStatus') === 'RECRUITING')
  ok('country dinormalisasi', url.searchParams.get('query.locn') === 'Indonesia')
  ok('payload upstream dibatasi ke field yang dirender', url.searchParams.get('fields')?.includes('NCTId') === true)
  ok('upstream request mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)

  return new Response(JSON.stringify({
    studies: [
      {
        protocolSection: {
          identificationModule: { nctId: ' nct01234567 ', briefTitle: 'A real registered study' },
          statusModule: { overallStatus: 'RECRUITING' },
          conditionsModule: { conditions: ['Osteoarthritis', 'Knee Pain'] },
          designModule: { phases: ['PHASE2'] },
          contactsLocationsModule: {
            locations: [
              { city: 'Jakarta', country: 'Indonesia' },
              { city: 'Bandung', country: 'Indonesia' },
              { city: 'Singapore', country: 'Singapore' },
            ],
          },
        },
      },
      {
        protocolSection: {
          identificationModule: { nctId: 'NCT01234567/../../../fake', briefTitle: 'Malformed identity must be rejected' },
        },
      },
      {
        protocolSection: {
          identificationModule: { nctId: 'ABC01234567', briefTitle: 'Wrong registry prefix' },
        },
      },
    ],
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await searchTrials('   stem    cell   osteoarthritis   ', {
    recruitingOnly: true,
    country: '   Indonesia   ',
  })
  ok('hanya studi dengan NCT ID kanonik yang diterima', hasil.length === 1, String(hasil.length))
  ok('NCT ID dinormalisasi uppercase', hasil[0]?.nctId === 'NCT01234567', hasil[0]?.nctId)
  ok('status dipertahankan', hasil[0]?.status === 'RECRUITING')
  ok('kondisi diringkas deterministik', hasil[0]?.conditions === 'Osteoarthritis, Knee Pain')
  ok('fase dipertahankan', hasil[0]?.phase === 'PHASE2')
  ok('negara lokasi dideduplikasi', hasil[0]?.locations === 'Indonesia, Singapore')
  ok('tautan selalu kembali ke exact registry ID kanonik', hasil[0]?.url === 'https://clinicaltrials.gov/study/NCT01234567')
})

await denganFetchPalsu(async () => new Response(JSON.stringify({
  studies: [{ protocolSection: { identificationModule: { nctId: 'NCT1234', briefTitle: 'Too short' } } }],
}), { status: 200, headers: { 'content-type': 'application/json' } }), async () => {
  const hasil = await searchTrials('malformed nct')
  ok('malformed NCT identity fail-closed tanpa provenance URL', hasil.length === 0, JSON.stringify(hasil))
})

await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  ok('query panjang dibatasi 160 karakter', (url.searchParams.get('query.term') ?? '').length === 160)
  return new Response(JSON.stringify({ studies: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await searchTrials('x'.repeat(400))
  ok('respons kosong tetap menjadi array kosong', hasil.length === 0)
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  let pesan = ''
  try {
    await searchTrials('oncology')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('HTTP upstream failure tidak disamarkan sebagai hasil kosong', pesan === 'ctg_503', pesan)
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await searchTrials('   ')
  ok('query kosong selesai tanpa network request', hasil.length === 0)
})

console.log(`\nClinicalTrials adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
