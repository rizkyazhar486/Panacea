// Aturan Hooks React: tidak ada panggilan hook setelah return awal di badan komponen.
// Pelanggaran membuat React crash ("Rendered more hooks than during the previous
// render") saat kondisi return berubah — pernah menjatuhkan /tubuh (CekHarian).
// Heuristik: dalam fungsi komponen (export function Nama / function Nama berhuruf
// besar), baris ber-indentasi 2 spasi berisi `return` sebelum baris ber-indentasi
// 2 spasi yang memanggil use*( menandakan pelanggaran.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

function berkas(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? berkas(p) : p.endsWith('.tsx') ? [p] : []
  })
}

export function pelanggaran(sumber: string): string[] {
  const hasil: string[] = []
  const baris = sumber.split('\n')
  let komponen: string | null = null, sudahReturn = -1
  baris.forEach((b, i) => {
    const m = b.match(/^(?:export\s+(?:default\s+)?)?function\s+([A-Z]\w*)\s*\(/)
    if (m) { komponen = m[1]; sudahReturn = -1; return }
    if (/^\}/.test(b)) { komponen = null; return }
    if (!komponen) return
    if (/^ {2}(if\b.*\breturn\b|return\b)/.test(b)) { if (sudahReturn < 0) sudahReturn = i; return }
    if (sudahReturn >= 0 && /^ {2}(const|let)?[^/]*\buse[A-Z]\w*\(/.test(b) && !/^ {2}return\b/.test(b)) hasil.push(`${komponen}: hook di baris ${i + 1} setelah return di baris ${sudahReturn + 1}`)
  })
  return hasil
}

// Uji pendeteksi itu sendiri.
assert.deepEqual(pelanggaran('export function A() {\n  const [x] = useState(0)\n  if (!x) return null\n  const r = useRef(1)\n  return null\n}'), ['A: hook di baris 4 setelah return di baris 3'])
assert.deepEqual(pelanggaran('export function B() {\n  const r = useRef(1)\n  if (!r) return null\n  const f = () => 1\n  return null\n}'), [])

const semua = [...berkas('src/components'), ...berkas('src/pages')].flatMap((p) => pelanggaran(readFileSync(p, 'utf8')).map((x) => `${p} · ${x}`))
assert.deepEqual(semua, [], `hook dipanggil setelah return awal (React akan crash):\n${semua.join('\n')}`)
console.log('hook-sebelum-return: tidak ada hook setelah return awal di komponen src/components & src/pages')
