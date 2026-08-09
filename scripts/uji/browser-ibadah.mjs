// Al-Qur'an dengan alih aksara dan bacaan, hadis, waktu salat, dan tradisi lain
// — dijalankan di peramban sungguhan dengan seluruh penyedia dipalsukan.
import { chromium } from 'playwright'
const BASE = 'http://localhost:4230'
let lulus = 0, gagal = 0
const chk = (n, c, x = '') => { c ? lulus++ : gagal++; console.log(c ? 'PASS' : 'FAIL', n, String(x).slice(0, 150)) }

const BASMALAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
const daftar = Array.from({ length: 114 }, (_, i) => ({
  number: i + 1, englishName: `Surah ${i + 1}`, name: 'الفاتحة',
  englishNameTranslation: 'The Opening',
  numberOfAyahs: i === 0 ? 6236 - 113 * 7 : 7, revelationType: 'Meccan',
}))
const surahEd = (n, j, teks) => ({
  code: 200,
  data: {
    number: n, englishName: `Surah ${n}`, name: 'الفاتحة', englishNameTranslation: 'The Opening',
    numberOfAyahs: j, revelationType: 'Meccan',
    ayahs: Array.from({ length: j }, (_, i) => ({ numberInSurah: i + 1, ...teks(i + 1) })),
  },
})

const b = await chromium.launch()

async function masuk(ctx, tag) {
  const p = await ctx.newPage()
  await p.goto(`${BASE}/#/login`, { waitUntil: 'networkidle' })
  await p.getByText('Sign Up Free Now').first().click(); await p.waitForTimeout(800)
  await p.locator('input[type="email"]').first().fill(tag + Date.now() + '@t.id')
  await p.getByPlaceholder('Your full name').fill(tag)
  await p.locator('input[type="checkbox"]').first().check()
  await p.getByText(/^Sign in as/).first().click(); await p.waitForTimeout(2600)
  for (let i = 0; i < 6; i++) {
    const g = p.getByText(/Get Started|Maybe later/i).first()
    if (await g.count()) { try { await g.click({ force: true }) } catch {} ; await p.waitForTimeout(350); continue }
    break
  }
  return p
}

// ── 1. Qur'an: alih aksara, tafsir Inggris, dan bacaan ──────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.route(/api\.alquran\.cloud/, (r) => {
    const u = r.request().url()
    if (/\/surah$/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: daftar }) })
    const m = u.match(/\/surah\/(\d+)\/([^/?]+)/)
    if (!m) return r.fulfill({ status: 404, body: '{}' })
    const n = Number(m[1]), ed = m[2], j = n === 1 ? 6236 - 113 * 7 : 7
    let body
    if (/uthmani/.test(ed)) body = surahEd(n, j, (i) => ({ text: `${BASMALAH} ${i}` }))
    else if (/transliteration/.test(ed)) body = surahEd(n, j, (i) => ({ text: `bismillaahi verse ${i}` }))
    else if (/alafasy|husary|minshawi/.test(ed)) body = surahEd(n, j, (i) => ({ text: `${BASMALAH} ${i}`, audio: `https://cdn.example/${n}-${i}.mp3` }))
    else if (/maududi|jalalayn/.test(ed)) body = surahEd(n, j, (i) => ({ text: `English commentary on verse ${i}` }))
    else if (/^ar\./.test(ed)) body = surahEd(n, j, (i) => ({ text: `تفسير ${i}` }))
    else body = surahEd(n, j, (i) => ({ text: `meaning of verse ${i}` }))
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  const p = await masuk(ctx, 'q1')
  await p.goto(`${BASE}/#/scripture`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  await p.getByText('Surah 2', { exact: false }).first().click(); await p.waitForTimeout(2000)

  let t = await p.locator('main').innerText()
  chk('alih aksara Latin tampil secara bawaan', /bismillaahi verse 1/.test(t), t.slice(0, 60).replace(/\n/g, ' | '))
  chk('alih aksara tiap ayat sesuai nomornya',
    [...t.matchAll(/bismillaahi verse (\d+)/g)].map((x) => Number(x[1])).every((v, i) => v === i + 1))
  chk('tafsir bawaan berbahasa Inggris', /English commentary/.test(t) || /Tafhim/.test(t), '')

  // Tafsir Inggris harus benar-benar terbuka isinya.
  const tombolTafsir = p.getByText('Commentary —', { exact: false }).first()
  if (await tombolTafsir.count()) { await tombolTafsir.click(); await p.waitForTimeout(500) }
  t = await p.locator('main').innerText()
  chk('isi tafsir Inggris terbaca', /English commentary on verse/.test(t),
    (t.match(/[^\n]*English commentary[^\n]*/) ?? [''])[0])

  // Nyalakan qari.
  await p.getByText('Mishary Rashid Alafasy').first().click(); await p.waitForTimeout(2200)
  t = await p.locator('main').innerText()
  chk('kendali putar seluruh surah muncul', /Play the whole surah/i.test(t))
  chk('tombol putar per ayat muncul', (await p.locator('button[aria-label^="Play ayah"]').count()) >= 7,
    String(await p.locator('button[aria-label^="Play ayah"]').count()))
  await ctx.close()
}

// ── 2. Alih aksara yang meleset harus dibuang, bukan dipasang sebagian ──────
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.route(/api\.alquran\.cloud/, (r) => {
    const u = r.request().url()
    if (/\/surah$/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: daftar }) })
    const m = u.match(/\/surah\/(\d+)\/([^/?]+)/)
    const n = Number(m[1]), ed = m[2], j = n === 1 ? 6236 - 113 * 7 : 7
    let body
    if (/uthmani/.test(ed)) body = surahEd(n, j, (i) => ({ text: `${BASMALAH} ${i}` }))
    else if (/transliteration/.test(ed)) {
      body = surahEd(n, j, (i) => ({ text: `bismillaahi verse ${i}` }))
      body.data.ayahs = body.data.ayahs.filter((a) => a.numberInSurah !== 3)   // satu hilang
    } else body = surahEd(n, j, (i) => ({ text: `meaning of verse ${i}` }))
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  const p = await masuk(ctx, 'q2')
  await p.goto(`${BASE}/#/scripture`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
  await p.getByText('Surah 2', { exact: false }).first().click(); await p.waitForTimeout(2000)
  const t = await p.locator('main').innerText()
  chk('alih aksara yang meleset dibuang seluruhnya', !/bismillaahi verse/.test(t))
  chk('ayat dan terjemahan tetap tampil', /meaning of verse 1/.test(t))
  chk('kehilangannya disebutkan, tidak didiamkan', /did not arrive/i.test(t),
    (t.match(/[^\n]*did not arrive[^\n]*/i) ?? ['(tidak disebut)'])[0])
  await ctx.close()
}

// ── 3. Hadis ────────────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.route(/hadith-api/, (r) => {
    const u = r.request().url()
    if (/sections\/\d+\.json/.test(u)) {
      const ara = /ara-/.test(u)
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        metadata: { last_hadithnumber: 7563 },
        hadiths: Array.from({ length: 4 }, (_, i) => ({
          hadithnumber: i + 1, text: ara ? `حديث رقم ${i + 1}` : `Narrated report number ${i + 1}` })),
      }) })
    }
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      metadata: { sections: { 0: '', 1: 'Revelation', 2: 'Belief' } }, hadiths: [] }) })
  })
  const jejak = []
  ctx.on('request', (q) => { if (/hadith-api/.test(q.url())) jejak.push(q.url().slice(-60)) })
  const p = await masuk(ctx, 'h1')
  await p.goto(`${BASE}/#/hadith`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1400)
  let t = await p.locator('main').innerText()
  chk('halaman hadis terbuka', /Hadith/.test(t))
  chk('Bukhari dan Muslim dipisahkan sebagai sahih', /Accepted as authentic in full/i.test(t))
  chk('empat Sunan ditandai bercampur derajat', /Mixed in grade/i.test(t))
  chk('peringatan derajat tampil', /differing grades/i.test(t))

  await p.locator('button', { hasText: 'Sahih al-Bukhari' }).first().click(); await p.waitForTimeout(1500)
  t = await p.locator('main').innerText()
  chk('daftar bab terbuka', /Revelation/.test(t),
    `permintaan=[${jejak.join(' , ')}] layar=${t.slice(0, 200).replace(/\n/g, ' | ')}`)
  await p.locator('button', { hasText: 'Revelation' }).first().click(); await p.waitForTimeout(1500)
  t = await p.locator('main').innerText()
  chk('teks hadis tampil', /Narrated report number 1/.test(t))
  chk('teks Arab hadis tampil', /حديث رقم/.test(t))
  chk('lencana sahih tampil pada riwayat', /Sahih collection/i.test(t))

  // Kitab bercampur derajat harus membawa peringatannya sampai ke layar teks.
  await p.goto(`${BASE}/#/hadith`, { waitUntil: 'networkidle' })
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1400)
  await p.locator('button', { hasText: 'Sunan Ibn Majah' }).first().click(); await p.waitForTimeout(1500)
  t = await p.locator('main').innerText()
  chk('kitab bercampur membawa peringatan di halamannya', /before you act on it/i.test(t))
  await ctx.close()
}

// ── 4. Waktu salat ──────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.route(/api\.aladhan\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ data: {
      timings: { Fajr: '04:28', Sunrise: '05:47', Dhuhr: '11:59', Asr: '15:20', Maghrib: '18:03', Isha: '19:14' },
      date: { readable: '09 Aug 2026' }, meta: { method: { name: 'Kemenag RI' } },
    } }) }))
  const p = await masuk(ctx, 'a1')
  await p.goto(`${BASE}/#/prayer-times`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1600)
  const t = await p.locator('main').innerText()
  chk('waktu salat tampil', /04:28/.test(t) && /19:14/.test(t), t.slice(0, 70).replace(/\n/g, ' | '))
  chk('kelima salat tampil', ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].every((x) => t.includes(x)))
  chk('terbit matahari TIDAK ikut ditampilkan sebagai salat', !/05:47/.test(t))
  chk('metode hisab disebutkan di layar', /Kemenag RI/.test(t))
  chk('salat berikutnya ditunjukkan', /next/i.test(t))
  chk('batasnya dinyatakan terus terang', /not a replacement/i.test(t))
  chk('pengingat mati secara bawaan', /\bOff\b/.test(t))
  await p.getByRole('button', { name: 'Off', exact: true }).first().click(); await p.waitForTimeout(700)
  const t2 = await p.locator('main').innerText()
  chk('menyalakan pengingat membuka pilihannya', /Lead time/i.test(t2))
  chk('alasan tidak menyertakan rekaman adzan dijelaskan', /unclear rights/i.test(t2))
  await ctx.close()
}

// ── 5. Tradisi lain kini benar-benar bisa dibaca ────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.route(/suttacentral\.net\/api/, (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ root_text: { lang: 'pli', text: 'Manopubbangama dhamma' },
                           translation: { author: 'Sujato', text: 'Mind precedes all things.' } }) }))
  await ctx.route(/api\.ctext\.org/, (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ title: 'Xue Er', fulltext: ['學而時習之', 'Is it not pleasant to learn?'] }) }))
  const p = await masuk(ctx, 'l1')
  await p.goto(`${BASE}/#/scripture`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  await p.getByText('Other traditions').first().click(); await p.waitForTimeout(900)
  let t = await p.locator('main').innerText()
  chk('Weda menyatakan terus terang tidak punya pembaca', /No direct reader here/i.test(t))
  chk('kanon Pali punya pembaca', /SuttaCentral/.test(t))

  await p.getByText('Mindfulness of breathing (MN 118)').first().click(); await p.waitForTimeout(1600)
  t = await p.locator('main').innerText()
  chk('teks Pali terbaca', /Manopubbangama/.test(t), (t.match(/[^\n]*Manopubbangama[^\n]*/) ?? [''])[0])
  chk('terjemahannya ikut, dengan penerjemah disebut',
    /Mind precedes all things/i.test(t) && /sujato/i.test(t),
    (t.match(/[^\n]*sujato[^\n]*/i) ?? ['(penerjemah tidak disebut)'])[0])

  await p.getByText('Analects — Book 1').first().click(); await p.waitForTimeout(1600)
  t = await p.locator('main').innerText()
  chk('teks Konfusius terbaca', /學而時習之/.test(t))
  await ctx.close()
}

await b.close()
console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)
