import { lookupDrugLabel } from '../src/drugInfo.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const fetchAsli = globalThis.fetch
async function denganFetchPalsu(fn: typeof fetch, run: () => Promise<void>) {
  globalThis.fetch = fn
  try {
    await run()
  } finally {
    globalThis.fetch = fetchAsli
  }
}

const DIRECT_SPL_SET_ID = '11111111-2222-4333-8444-555555555555'
const NORMALIZED_SPL_SET_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  ok('direct lookup memakai canonical openFDA endpoint', url.origin === 'https://api.fda.gov')
  return new Response(JSON.stringify({
    results: [{
      set_id: DIRECT_SPL_SET_ID,
      openfda: { brand_name: ['Direct Brand'], generic_name: ['direct generic'] },
      purpose: ['Purpose one. Purpose two. Purpose three.'],
      mechanism_of_action: ['Mechanism one. Mechanism two.'],
      adverse_reactions: ['Adverse one.'],
      warnings: ['Warning one.'],
      dosage_and_administration: ['Dose one.'],
      indications_and_usage: ['Indication one.'],
    }],
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await lookupDrugLabel('Direct Brand')
  ok('direct label dipetakan ke contract lama', hasil?.brandName === 'Direct Brand' && hasil.genericName === 'direct generic')
  ok('mechanism canonical diteruskan', hasil?.mechanismOfAction === 'Mechanism one. Mechanism two.')
  ok('purpose tetap dibatasi dua kalimat', hasil?.purpose === 'Purpose one. Purpose two.', hasil?.purpose)
  ok('SPL source identity diteruskan', hasil?.labelId === DIRECT_SPL_SET_ID, hasil?.labelId)
  ok('source URL exact set_id diteruskan', new URL(hasil?.sourceUrl ?? 'https://invalid.test').searchParams.get('search') === `set_id:"${DIRECT_SPL_SET_ID}"`)
})

let fallbackCall = 0
await denganFetchPalsu(async (input) => {
  fallbackCall++
  const url = new URL(String(input))

  if (fallbackCall <= 2) {
    ok(`direct openFDA miss ${fallbackCall} tetap melalui canonical adapter`, url.origin === 'https://api.fda.gov')
    return new Response(null, { status: 404 })
  }
  if (fallbackCall === 3) {
    ok('fallback memakai RxNorm approximateTerm', url.pathname.endsWith('/REST/approximateTerm.json'), url.pathname)
    return new Response(JSON.stringify({ approximateGroup: { candidate: [{ rxcui: '860975' }] } }), { status: 200 })
  }
  if (fallbackCall === 4) {
    ok('fallback mengambil canonical RxNorm Name', url.pathname.endsWith('/REST/rxcui/860975/property.json'), url.pathname)
    return new Response(JSON.stringify({ propConceptGroup: { propConcept: [{ propValue: 'metformin hydrochloride' }] } }), { status: 200 })
  }
  if (fallbackCall === 5) {
    ok('canonical name dicoba ulang sebagai brand', url.searchParams.get('search') === 'openfda.brand_name:"metformin hydrochloride"')
    return new Response(null, { status: 404 })
  }

  ok('canonical name lalu dicoba sebagai generic', url.searchParams.get('search') === 'openfda.generic_name:"metformin hydrochloride"')
  return new Response(JSON.stringify({
    results: [{
      set_id: NORMALIZED_SPL_SET_ID,
      openfda: { brand_name: ['Glucophage'], generic_name: ['metformin hydrochloride'] },
      mechanism_of_action: ['Normalized mechanism.'],
      indications_and_usage: ['Normalized indication.'],
    }],
  }), { status: 200 })
}, async () => {
  const hasil = await lookupDrugLabel('Glucophge')
  ok('typo fallback berhasil melalui RxNorm lalu openFDA', hasil?.genericName === 'metformin hydrochloride')
  ok('fallback mempertahankan mechanism label resmi', hasil?.mechanismOfAction === 'Normalized mechanism.')
  ok('fallback mempertahankan source identity label akhir', hasil?.labelId === NORMALIZED_SPL_SET_ID)
  ok('orchestration fallback memakai enam request yang terukur', fallbackCall === 6, String(fallbackCall))
})

let normalizationFailureCalls = 0
await denganFetchPalsu(async (input) => {
  normalizationFailureCalls++
  const url = new URL(String(input))
  if (url.origin === 'https://api.fda.gov') return new Response(null, { status: 404 })
  return new Response(null, { status: 503 })
}, async () => {
  const hasil = await lookupDrugLabel('unknown local brand')
  ok('kegagalan normalization fallback tetap menghasilkan null seperti contract lama', hasil === null)
  ok('tidak ada retry openFDA setelah normalization gagal', normalizationFailureCalls === 3, String(normalizationFailureCalls))
})

console.log(`\nDrug label orchestration: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
