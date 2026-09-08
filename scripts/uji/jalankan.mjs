#!/usr/bin/env node
// Jalankan seluruh berkas uji di folder ini dan laporkan satu ringkasan.
//
// KENAPA ADA FOLDER INI. Uji-uji ini sebelumnya hidup di /tmp dan hilang setiap
// kali lingkungan kerja dibuat ulang. Yang hilang bukan hanya berkasnya —
// yang hilang adalah BUKTI bahwa sebuah cacat pernah ada dan sudah ditutup,
// sehingga cacat yang sama bisa kembali tanpa ada yang menyadarinya. Uji yang
// tidak ikut disimpan bersama kodenya sama saja dengan uji yang tidak pernah
// ditulis.
//
// Semuanya berjalan tanpa jaringan dan tanpa peramban: penyedia kitab suci
// dipalsukan, dan localStorage dipalsukan. Jadi perintah ini bisa dijalankan
// di mana saja, kapan saja, tanpa menghabiskan kuota penyedia gratis yang
// sedang kita numpangi.
import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const di = dirname(fileURLToPath(import.meta.url))
const akar = join(di, '..', '..')
const berkas = readdirSync(di).filter((f) => f.endsWith('.mts')).sort()

let gagal = 0
for (const f of berkas) {
  console.log(`\n─── ${f} ${'─'.repeat(Math.max(0, 60 - f.length))}`)
  // `tsx` dipin sebagai devDependency dan sudah dipasang oleh `npm ci`.
  // Menjalankannya melalui Node --import mempertahankan resolver TypeScript
  // repo (extensionless imports / source .ts behind .js specifiers) tanpa
  // `npx` dan tanpa mengunduh paket ketika regression gate sedang berjalan.
  const r = spawnSync(process.execPath, ['--import=tsx', join(di, f)], {
    stdio: 'inherit',
    cwd: akar,
  })
  if (r.error) {
    console.error(`Gagal menjalankan ${f}: ${r.error.message}`)
    gagal++
    continue
  }
  if (r.status !== 0) gagal++
}

console.log(`\n${berkas.length - gagal}/${berkas.length} berkas uji lulus`)
process.exit(gagal ? 1 : 0)
