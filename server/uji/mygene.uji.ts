import { lookupGene } from '../src/mygene.ts'

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

let panggilan = 0
await denganFetchPalsu(async (input, init) => {
  panggilan++
  const url = new URL(String(input))
  ok(`request ${panggilan} mempunyai AbortSignal timeout`, init?.signal instanceof AbortSignal)

  if (panggilan === 1) {
    const q = url.searchParams.get('q') ?? ''
    ok('query user diperlakukan sebagai literal di setiap field', q === 'symbol:"BRCA1 OR TP53" OR alias:"BRCA1 OR TP53" OR name:"BRCA1 OR TP53"', q)
    ok('pencarian dibatasi ke manusia', url.searchParams.get('species') === 'human')
    ok('hanya satu kandidat diminta', url.searchParams.get('size') === '1')
    return new Response(JSON.stringify({ hits: [{ _id: '672', symbol: 'BRCA1' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  ok('ID kandidat tervalidasi dipakai pada endpoint gene', url.pathname.endsWith('/v3/gene/672'), url.pathname)
  ok('payload annotation dibatasi ke field yang dipakai UI', (url.searchParams.get('fields') ?? '').includes('genomic_pos'))
  const aliases = ['BRCC1', 'brcc1', '  RNF53  ', '', ...Array.from({ length: 30 }, (_, i) => `Alias ${i}`)]
  return new Response(JSON.stringify({
    symbol: 'BRCA1',
    name: 'BRCA1 DNA repair associated',
    summary: 'S'.repeat(1600),
    alias: aliases,
    type_of_gene: 'protein_coding',
    genomic_pos: { chr: '17', start: 0, end: 1000 },
    entrezgene: 672,
    ensembl: [{ gene: 'ENSG00000012048' }],
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await lookupGene('  BRCA1:\"OR\"(TP53)  ')
  ok('symbol dan nama dipertahankan', hasil?.symbol === 'BRCA1' && hasil.name === 'BRCA1 DNA repair associated')
  ok('summary panjang dibatasi', (hasil?.summary.length ?? 0) === 1401, String(hasil?.summary.length))
  ok('alias dideduplikasi case-insensitive dan dibatasi 24', hasil?.aliases.length === 24, String(hasil?.aliases.length))
  ok('alias dinormalisasi', hasil?.aliases.includes('RNF53') === true)
  ok('tipe gen diubah menjadi bentuk terbaca', hasil?.type === 'protein coding')
  ok('koordinat nol tetap dianggap valid', hasil?.location === '0–1,000', hasil?.location)
  ok('chromosome dipertahankan', hasil?.chromosome === 'Chromosome 17')
  ok('Entrez dan Ensembl dipertahankan', hasil?.entrezId === '672' && hasil.ensemblId === 'ENSG00000012048')
})

let panjangQuery = 0
await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  const q = url.searchParams.get('q') ?? ''
  panjangQuery = q.match(/^symbol:"([^"]*)"/)?.[1]?.length ?? 0
  return new Response(JSON.stringify({ hits: [] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}, async () => {
  const hasil = await lookupGene('x'.repeat(400))
  ok('query panjang dibatasi 160 karakter', panjangQuery === 160, String(panjangQuery))
  ok('tanpa kandidat menghasilkan null', hasil === null)
})

let malformedCalls = 0
await denganFetchPalsu(async () => {
  malformedCalls++
  return new Response(JSON.stringify({ hits: [{ _id: '../evil' }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}, async () => {
  const hasil = await lookupGene('TP53')
  ok('ID upstream malformed tidak diteruskan ke endpoint kedua', malformedCalls === 1, String(malformedCalls))
  ok('ID malformed menghasilkan null', hasil === null)
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  let pesan = ''
  try {
    await lookupGene('APOE')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('failure search tidak disamarkan sebagai hasil kosong', pesan === 'mygene_search_503', pesan)
})

let secondCall = 0
await denganFetchPalsu(async () => {
  secondCall++
  if (secondCall === 1) {
    return new Response(JSON.stringify({ hits: [{ _id: '7157' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(null, { status: 502 })
}, async () => {
  let pesan = ''
  try {
    await lookupGene('TP53')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('failure annotation tidak disamarkan', pesan === 'mygene_gene_502', pesan)
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await lookupGene('  < > : () [] {} \\ \"  ')
  ok('query kosong setelah sanitasi selesai tanpa network request', hasil === null)
})

console.log(`\nMyGene adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
