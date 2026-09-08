import { searchAnatomyImages } from '../src/anatomyImages.ts'

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
  const query = url.searchParams.get('gsrsearch') ?? ''
  const headers = new Headers(init?.headers)

  ok('request memakai endpoint Commons HTTPS', url.origin === 'https://commons.wikimedia.org')
  ok('query dibatasi 160 karakter', query.length === 160, String(query.length))
  ok('operator query berisiko dibersihkan', !/[<>\\":|]/.test(query), query)
  ok('limit upstream dibatasi 20', url.searchParams.get('gsrlimit') === '20')
  ok('namespace dibatasi ke File', url.searchParams.get('gsrnamespace') === '6')
  ok('request membawa User-Agent deskriptif', (headers.get('User-Agent') ?? '').includes('panaceamed.id'))
  ok('request mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)

  return new Response(JSON.stringify({
    query: {
      pages: [
        {
          title: 'File:Heart vessels.jpg',
          imageinfo: [{
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Heart.jpg/1024px-Heart.jpg',
            descriptionurl: 'https://evil.example/not-commons',
            mime: 'image/jpeg',
            extmetadata: {
              LicenseShortName: { value: 'CC BY-SA 4.0' },
              LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
              Artist: { value: '<b>Dr. Jane &amp; Doe</b>' },
              ImageDescription: { value: '<p>Human heart &amp; great vessels.</p>' },
            },
          }],
        },
        {
          title: 'File:Kidney.png',
          imageinfo: [{
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Kidney.png',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Kidney.png',
            mime: 'image/png',
            extmetadata: {
              LicenseShortName: { value: 'Public domain' },
              Artist: { value: '' },
            },
          }],
        },
        {
          title: 'File:Unsupported.pdf',
          imageinfo: [{
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Unsupported.pdf',
            mime: 'application/pdf',
            extmetadata: { LicenseShortName: { value: 'CC BY 4.0' } },
          }],
        },
        {
          title: 'File:No license.jpg',
          imageinfo: [{
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/No-license.jpg',
            mime: 'image/jpeg',
            extmetadata: {},
          }],
        },
        {
          title: 'File:Foreign host.jpg',
          imageinfo: [{
            url: 'https://images.example.org/foreign.jpg',
            mime: 'image/jpeg',
            extmetadata: { LicenseShortName: { value: 'CC BY 4.0' } },
          }],
        },
      ],
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await searchAnatomyImages(`  heart:\"${'x'.repeat(220)}<>\\|  `, 99)
  ok('hanya media dengan provenance yang cukup dipertahankan', hasil.length === 2, String(hasil.length))

  const heart = hasil.find((item) => item.title === 'Heart vessels.jpg')
  ok('HTML artist dibersihkan tanpa kehilangan nama', heart?.artist === 'Dr. Jane & Doe', heart?.artist)
  ok('HTML description dibersihkan', heart?.description === 'Human heart & great vessels.', heart?.description)
  ok('lisensi per-file dipertahankan', heart?.license === 'CC BY-SA 4.0', heart?.license)
  ok('license URL HTTP(S) dipertahankan', heart?.licenseUrl === 'https://creativecommons.org/licenses/by-sa/4.0/')
  ok(
    'description URL non-Commons diganti canonical source page',
    Boolean(heart?.sourcePage.startsWith('https://commons.wikimedia.org/wiki/')) && !heart?.sourcePage.includes('evil.example'),
    heart?.sourcePage,
  )

  const kidney = hasil.find((item) => item.title === 'Kidney.png')
  ok('source page Commons yang valid dipertahankan', kidney?.sourcePage === 'https://commons.wikimedia.org/wiki/File:Kidney.png')
  ok('artist kosong tidak dipalsukan', kidney?.artist === 'Lihat halaman sumber', kidney?.artist)
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await searchAnatomyImages('  <> : " \\ | \u0000  ')
  ok('query kosong setelah sanitasi selesai tanpa network request', hasil.length === 0)
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  let pesan = ''
  try {
    await searchAnatomyImages('heart anatomy')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('HTTP upstream failure tidak disamarkan sebagai hasil kosong', pesan === 'Commons search failed: 503', pesan)
})

console.log(`\nWikimedia Commons image adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
