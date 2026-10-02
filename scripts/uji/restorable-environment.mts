import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRestorableEnvironment } from '../../src/domains/body-exposure/engine/restorableEnvironment.ts'

// Bukti cacat nyata: setelah konteks WebGL dipulihkan, isi render target PMREM
// (lingkungan IBL) tidak ikut kembali, sehingga Body3D tampak lebih gelap/datar
// sampai halaman dimuat ulang. Mesin ini membangun ulang lingkungan itu.

type Handle = { id: number; disposed: number; failOnDispose?: boolean; dispose: () => void }

function bangunHarness(opsi: { gagalBangun?: Set<number> } = {}) {
  const log: string[] = []
  const handles: Handle[] = []
  let terpasang: Handle | null = null
  let panggilanBangun = 0
  const env = createRestorableEnvironment<Handle>({
    build: () => {
      panggilanBangun += 1
      log.push(`build#${panggilanBangun}`)
      if (opsi.gagalBangun?.has(panggilanBangun)) throw new Error('context unavailable')
      const h: Handle = {
        id: panggilanBangun,
        disposed: 0,
        dispose() { this.disposed += 1; log.push(`dispose#${this.id}`); if (this.failOnDispose) throw new Error('stale context') },
      }
      handles.push(h)
      return h
    },
    install: (h) => { terpasang = h; log.push(`install:${h ? h.id : 'null'}`) },
  })
  return { env, log, handles, terpasang: () => terpasang }
}

// Positif: rebuild pertama membangun & memasang, generasi 1.
{
  const h = bangunHarness()
  assert.equal(h.env.generation(), 0)
  assert.equal(h.env.isActive(), false)
  assert.equal(h.env.rebuild(), true)
  assert.equal(h.env.generation(), 1)
  assert.equal(h.env.isActive(), true)
  assert.deepEqual(h.log, ['build#1', 'install:1'])
  assert.equal(h.terpasang()?.id, 1)
}

// Positif: pemulihan konteks = rebuild kedua. Lama dibuang tepat sekali, baru dipasang.
{
  const h = bangunHarness()
  h.env.rebuild()
  assert.equal(h.env.rebuild(), true)
  assert.equal(h.env.generation(), 2)
  assert.equal(h.handles[0].disposed, 1, 'lingkungan lama harus dibuang tepat sekali')
  assert.equal(h.handles[1].disposed, 0)
  assert.equal(h.terpasang()?.id, 2)
  assert.deepEqual(h.log, ['build#1', 'install:1', 'dispose#1', 'build#2', 'install:2'])
}

// Negatif: build gagal saat pemulihan -> gagal tertutup (tanpa lingkungan basi/hitam), tanpa lempar.
{
  const h = bangunHarness({ gagalBangun: new Set([2]) })
  h.env.rebuild()
  assert.equal(h.env.rebuild(), false)
  assert.equal(h.env.generation(), 1, 'generasi tidak naik bila build gagal')
  assert.equal(h.env.isActive(), false)
  assert.equal(h.terpasang(), null, 'lingkungan basi tidak boleh tetap terpasang')
  assert.equal(h.handles[0].disposed, 1)
  // Berpasangan: tanpa kegagalan build, hal yang sama menghasilkan lingkungan aktif.
  const ok = bangunHarness()
  ok.env.rebuild(); ok.env.rebuild()
  assert.equal(ok.env.isActive(), true)
  assert.notEqual(ok.terpasang(), null)
}

// Negatif: build gagal pada percobaan pertama tidak menjatuhkan pemanggil; pemulihan berikutnya berhasil.
{
  const h = bangunHarness({ gagalBangun: new Set([1]) })
  assert.equal(h.env.rebuild(), false)
  assert.equal(h.env.isActive(), false)
  assert.equal(h.env.rebuild(), true)
  assert.equal(h.env.generation(), 1)
  assert.equal(h.terpasang()?.id, 2)
}

// Negatif: dispose() pada handle milik konteks yang hilang melempar -> tidak merambat, build baru tetap jalan.
{
  const h = bangunHarness()
  h.env.rebuild()
  h.handles[0].failOnDispose = true
  assert.equal(h.env.rebuild(), true)
  assert.equal(h.env.generation(), 2)
  assert.equal(h.terpasang()?.id, 2)
}

// Positif: konteks sebelumnya hilang -> sumber daya lama ikut mati, jadi tidak di-dispose (hindari galat GL
// "object does not belong to this context"), tetapi yang baru tetap dibangun & dipasang.
{
  const h = bangunHarness()
  h.env.rebuild()
  assert.equal(h.env.rebuild({ previousContextLost: true }), true)
  assert.equal(h.handles[0].disposed, 0, 'handle milik konteks yang hilang tidak boleh di-dispose')
  assert.equal(h.terpasang()?.id, 2)
  assert.equal(h.env.generation(), 2)
  assert.deepEqual(h.log, ['build#1', 'install:1', 'build#2', 'install:2'])
  // Berpasangan: tanpa opsi itu, handle lama dibuang (kasus pemulihan biasa).
  const biasa = bangunHarness()
  biasa.env.rebuild(); biasa.env.rebuild({ previousContextLost: false })
  assert.equal(biasa.handles[0].disposed, 1)
}

// Negatif: dengan konteks hilang, build yang gagal tetap gagal tertutup dan tidak men-dispose handle lama.
{
  const h = bangunHarness({ gagalBangun: new Set([2]) })
  h.env.rebuild()
  assert.equal(h.env.rebuild({ previousContextLost: true }), false)
  assert.equal(h.terpasang(), null)
  assert.equal(h.env.isActive(), false)
  assert.equal(h.handles[0].disposed, 0)
}

// Batas: setelah dispose(), rebuild tidak menghidupkan kembali apa pun dan tidak memasang apa pun.
{
  const h = bangunHarness()
  h.env.rebuild()
  h.env.dispose()
  assert.equal(h.terpasang(), null)
  assert.equal(h.handles[0].disposed, 1)
  const sebelum = h.log.length
  assert.equal(h.env.rebuild(), false)
  assert.equal(h.log.length, sebelum, 'rebuild setelah dispose tidak boleh membangun atau memasang')
  assert.equal(h.env.generation(), 1)
  assert.equal(h.env.isActive(), false)
}

// Batas: dispose() idempoten (handle dibuang sekali, install(null) sekali).
{
  const h = bangunHarness()
  h.env.rebuild()
  h.env.dispose()
  h.env.dispose()
  assert.equal(h.handles[0].disposed, 1)
  assert.equal(h.log.filter((x) => x === 'install:null').length, 1)
}

// Batas: dispose() sebelum pernah membangun aman dan tidak membuang apa pun.
{
  const h = bangunHarness()
  h.env.dispose()
  assert.deepEqual(h.log, ['install:null'])
}

// Determinisme: dua kali jalan dengan urutan sama -> log identik.
{
  const jalan = () => { const h = bangunHarness({ gagalBangun: new Set([3]) }); for (let i = 0; i < 4; i++) h.env.rebuild(); h.env.dispose(); return h.log }
  assert.deepEqual(jalan(), jalan())
}

// Kontrak pemakaian: Body3D wajib membangun ulang lingkungan saat konteks pulih dan melepasnya saat unmount.
{
  const body3d = readFileSync('src/components/Body3D.tsx', 'utf8')
  assert.match(body3d, /createRestorableEnvironment/, 'Body3D harus memakai mesin lingkungan yang dapat dipulihkan')
  const restored = body3d.match(/onRestored:\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s{6}\},/)
  assert.ok(restored, 'onRestored harus terdeteksi')
  assert.match(restored![1], /rebuildEnvironment\(true\)/, 'pemulihan konteks harus membangun ulang lingkungan IBL dan menandai konteks lama hilang')
  assert.match(body3d, /environment\.dispose\(\)/, 'unmount harus melepas lingkungan')
  const pembangunan = body3d.match(/\.fromScene\(/g) ?? []
  assert.equal(pembangunan.length, 1, 'PMREM hanya boleh dibangun di satu tempat')
  assert.match(body3d, /build:\s*\(\)\s*=>\s*\{[^}]*\.fromScene\(/, 'satu-satunya PMREM harus dibangun di dalam build() mesin pemulihan, bukan sekali jalan')
}

console.log('restorable environment: IBL dibangun ulang saat konteks pulih, gagal tertutup, dan tidak hidup lagi setelah dispose')
