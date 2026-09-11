import { cariZatAktif, daftarSemuaZatAktif, profilFarmakologi } from '../src/rxclass'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Pharmacology profile: preserve relation source + relation-source version,
// bound input, reject malformed concepts/RXCUIs and survive one source failing
// without fabricating a result.
{
  const urls: string[] = []
  const longName = `aspirin ${'x'.repeat(500)}`
  const fakeFetch: typeof fetch = async (input) => {
    const url = new URL(String(input))
    urls.push(url.toString())

    if (url.pathname.endsWith('/rxclass/version/MEDRT.json')) {
      return jsonResponse({ relaSourceVersion: ' 2026.08.31 ' })
    }
    if (url.pathname.endsWith('/rxclass/version/ATC.json')) {
      return jsonResponse({ relaSourceVersion: '2026_03_01' })
    }

    if (url.pathname.endsWith('/rxclass/class/byDrugName.json')) {
      const source = url.searchParams.get('relaSource') ?? ''
      const rela = url.searchParams.get('relas') ?? ''
      if (source === 'ATC') return jsonResponse({ error: 'temporary' }, 503)
      if (source === 'MEDRT' && rela === 'has_MoA') {
        return jsonResponse({
          rxclassDrugInfoList: {
            rxclassDrugInfo: [
              {
                rxclassMinConceptItem: { classId: 'N0001', className: ' Cyclooxygenase Inhibitors ', classType: 'MOA' },
                rela: 'has_MoA',
                relaSource: 'MEDRT',
              },
              {
                rxclassMinConceptItem: { classId: 'N0001', className: 'duplicate', classType: 'MOA' },
                rela: 'has_MoA',
                relaSource: 'MEDRT',
              },
              { rxclassMinConceptItem: { classId: '', className: 'invalid' } },
            ],
          },
        })
      }
      if (source === 'DAILYMED') {
        return jsonResponse({
          rxclassDrugInfoList: {
            rxclassDrugInfo: [{
              rxclassMinConceptItem: { classId: 'EPC1', className: 'Platelet Aggregation Inhibitor', classType: 'EPC' },
              rela: 'has_EPC',
              relaSource: 'DAILYMED',
            }],
          },
        })
      }
      if (source === 'MEDRT' && rela === 'may_treat') {
        return jsonResponse({
          rxclassDrugInfoList: {
            rxclassDrugInfo: [{
              rxclassMinConceptItem: { classId: 'D0001', className: 'Reference disease relation', classType: 'DISEASE' },
              rela: 'may_treat',
              relaSource: 'MEDRT',
            }],
          },
        })
      }
      return jsonResponse({ rxclassDrugInfoList: { rxclassDrugInfo: [] } })
    }

    if (url.pathname.endsWith('/rxcui.json')) {
      return jsonResponse({ idGroup: { rxnormId: ['not-numeric', '1191'] } })
    }
    return new Response('not found', { status: 404 })
  }

  const profile = await profilFarmakologi(longName, fakeFetch)
  ok('profil parsial tetap tersedia ketika satu relation source gagal', profile !== null)
  ok('nama obat dinormalisasi dan dibatasi', (profile?.nama.length ?? 999) <= 160, profile?.nama)
  ok('RXCUI nonnumerik dibuang dan RXCUI numerik dipertahankan', profile?.rxcui === '1191', profile?.rxcui)
  ok('MED-RT mechanism source dipertahankan', profile?.mekanisme[0]?.sumber === 'MEDRT', profile?.mekanisme[0]?.sumber)
  ok('DailyMed EPC source dipertahankan', profile?.kelasFarmakologi[0]?.sumber === 'DAILYMED', profile?.kelasFarmakologi[0]?.sumber)
  ok('duplicate class id dari source yang sama dibuang', profile?.mekanisme.length === 1, String(profile?.mekanisme.length))
  ok('ATC failure tidak dipalsukan menjadi class', profile?.atc.length === 0, String(profile?.atc.length))
  ok('may_treat tetap berlabel relation source aslinya',
    profile?.indikasi[0]?.relasi === 'may_treat' && profile?.indikasi[0]?.sumber === 'MEDRT',
    JSON.stringify(profile?.indikasi[0]))

  ok('versi MED-RT dipertahankan sebagai provenance profil',
    profile?.versiSumber.MEDRT === '2026.08.31', JSON.stringify(profile?.versiSumber))
  ok('versi ATC dipertahankan sebagai provenance profil',
    profile?.versiSumber.ATC === '2026_03_01', JSON.stringify(profile?.versiSumber))

  const classUrls = urls.map((raw) => new URL(raw)).filter((url) => url.pathname.includes('/rxclass/class/byDrugName.json'))
  ok('profil meminta tepat lima relation slices', classUrls.length === 5, String(classUrls.length))
  ok('drugName dibatasi sebelum semua request RxClass',
    classUrls.every((url) => (url.searchParams.get('drugName') ?? '').length <= 160),
    classUrls.map((url) => (url.searchParams.get('drugName') ?? '').length).join(','))

  const versionUrls = urls.map((raw) => new URL(raw)).filter((url) => url.pathname.includes('/rxclass/version/'))
  ok('hanya source yang punya version identifier yang diminta',
    versionUrls.length === 2
      && versionUrls.some((url) => url.pathname.endsWith('/MEDRT.json'))
      && versionUrls.some((url) => url.pathname.endsWith('/ATC.json')),
    versionUrls.map((url) => url.pathname).join(','))
  ok('DailyMed tidak diberi version endpoint palsu',
    !versionUrls.some((url) => url.pathname.includes('DAILYMED')),
    versionUrls.map((url) => url.pathname).join(','))
}

// Version lookup failure must not erase otherwise valid relations. Reproducible
// metadata is best-effort because upstream can temporarily fail; absence stays
// explicit rather than being replaced with a guessed version.
{
  const fakeFetch: typeof fetch = async (input) => {
    const url = new URL(String(input))
    if (url.pathname.includes('/rxclass/version/')) return jsonResponse({ error: 'down' }, 503)
    if (url.pathname.endsWith('/rxclass/class/byDrugName.json')) {
      const source = url.searchParams.get('relaSource') ?? ''
      if (source === 'MEDRT' && url.searchParams.get('relas') === 'has_MoA') {
        return jsonResponse({
          rxclassDrugInfoList: {
            rxclassDrugInfo: [{
              rxclassMinConceptItem: { classId: 'N0002', className: 'Reference mechanism', classType: 'MOA' },
              rela: 'has_MoA',
              relaSource: 'MEDRT',
            }],
          },
        })
      }
      return jsonResponse({ rxclassDrugInfoList: { rxclassDrugInfo: [] } })
    }
    if (url.pathname.endsWith('/rxcui.json')) return jsonResponse({ idGroup: { rxnormId: ['1191'] } })
    return new Response('not found', { status: 404 })
  }

  const profile = await profilFarmakologi('aspirin', fakeFetch)
  ok('relation tetap tersedia saat endpoint versi gagal', profile?.mekanisme.length === 1)
  ok('versi upstream yang gagal tetap kosong, tidak ditebak',
    Object.keys(profile?.versiSumber ?? {}).length === 0, JSON.stringify(profile?.versiSumber))
}

// Ingredient list: accept only real-looking RXCUI identity, normalize whitespace,
// deduplicate case-insensitively, and keep search output bounded.
{
  const concepts = [
    { rxcui: '1', name: ' Aspirin ' },
    { rxcui: '2', name: 'aspirin' },
    { rxcui: '3', name: 'Metoprolol   tartrate' },
    { rxcui: 'bad', name: 'Invalid id' },
    { rxcui: '4', name: '' },
    ...Array.from({ length: 120 }, (_, i) => ({ rxcui: String(1000 + i), name: `Test ingredient ${i}` })),
  ]
  let calls = 0
  const fakeFetch: typeof fetch = async (input) => {
    calls++
    const url = String(input)
    if (!url.includes('/allconcepts.json?tty=IN+PIN')) return new Response('not found', { status: 404 })
    return jsonResponse({ minConceptGroup: { minConcept: concepts } })
  }

  const all = await daftarSemuaZatAktif(fakeFetch)
  ok('ingredient duplicate case-insensitive dibuang', all.filter((x) => x.nama.toLowerCase() === 'aspirin').length === 1)
  ok('ingredient RXCUI nonnumerik dibuang', !all.some((x) => x.rxcui === 'bad'))
  ok('whitespace nama ingredient dinormalisasi', all.some((x) => x.nama === 'Metoprolol tartrate'))

  const search = await cariZatAktif(' test   ingredient ', 500, fakeFetch)
  ok('search limit dipagari maksimum 100', search.length === 100, String(search.length))
  ok('search memakai normalized query literal', search.every((x) => x.nama.toLowerCase().includes('test ingredient')))
  ok('injected test fetch tidak memakai cache runtime global', calls === 2, String(calls))
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
