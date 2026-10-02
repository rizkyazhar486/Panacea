import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { lepasRenderer } from '../../src/lib/rendererAman.ts'

// Cacat nyata: renderer.dispose() hanya membebaskan sumber daya di DALAM konteks; konteks WebGL-nya
// baru lepas saat kanvas di-GC. Tiap mount/unmount viewer meninggalkan konteks zombi, dan browser
// (batas ±16, lebih rendah di iOS) mulai membuang konteks TERTUA — sering viewer utama yang masih dipakai.
// Setiap berkas yang membuat renderer WAJIB melepas konteksnya di cleanup.

// ── Perilaku lepasRenderer ──
type Panggilan = string[]
function rendererPalsu(opsi: { gagalForce?: boolean } = {}) {
  const log: Panggilan = []
  const palsu = {
    renderLists: { dispose: () => log.push('renderLists.dispose') },
    dispose: () => log.push('dispose'),
    forceContextLoss: () => { log.push('forceContextLoss'); if (opsi.gagalForce) throw new Error('already lost') },
    domElement: { remove: () => log.push('domElement.remove') },
  }
  return { palsu: palsu as unknown as Parameters<typeof lepasRenderer>[0], log }
}

{
  const { palsu, log } = rendererPalsu()
  lepasRenderer(palsu)
  assert.deepEqual(log, ['renderLists.dispose', 'dispose', 'forceContextLoss'], 'urutan: bebaskan sumber daya lalu lepas konteks; kanvas tetap urusan pemanggil')
}
{
  // Negatif: konteks yang sudah hilang tidak boleh membuat cleanup melempar; pemanggil masih bisa mencopot kanvas sesudahnya.
  const { palsu, log } = rendererPalsu({ gagalForce: true })
  assert.doesNotThrow(() => lepasRenderer(palsu))
  assert.deepEqual(log, ['renderLists.dispose', 'dispose', 'forceContextLoss'])
}
{
  // Batas: dipanggil dua kali (StrictMode / cleanup ganda) tidak melempar.
  const { palsu } = rendererPalsu()
  lepasRenderer(palsu)
  assert.doesNotThrow(() => lepasRenderer(palsu))
}

// ── Kontrak sumber: setiap pembuat renderer melepas konteksnya ──
function berkas(dir: string, hasil: string[] = []): string[] {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama)
    if (statSync(p).isDirectory()) berkas(p, hasil)
    else if (/\.(ts|tsx)$/.test(nama)) hasil.push(p)
  }
  return hasil
}

const pembuat = berkas('src').filter((f) => {
  if (f.endsWith('src/lib/rendererAman.ts')) return false // definisi helper itu sendiri
  const s = readFileSync(f, 'utf8')
  return /new (?:THREE\.)?WebGLRenderer\(|buatRendererAman\(/.test(s)
})
assert.ok(pembuat.length >= 30, `pemindaian harus menemukan semua viewer 3D (ditemukan ${pembuat.length})`)

const belumMelepas = pembuat.filter((f) => {
  const s = readFileSync(f, 'utf8')
  return !/lepasRenderer\(|forceContextLoss\(\)/.test(s)
})
assert.deepEqual(belumMelepas, [], `viewer ini membuat renderer tetapi tidak melepas konteks WebGL-nya:\n${belumMelepas.join('\n')}`)

console.log(`renderer-dilepas: ${pembuat.length} berkas pembuat renderer melepas konteks WebGL-nya saat dibuang`)
