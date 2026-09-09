import { pathologyImageLookup, searchAnatomyImages, xrayImageLookup } from '../src/anatomyImages.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

{
  const fakeFetch: typeof fetch = async (input, init) => {
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
  }

  const hasil = await searchAnatomyImages(`  heart:\"${'x'.repeat(220)}<>\\|  `, 99, fakeFetch)
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
}

{
  let calls = 0
  const fakeFetch: typeof fetch = async () => {
    calls++
    throw new Error('fetch tidak boleh dipanggil untuk query kosong')
  }
  const hasil = await searchAnatomyImages('  <> : " \\ | \u0000  ', 8, fakeFetch)
  ok('query kosong setelah sanitasi selesai tanpa network request', hasil.length === 0 && calls === 0, String(calls))
}

{
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({
    query: {
      pages: [{
        title: 'File:Pathology department building.jpg',
        imageinfo: [{
          url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Pathology_department_building.jpg',
          descriptionurl: 'https://commons.wikimedia.org/wiki/File:Pathology_department_building.jpg',
          mime: 'image/jpeg',
          extmetadata: {
            LicenseShortName: { value: 'CC BY-SA 4.0' },
            Artist: { value: 'Example author' },
            ImageDescription: { value: 'University pathology department building.' },
          },
        }],
      }],
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } })

  const pathology = await pathologyImageLookup('heart', fakeFetch)
  ok('pathology lookup fail-closed saat semua hasil tidak relevan', pathology.length === 0, String(pathology.length))

  const xray = await xrayImageLookup('heart', fakeFetch)
  ok('radiology lookup fail-closed saat semua hasil tidak relevan', xray.length === 0, String(xray.length))
}

{
  const fakeFetch: typeof fetch = async () => new Response(null, { status: 503 })
  let pesan = ''
  try {
    await searchAnatomyImages('heart anatomy', 8, fakeFetch)
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('HTTP upstream failure tidak disamarkan sebagai hasil kosong', pesan === 'Commons search failed: 503', pesan)
}

console.log(`\nWikimedia Commons image adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
