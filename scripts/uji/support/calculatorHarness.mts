// Peralatan bersama untuk verifikasi independen kalkulator klinis (C6, bagian rekayasa): PRNG berbenih, perbandingan toleransi,
// dan matriks masukan bermusuhan + batas rentang. Bukan bukti klinis; lihat docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'

export function mulberry32(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export const close = (a: number, b: number, what: string, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: engine ${a} vs reference ${b}`)
export const HOSTILE: readonly unknown[] = [Number.NaN, Infinity, -Infinity, -1, 0, -1e308, 1e308, '5', '', null, undefined, true, {}, [], [5]]

/** Nilai bermusuhan pada SATU kolom (kolom lain sah) tidak pernah menghasilkan angka, dan tidak pernah melempar. */
export function hostileMatrix<I extends Record<string, unknown>>(name: string, base: I, run: (i: I) => unknown, computed: (r: any) => boolean, fields: readonly (keyof I & string)[], ranges: Record<string, { min: number; max: number }>, optional: readonly string[] = []) {
  assert.equal(computed(run(base)), true, `${name}: the base fixture must compute`)
  for (const f of fields) {
    for (const bad of HOSTILE) {
      // Angka hingga yang berada dalam rentang kolom itu sah; di luar itu harus ditolak.
      if (typeof bad === 'number' && Number.isFinite(bad) && bad >= ranges[f]!.min && bad <= ranges[f]!.max) continue
      if (bad === undefined && optional.includes(f)) continue // undefined = "tidak diberikan" untuk kolom opsional (null/NaN tetap ditolak)
      let r: unknown
      assert.doesNotThrow(() => { r = run({ ...base, [f]: bad }) }, `${name}.${f}=${String(bad)} must not throw`)
      assert.equal(computed(r), false, `${name}.${f}=${JSON.stringify(bad) ?? String(bad)} must not produce a result`)
    }
    // Batas: min dan max sah; sedikit di luar ditolak.
    const { min, max } = ranges[f]!
    assert.equal(computed(run({ ...base, [f]: min })), true, `${name}.${f} at min`)
    assert.equal(computed(run({ ...base, [f]: max })), true, `${name}.${f} at max`)
    const eps = Math.max(1e-6, Math.abs(max) * 1e-9)
    assert.equal(computed(run({ ...base, [f]: min - eps })), false, `${name}.${f} just below min`)
    assert.equal(computed(run({ ...base, [f]: max + eps })), false, `${name}.${f} just above max`)
  }
}
