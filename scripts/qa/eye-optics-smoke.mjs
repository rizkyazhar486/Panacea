import assert from 'node:assert/strict'
import { expect } from '@playwright/test'

// Reuse the authenticated mobile Body smoke browser and production build.
// This exercises the shipped UI, not a stand-alone component fixture.
export async function verifyEyeOptics(page) {
  let timer
  try {
    return await Promise.race([
      runEyeOptics(page),
      // Penjaga ini mencegah gantung selamanya, bukan menagih kecepatan.
      // Di runner yang terbebani, seluruh rangkaian yang SEHAT memakan sekitar
      // 120 detik: activate-neuro 15,8 dtk, activate-eye 16,1 dtk, tangkapan
      // layar 32,8 dtk, close-optics 11,3 dtk — semuanya lulus, lalu penjaga
      // 120 detik memutusnya tepat di garis akhir. Anggaran yang pas-pasan
      // begitu mengubah penjaga anti-gantung menjadi sumber merah yang tetap.
      // Dinaikkan supaya ia kembali hanya menangkap gantung yang sebenarnya.
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Eye optics smoke exceeded 300 seconds')), 300_000) }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function step(name, action) {
  const startedAt = Date.now()
  console.log(`eye-optics:start:${name}`)
  const result = await action()
  console.log(`eye-optics:done:${name}:${Date.now() - startedAt}ms`)
  return result
}

async function activateWithKeyboard(button) {
  await button.scrollIntoViewIfNeeded()
  await button.focus()
  await expect(button).toBeFocused()
  await button.press('Enter')
}

async function runEyeOptics(page) {
  const dismissReminder = page.getByRole('button', { name: 'Dismiss', exact: true })
  if (await dismissReminder.isVisible().catch(() => false)) {
    await step('dismiss-reminder', () => dismissReminder.click())
    await expect(dismissReminder).toHaveCount(0)
  }

  const specialty = page.getByRole('button', { name: 'Specialty labs', exact: true })
  await step('open-specialty', () => specialty.click())

  const neuro = page.getByRole('button', { name: 'Neuro & senses', exact: true })
  await step('wait-neuro', () => neuro.waitFor({ state: 'visible', timeout: 20_000 }))
  await step('activate-neuro', () => activateWithKeyboard(neuro))

  const eye = page.getByRole('button', { name: 'Eye & orbit', exact: true })
  await step('wait-eye', () => eye.waitFor({ state: 'visible', timeout: 20_000 }))
  await step('activate-eye', () => activateWithKeyboard(eye))

  const opener = page.getByRole('button', { name: 'Explore pupil & accommodation', exact: true })
  const svg = page.locator('svg[aria-label="Educational ocular optics schematic"]')
  await expect(opener).toHaveAttribute('aria-expanded', 'false')
  await expect(svg).toHaveCount(0)
  await step('open-optics', () => activateWithKeyboard(opener))
  await step('wait-optics-svg', () => expect(svg).toBeVisible())
  await expect(page.getByRole('button', { name: 'Close optics lesson', exact: true })).toHaveAttribute('aria-expanded', 'true')

  const pupil = page.getByRole('slider', { name: /Pupil aperture/ })
  const distance = page.getByRole('slider', { name: /Target distance/ })
  const lens = svg.locator('ellipse[cx="405"]')
  const gap = () => svg.locator('line[x1="365"]').evaluateAll((lines) =>
    Number(lines[1].getAttribute('y1')) - Number(lines[0].getAttribute('y2')),
  )

  await pupil.focus()
  await pupil.press('Home')
  await expect(pupil).toHaveValue('2')
  const smallGap = await gap()
  await pupil.press('End')
  await expect(pupil).toHaveValue('8')
  await expect.poll(gap).toBeGreaterThan(smallGap)
  const largeGap = await gap()

  await distance.focus()
  await distance.press('End')
  await expect(distance).toHaveValue('6')
  const farRx = Number(await lens.getAttribute('rx'))
  await distance.press('Home')
  await expect(distance).toHaveValue('0.25')
  await expect(svg).toContainText('4.00 D')
  await expect.poll(async () => Number(await lens.getAttribute('rx'))).toBeGreaterThan(farRx)
  const nearRx = Number(await lens.getAttribute('rx'))

  const phase = page.getByRole('button', { name: /03.*Accommodation/ })
  await step('activate-accommodation-phase', () => activateWithKeyboard(phase))
  await expect(phase).toHaveAttribute('aria-pressed', 'true')
  const lesson = svg.locator('xpath=ancestor::section[1]')
  await expect(lesson).toBeVisible()
  await expect(lesson).toContainText('Phase 3/7')
  await expect(lesson).toContainText('Schematic dimensions are illustrative, not measured')
  const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  assert.ok(width.document <= width.viewport + 2, `Eye lesson overflows: ${JSON.stringify(width)}`)
  await lesson.scrollIntoViewIfNeeded()

  // Tangkapan layar ini memakai page.screenshot({ clip }) dan BUKAN
  // lesson.screenshot(), dengan alasan yang terukur.
  //
  // lesson.screenshot() menunggu heuristik "element is stable" milik Playwright:
  // dua bingkai rAF berturut-turut dengan kotak yang sama. Di runner yang
  // terbebani, rAF turun ke 3-4 per detik — diukur dengan mencekik CPU 6x, dan
  // angkanya sama saja pada halaman yang tidak punya kanvas 3D sekalipun
  // (/latihan 4/detik, /body-explorer 3/detik). Dengan anggaran 20 detik,
  // heuristik itu kehabisan waktu meskipun elemennya sama sekali tidak bergerak.
  // Terukur juga: top 72, tinggi 1032, kanvas 534x861, tinggi dokumen 4209 —
  // semuanya satu nilai selama 40 cuplikan. Jadi yang gagal adalah cara
  // menunggunya, bukan halamannya.
  //
  // Menaikkan batas waktu hanya menunda gejalanya. Sebagai gantinya kestabilan
  // diperiksa SECARA EKSPLISIT di sini — dua pengukuran kotak yang harus sama —
  // lalu piksel yang sama persis diambil lewat clip. Ini bukan pelonggaran:
  // sebelumnya kestabilan hanya diandaikan oleh heuristik yang tertutup, kini
  // ia menjadi assertion yang bisa gagal dan bisa dibaca.
  //
  // Yang TIDAK berubah: ini tetap aplikasi produksi yang hidup, dengan CSS,
  // WebGL, tata letak dan interaksi aslinya. Tidak ada setContent, tidak ada
  // newPage, tidak ada markup pengganti.
  const kotakSatu = await lesson.boundingBox()
  assert.ok(kotakSatu, 'Eye lesson has no bounding box to capture')
  await page.waitForTimeout(400)
  const kotakDua = await lesson.boundingBox()
  assert.ok(kotakDua, 'Eye lesson lost its bounding box before capture')
  assert.deepEqual(
    { x: Math.round(kotakDua.x), y: Math.round(kotakDua.y), w: Math.round(kotakDua.width), h: Math.round(kotakDua.height) },
    { x: Math.round(kotakSatu.x), y: Math.round(kotakSatu.y), w: Math.round(kotakSatu.width), h: Math.round(kotakSatu.height) },
    `Eye lesson layout is still moving: ${JSON.stringify(kotakSatu)} -> ${JSON.stringify(kotakDua)}`,
  )
  await step('capture-eye-screenshot', () => page.screenshot({
    path: 'artifacts/body3d-mobile-eye-optics.png',
    clip: { x: kotakDua.x, y: kotakDua.y, width: kotakDua.width, height: kotakDua.height },
    animations: 'disabled',
    // scale 'css' dan bukan 'device'. Artefak ini dipakai untuk menilai
    // keterbacaan label pada 390 px, jadi 356x1032 piksel CSS justru yang
    // dilihat pemakai — memperbesarnya tiga kali tidak menambah satu pun
    // keputusan yang bisa diambil darinya, hanya menambah piksel. Terukur pada
    // CPU tercekik 6x: 17,8 detik / 263.712 byte pada 'device', turun menjadi
    // 11,0 detik / 64.556 byte pada 'css'.
    scale: 'css',
    // Kestabilan sudah ditagih di atas sebagai assertion, jadi batas waktu ini
    // tidak lagi menjaga apa pun selain penyandian PNG itu sendiri: potongan
    // 356x1032 pada deviceScaleFactor 3. Diukur di CPU yang dicekik 4x, 6x dan
    // 10x, penyandian itu memakan 16,6-17,8 detik. Anggaran 20 detik yang lama
    // hanya menyisakan dua detik, dan itulah yang menjadikannya gerbang yang
    // menyala merah terus-menerus tanpa ada yang rusak.
    timeout: 45_000,
  }))

  const close = page.getByRole('button', { name: 'Close optics lesson', exact: true })
  await step('close-optics', () => activateWithKeyboard(close))
  await expect(svg).toHaveCount(0)
  await step('reopen-optics', () => activateWithKeyboard(opener))
  await expect(distance).toHaveValue('6')
  await expect(pupil).toHaveValue('4')
  await step('final-close-optics', () => activateWithKeyboard(page.getByRole('button', { name: 'Close optics lesson', exact: true })))

  return { reachable: true, keyboardControls: true, closeAndReopen: true, smallGap, largeGap, farRx, nearRx, width }
}
