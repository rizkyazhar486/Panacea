import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { argv } from 'node:process'

// Menghasilkan sidik jari untuk setiap bundel geometri yang dikirim.
//
// Provenans atlas menyebut sumber dan lisensinya, tetapi tidak pernah menyebut
// BERKAS YANG MANA. Tanpa itu, "diturunkan dari Z-Anatomy CC BY-SA 4.0" tidak
// bisa dibuktikan terhadap bit yang benar-benar dikirim: berkasnya bisa
// diganti, dikonversi ulang dengan setelan berbeda, atau terpotong, dan tidak
// ada satu pun pemeriksaan yang berubah.
//
// Jumlah simpul ikut dicatat karena ia yang menentukan apakah petunjuk sumber
// masih menemukan geometrinya. Digest memberi tahu bahwa bundelnya berubah;
// jumlah simpul memberi petunjuk pertama tentang APA yang berubah.

const DIR = 'public/anatomy'
const KELUARAN = 'src/lib/anatomy/bundleDigests.gen.ts'

function jumlahSimpulGlb(buf) {
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return null
  const panjang = buf.readUInt32LE(12)
  if (buf.readUInt32LE(16) !== 0x4e4f534a) return null
  try {
    const json = JSON.parse(buf.subarray(20, 20 + panjang).toString('utf8'))
    return Array.isArray(json.nodes) ? json.nodes.length : null
  } catch { return null }
}

export async function hitungSidikJari() {
  const berkas = (await readdir(DIR)).filter((f) => f.endsWith('.glb')).sort()
  const out = []
  for (const f of berkas) {
    const buf = await readFile(`${DIR}/${f}`)
    out.push({
      file: f,
      bytes: buf.length,
      sha256: createHash('sha256').update(buf).digest('hex'),
      nodes: jumlahSimpulGlb(buf),
    })
  }
  return out
}

function render(daftar) {
  const baris = daftar.map((d) =>
    `  { file: '${d.file}', bytes: ${d.bytes}, sha256: '${d.sha256}', nodes: ${d.nodes} },`).join('\n')
  return `// DIHASILKAN OLEH scripts/gen-bundle-digests.mjs — jangan disunting tangan.
//
// Sidik jari bundel geometri yang benar-benar dikirim. Dipakai supaya klaim
// provenans bisa diperiksa terhadap bit, bukan hanya terhadap niat.
//
// Perbarui dengan: node scripts/gen-bundle-digests.mjs --write

export interface SidikJariBundel {
  file: string
  bytes: number
  sha256: string
  /** Jumlah simpul di chunk JSON glTF, atau null bila tidak terbaca. */
  nodes: number | null
}

export const SIDIK_JARI_BUNDEL: readonly SidikJariBundel[] = [
${baris}
]
`
}

if (argv[1]?.endsWith('gen-bundle-digests.mjs')) {
  const daftar = await hitungSidikJari()
  if (argv.includes('--write')) {
    await writeFile(KELUARAN, render(daftar))
    console.log(`Ditulis ${KELUARAN} untuk ${daftar.length} bundel.`)
  } else {
    console.log(JSON.stringify(daftar, null, 2))
  }
}
