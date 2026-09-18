// Membuka satu aktivitas Body Exposure melalui progressive disclosure yang sama
// dengan pengguna. Gerbang render 3D tidak boleh bergantung pada semua tombol
// selalu terlihat sekaligus, tetapi tetap membuktikan aktivitas itu terjangkau.
export async function pilihAktivitasBodyExposure(page, label) {
  const navigator = page.locator('section[aria-label="Body Exposure activities"]')
  await navigator.waitFor({ state: 'visible' })

  const langsung = navigator.getByRole('button', { name: label, exact: true }).first()
  if (await langsung.isVisible().catch(() => false)) {
    await langsung.click()
    return
  }

  const semua = navigator.getByRole('button', { name: 'All activities', exact: true })
  if (!(await semua.isVisible().catch(() => false))) {
    throw new Error(`Body Exposure: pintu "All activities" tidak terlihat saat mencari "${label}"`)
  }
  await semua.click()

  const pencarian = navigator.getByPlaceholder('Find anatomy, physiology, disease, surgery…')
  await pencarian.fill(label)
  const target = navigator.getByRole('button', { name: label, exact: true }).first()
  await target.waitFor({ state: 'visible' })
  await target.click()
}
