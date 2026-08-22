// Mendaftar teks yang TERLIHAT PEMAKAI dan masih berbahasa Inggris.
//
// Cara mengenalinya: kata-kata Inggris yang lazim muncul di antarmuka
// (your, the, and, with, from, this, ...) di dalam atribut judul/subjudul
// atau di dalam teks JSX. Ini penapis kasar dan tidak dapat sempurna —
// istilah kedokteran memang berbahasa Inggris, dan nama fitur seperti
// "Body Battery" tidak untuk diterjemahkan.
//
// Karena itu keluarannya adalah DAFTAR PERIKSA berperingkat, bukan vonis:
// halaman dengan tumpukan kalimat Inggris berada di atas, dan itulah yang
// perlu dikerjakan lebih dahulu.

import { readdirSync, readFileSync } from 'node:fs'

const KATA = /\b(your|you|the|and|with|from|this|that|these|those|for|are|is|was|were|have|has|been|will|would|should|could|when|where|what|which|how|why|not|but|than|then|here|there|about|into|over|under|after|before|each|every|only|still|already|enough)\b/i

// Baris yang memang tidak untuk diterjemahkan.
const LEWATI = [
  /^\s*(import|export|const|let|function|interface|type|class)\b/,
  /className=|aria-|href=|to=|src=|d="M|viewBox|stroke|fill=/,
  /^\s*\/\//,
]

function kalimatTerlihat(baris) {
  if (LEWATI.some((r) => r.test(baris))) return null
  // Teks di antara > dan <, atau di dalam atribut title/subtitle/placeholder/label.
  const petik = baris.match(/(?:title|subtitle|placeholder|label|ringkas)="([^"]{12,})"/)
  if (petik && KATA.test(petik[1])) return petik[1]
  const jsx = baris.match(/>\s*([A-Z][^<>{}]{14,})</)
  if (jsx && KATA.test(jsx[1])) return jsx[1].trim()
  return null
}

const hasil = []
for (const dir of ['src/pages', 'src/components']) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.tsx'))) {
    const baris = readFileSync(`${dir}/${f}`, 'utf8').split('\n')
    const temuan = []
    baris.forEach((b, i) => {
      const k = kalimatTerlihat(b)
      if (k) temuan.push({ baris: i + 1, teks: k })
    })
    if (temuan.length) hasil.push({ berkas: `${dir}/${f}`, temuan })
  }
}
hasil.sort((a, b) => b.temuan.length - a.temuan.length)

const arg = process.argv[2]
if (arg) {
  const satu = hasil.find((h) => h.berkas.includes(arg))
  if (!satu) { console.log('tidak ada'); process.exit(0) }
  for (const t of satu.temuan) console.log(String(t.baris).padStart(5), t.teks)
} else {
  for (const h of hasil.slice(0, 25)) console.log(String(h.temuan.length).padStart(4), h.berkas)
  console.log(`\n${hasil.reduce((a, h) => a + h.temuan.length, 0)} kalimat Inggris di ${hasil.length} berkas.`)
}
