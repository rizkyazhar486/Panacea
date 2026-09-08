const whoClientIdAsli = process.env.WHO_ICD_CLIENT_ID
const whoClientSecretAsli = process.env.WHO_ICD_CLIENT_SECRET
process.env.WHO_ICD_CLIENT_ID = ''
process.env.WHO_ICD_CLIENT_SECRET = ''

const { cariDiagnosis, icd11Configured, icd11Release, normalisasiIcdEntityId } = await import('../src/icd11.ts')

if (whoClientIdAsli === undefined) delete process.env.WHO_ICD_CLIENT_ID
else process.env.WHO_ICD_CLIENT_ID = whoClientIdAsli
if (whoClientSecretAsli === undefined) delete process.env.WHO_ICD_CLIENT_SECRET
else process.env.WHO_ICD_CLIENT_SECRET = whoClientSecretAsli

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('fixture memaksa jalur WHO tidak terkonfigurasi', icd11Configured === false)
ok('release ICD-11 dipin ke 2026-01', icd11Release === '2026-01', icd11Release)
ok('entity id numerik murni diterima', normalisasiIcdEntityId(' 123456789 ') === '123456789')
ok('URL Foundation resmi diterima', normalisasiIcdEntityId('https://id.who.int/icd/entity/123456789') === '123456789')
ok('slash akhir URL resmi diterima', normalisasiIcdEntityId('https://id.who.int/icd/entity/123456789/') === '123456789')
ok('http ditolak agar provenance URL tidak diturunkan', normalisasiIcdEntityId('http://id.who.int/icd/entity/123456789') === null)
ok('host mirip WHO ditolak', normalisasiIcdEntityId('https://id.who.int.evil.example/icd/entity/123456789') === null)
ok('identifier campuran tidak disulap menjadi angka', normalisasiIcdEntityId('abc123456789def') === null)
ok('URL release MMS bukan Foundation entity id', normalisasiIcdEntityId('https://id.who.int/icd/release/11/2026-01/mms/123456789') === null)

const fetchAsli = globalThis.fetch
async function denganFetchPalsu(fn: typeof fetch, run: () => Promise<void>) {
  globalThis.fetch = fn
  try {
    await run()
  } finally {
    globalThis.fetch = fetchAsli
  }
}

await denganFetchPalsu(async (input, init) => {
  const url = new URL(String(input))
  const terms = url.searchParams.get('terms') ?? ''
  ok('fallback memakai endpoint NLM Clinical Tables HTTPS', url.origin === 'https://clinicaltables.nlm.nih.gov')
  ok('fallback memakai dataset ICD-10-CM v3', url.pathname === '/api/icd10cm/v3/search', url.pathname)
  ok('query dibatasi 160 karakter', terms.length === 160, String(terms.length))
  ok('operator query berisiko dibersihkan', !/[<>\\":|]/.test(terms), terms)
  ok('limit besar dibatasi 50', url.searchParams.get('maxList') === '50', url.searchParams.get('maxList') ?? '')
  ok('request fallback mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)

  return new Response(JSON.stringify([
    3,
    ['I10', 'E11.9', 'BAD'],
    null,
    [
      [' I10 ', ' Essential (primary) hypertension '],
      ['E11.9', 'Type 2 diabetes mellitus without complications'],
      [123, 'Malformed row'],
      ['MISSING-NAME'],
    ],
  ]), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await cariDiagnosis(`  hypertension:\"${'x'.repeat(220)}<>\\|  `, 999)
  ok('malformed Clinical Tables rows dibuang', hasil.length === 2, String(hasil.length))
  ok('kode dan judul dinormalisasi', hasil[0]?.code === 'I10' && hasil[0]?.title === 'Essential (primary) hypertension')
  ok('fallback selalu dilabeli icd10cm', hasil.every((item) => item.sumber === 'icd10cm'))
})

await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  ok('limit nol dinaikkan menjadi satu', url.searchParams.get('maxList') === '1', url.searchParams.get('maxList') ?? '')
  return new Response(JSON.stringify([0, [], null, []]), { status: 200 })
}, async () => {
  const hasil = await cariDiagnosis('I10', 0)
  ok('hasil kosong upstream tetap array kosong', hasil.length === 0)
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await cariDiagnosis('  <> : " \\ | \u0000  ')
  ok('query kosong setelah sanitasi selesai tanpa network request', hasil.length === 0)
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  let pesan = ''
  try {
    await cariDiagnosis('hypertension')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('NLM upstream error tidak disamarkan sebagai hasil kosong', pesan === 'clinicaltables_503', pesan)
})

console.log(`\nICD terminology adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
