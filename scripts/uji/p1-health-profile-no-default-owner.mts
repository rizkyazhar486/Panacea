import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

/** Memverifikasi batas P0/P1 pada HealthProfile, DigitalTwinScanFlow, dan UnifiedBodyWorkspace. */
export function verifyP1SurfaceContracts(inputs: {
  healthProfile: string
  digitalTwin: string
  unifiedBody: string
  quickSync: string
}) {
  assert.match(inputs.healthProfile, /simpanTeks\(/, 'HealthProfile harus mempertahankan jalur unduh simpanTeks')
  assert.match(inputs.healthProfile, /function download\(/, 'HealthProfile harus memakai satu fungsi download eksplisit')
  assert.doesNotMatch(
    inputs.healthProfile,
    /rizkyazhar486|dr\. Rizky|PMD-000486/,
    'HealthProfile tidak boleh memuat identitas/MRN pemilik hardcoded saat ekspor',
  )
  assert.doesNotMatch(
    inputs.quickSync,
    /rizkyazhar486|dr\. Rizky|PMD-000486/,
    'DeviceQuickSyncCard tidak boleh memakai fallback identitas pemilik hardcoded',
  )
  assert.doesNotMatch(
    inputs.digitalTwin,
    /Number\(e\.target\.value\)\s*\|\|/,
    'DigitalTwinScanFlow tidak boleh mengubah kolom kosong menjadi angka paksa',
  )

  const mainCardIdx = inputs.healthProfile.indexOf('title="My Health Data"')
  const quickSyncJsxIdx = inputs.healthProfile.indexOf('<DeviceQuickSyncCard')
  assert.ok(mainCardIdx > 0 && quickSyncJsxIdx > mainCardIdx, 'DeviceQuickSyncCard tidak boleh dipasang di atas form HealthProfile utama')
  assert.match(inputs.healthProfile, /quickSyncOpen\s*\?/, 'DeviceQuickSyncCard harus lazy/tertutup secara default')

  assert.match(
    inputs.unifiedBody,
    /className="dark rounded-2xl border border-cyan-400\/20 bg-\[#05070b\]/,
    'Panel Digital Twin gelap harus menandai dirinya dengan kelas dark',
  )
  assert.match(inputs.unifiedBody, /twinPanelOpen\s*&&/, 'DigitalTwinScanFlow tidak boleh langsung dimuat saat tertutup')
}

const root = new URL('../../', import.meta.url)
verifyP1SurfaceContracts({
  healthProfile: readFileSync(new URL('src/pages/bodyhub/HealthProfile.tsx', root), 'utf8'),
  digitalTwin: readFileSync(new URL('src/components/scan/DigitalTwinScanFlow.tsx', root), 'utf8'),
  unifiedBody: readFileSync(new URL('src/pages/UnifiedBodyWorkspace.tsx', root), 'utf8'),
  quickSync: readFileSync(new URL('src/components/sync/DeviceQuickSyncCard.tsx', root), 'utf8'),
})
console.log('p1-health-profile-no-default-owner: kontrak P0/P1 terverifikasi')
