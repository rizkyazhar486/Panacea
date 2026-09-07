import { searchPubmed } from '../src/pubmed.ts'

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

let panggilan = 0
await denganFetchPalsu(async (input, init) => {
  panggilan++
  const url = new URL(String(input))
  ok(`request ${panggilan} mempunyai timeout signal`, init?.signal instanceof AbortSignal)

  if (url.pathname.endsWith('/esearch.fcgi')) {
    ok('query dinormalisasi sebelum esearch', url.searchParams.get('term') === 'heart failure SGLT2')
    ok('retmax dibatasi maksimum 20', url.searchParams.get('retmax') === '20')
    return new Response(JSON.stringify({
      esearchresult: { idlist: ['123', 'not-a-pmid', '456'] },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  ok('esummary hanya menerima PMID numerik yang lolos validasi', url.searchParams.get('id') === '123,456')
  return new Response(JSON.stringify({
    result: {
      uids: ['123', '456'],
      '123': {
        uid: '123',
        title: 'SGLT2 inhibition in heart failure',
        fulljournalname: 'Journal A',
        pubdate: '2026 Jan',
        authors: [{ name: 'Alpha A' }, { name: 'Beta B' }, { name: 'Gamma C' }, { name: 'Delta D' }],
      },
      '456': {
        uid: '456',
        title: 'Heart failure outcomes',
        source: 'Journal B',
        pubdate: '2025',
        authors: [{ name: 'Epsilon E' }],
      },
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await searchPubmed('   heart   failure   SGLT2   ', 999)
  ok('dua PMID valid menghasilkan dua artikel', hasil.length === 2)
  ok('judul dan PMID pertama dipertahankan', hasil[0]?.pmid === '123' && hasil[0]?.title === 'SGLT2 inhibition in heart failure')
  ok('lebih dari tiga penulis diringkas et al.', hasil[0]?.authors === 'Alpha A, Beta B, Gamma C, et al.')
  ok('tahun diekstrak deterministik', hasil[0]?.year === '2026')
  ok('tautan PubMed dibangun dari PMID', hasil[1]?.url === 'https://pubmed.ncbi.nlm.nih.gov/456/')
})

await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  ok('retmax nol dikunci minimum satu', url.searchParams.get('retmax') === '1')
  ok('query panjang dibatasi 240 karakter', (url.searchParams.get('term') ?? '').length === 240)
  return new Response(JSON.stringify({ esearchresult: { idlist: [] } }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await searchPubmed('x'.repeat(500), 0)
  ok('hasil esearch kosong tidak memanggil esummary', hasil.length === 0)
})

await denganFetchPalsu(async () => new Response(null, { status: 502 }), async () => {
  let pesan = ''
  try {
    await searchPubmed('hypertension')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('esearch HTTP failure tidak disamarkan sebagai hasil kosong', pesan === 'esearch_502', pesan)
})

await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  if (url.pathname.endsWith('/esearch.fcgi')) {
    return new Response(JSON.stringify({ esearchresult: { idlist: ['789'] } }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  return new Response(null, { status: 503 })
}, async () => {
  let pesan = ''
  try {
    await searchPubmed('atrial fibrillation')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('esummary HTTP failure tetap terlihat', pesan === 'esummary_503', pesan)
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await searchPubmed('   ')
  ok('query kosong selesai tanpa network request', hasil.length === 0)
})

console.log(`\nPubMed adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
