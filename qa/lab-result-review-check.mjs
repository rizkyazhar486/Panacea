// Pemeriksaan peramban antrean tinjauan hasil lab terhadap SERVER NYATA (bukan mock).
// Jalankan: backend (OWNER_EMAIL=owner-qa@example.com ALLOW_DEV_LOGIN=true PANACEA_DATA_FILE=<tmp> npx tsx src/index.ts, PORT=18788)
//   + VITE_API_URL=http://127.0.0.1:18788 npx vite --port 5188, lalu
//   PLAYWRIGHT_MODULE=<path> CHROME=<path chrome> node qa/lab-result-review-check.mjs
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const API = process.env.QA_API || 'http://127.0.0.1:18788'
const URL_ = process.env.QA_URL || 'http://localhost:5188/qa/lab-result-review.html'
const post = async (p, token, body) => { const r = await fetch(API + p, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) }); return { status: r.status, json: await r.json().catch(() => null) } }
const owner = (await post('/api/auth/dev-login', null, { email: 'owner-qa@example.com', role: 'owner', name: 'Owner QA' })).json
assert.ok(owner?.token, 'login owner dev gagal')
const seedFor = async (pid) => { const r = await post('/api/lab-results', owner.token, { patientId: pid, item: { name: 'Hemoglobin', value: 13.2, unit: 'g/dL', referenceRange: '12-16', collectedAt: '2026-10-09' }, source: 'lab-intake' }); assert.equal(r.status, 201, 'seed hasil lab: ' + JSON.stringify(r)) }
const session = (role, isOwner) => JSON.stringify({ loginAt: Date.now(), account: { email: 'owner-qa@example.com', name: 'QA', role, isOwner, isSubscriber: false, loggedAt: new Date().toISOString() } })
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, headless: true, args: ['--no-sandbox'] })
const out = []
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    // bukan klinisi: ditolak, tanpa daftar
    const guest = await browser.newPage({ viewport: { width, height } })
    await guest.addInitScript(([s, t]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t) }, [session('pasien', false), owner.token])
    await guest.goto(URL_, { timeout: 120000 })
    await guest.getByText('This queue is reserved for clinicians.').waitFor({ timeout: 60000 })
    assert.equal(await guest.getByText('Hemoglobin').count(), 0, 'non-klinisi tidak boleh melihat hasil')
    await guest.close()

    const pid = `p-qa-${width}`
    await seedFor(pid)
    const page = await browser.newPage({ viewport: { width, height } }); const errors = []; const adv = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('request', (r) => { if (r.url().includes('/advance')) adv.push(r.postData()) })
    await page.addInitScript(([s, t]) => { localStorage.setItem('panaceamed.session.v1', s); localStorage.setItem('pmd-token', t) }, [session('dokter', true), owner.token])
    await page.goto(URL_, { timeout: 120000 })
    const row = page.locator('li', { hasText: pid })
    await row.getByText('Hemoglobin').waitFor({ timeout: 60000 })
    const m = await page.evaluate((PID) => {
      const btn = [...document.querySelectorAll('li')].find((l) => l.textContent.includes(PID))?.querySelector('button')
      const small = [...document.querySelectorAll('main *, section *')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() && parseFloat(getComputedStyle(e).fontSize) < 10.5).length
      return { overflow: document.documentElement.scrollWidth > innerWidth, btnH: btn ? Math.round(btn.getBoundingClientRect().height) : null, textUnder105px: small }
    }, pid)
    assert.equal(m.overflow, false, `overflow horizontal pada ${width}px`)
    assert.ok(m.btnH >= 44, `tombol aksi < 44px: ${m.btnH}`)
    // dobel ketuk cepat: hanya satu permintaan advance
    const btn = row.getByRole('button', { name: 'Mark awaiting review' })
    await btn.dblclick()
    await page.waitForTimeout(1500)
    assert.equal(adv.length, 1, `dobel ketuk mengirim ${adv.length} permintaan`)
    // owner/admin tidak boleh menandai ditinjau: server menolak, UI menampilkan penolakan, status tidak berubah
    await row.getByRole('button', { name: 'Mark reviewed' }).waitFor({ timeout: 15000 })
    await row.getByRole('button', { name: 'Mark reviewed' }).click()
    await page.getByRole('alert').filter({ hasText: /not allowed|authorized clinician/ }).waitFor({ timeout: 15000 })
    assert.equal(await row.getByText('Awaiting review').count(), 1, 'status harus tetap Awaiting review setelah penolakan server')
    await page.screenshot({ path: `${process.env.OUT || '/tmp'}/lab-review-${width}.png`, fullPage: true })
    assert.deepEqual(errors, [], 'galat halaman')
    out.push({ width, ...m, advanceRequests: adv.length })
    await page.close()
  }
  console.log('lab-result-review-check OK', JSON.stringify(out))
} finally { await browser.close() }
