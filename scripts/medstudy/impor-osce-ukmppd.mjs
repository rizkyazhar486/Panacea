// Mengubah lembar rekap stasiun OSCE UKMPPD menjadi berkas data TypeScript.
//
// MENGAPA LEWAT SKRIP, BUKAN DISALIN TANGAN. Isinya 1.400-an sel; menyalinnya
// dengan tangan menjamin ada yang tertinggal dan tidak ada yang menyadarinya.
// Skrip juga membuat pembaruan berikutnya — periode ujian baru — menjadi satu
// perintah, bukan satu pekerjaan penyuntingan.
//
// Dijalankan: node scripts/impor-osce-ukmppd.mjs <berkas.xlsx>
// Keluarannya src/lib/osceUkmppdRiwayat.ts
//
// APA YANG TIDAK DIBERSIHKAN. Nama kasus dibiarkan APA ADANYA, termasuk yang
// berupa dua kemungkinan ("Ra/Gout"), yang menyebut tindakan di dalam kurung,
// maupun yang salah eja. Membakukannya berarti menafsirkan, dan tafsiran yang
// dituliskan sebagai data tidak dapat dibedakan lagi dari catatan aslinya oleh
// siapa pun yang membacanya kemudian. Penyeragaman dilakukan pada saat
// MENGANALISIS, di tempat yang dapat diperiksa.
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const berkas = process.argv[2]
if (!berkas) { console.error('pakai: node scripts/impor-osce-ukmppd.mjs <berkas.xlsx>'); process.exit(1) }

// Pembacaan xlsx diserahkan ke Python+openpyxl: menulis pembaca xlsx sendiri
// berarti menulis pembaca ZIP dan XML, dan kekeliruan di sana muncul sebagai
// data yang salah diam-diam, bukan sebagai galat.
const py = `
import openpyxl, json, datetime, sys
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
out = []
for ws in wb.worksheets:
    rows = list(ws.iter_rows(values_only=True))
    if not rows: continue
    kepala = rows[0]
    sistem = {i: str(kepala[i]).strip() for i in range(2, min(len(kepala), 14)) if kepala[i]}
    periode = None
    for r in rows[1:]:
        a = r[0]
        if a not in (None, '', ' '):
            periode = a.strftime('%Y-%m-%d') if isinstance(a, (datetime.datetime, datetime.date)) else str(a).strip()
        if not periode or periode == 'DM': continue
        sesi = str(r[1]).strip() if len(r) > 1 and r[1] not in (None, '', ' ') else None
        for i, nama in sistem.items():
            if i >= len(r): continue
            v = r[i]
            if v in (None, '', ' '): continue
            kasus = str(v).strip()
            if not kasus or kasus.lower().startswith('gak punya'): continue
            out.append({'periode': periode, 'sesi': sesi, 'sistem': nama, 'kasus': kasus})
print(json.dumps(out, ensure_ascii=False))
`
const mentah = JSON.parse(execFileSync('python3', ['-c', py, berkas], { maxBuffer: 64 * 1024 * 1024 }).toString())

// Baris kembar muncul karena sebagian periode terekam di dua lembar. Dibuang di
// sini, bukan saat menghitung — hitungan frekuensi yang memuat kembar akan
// melebih-lebihkan kasus yang kebetulan tercatat dua kali.
const kunci = new Set()
const bersih = []
for (const b of mentah) {
  const k = `${b.periode}|${b.sesi ?? ''}|${b.sistem}|${b.kasus}`
  if (kunci.has(k)) continue
  kunci.add(k)
  bersih.push(b)
}

const sistemUnik = [...new Set(bersih.map((b) => b.sistem))]
const periodeUnik = [...new Set(bersih.map((b) => b.periode))]

// Kutip dengan JSON.stringify, bukan dengan penggantian tangan.
//
// Percobaan pertama hanya melolosi garis miring dan apostrof, dan itu pecah
// pada sel yang memuat GANTI BARIS di dalamnya: berkas keluarannya berisi
// string literal yang tidak pernah ditutup, dan TypeScript baru mengeluhkannya
// 940 baris kemudian. JSON.stringify melolosi seluruh aksara kendali sekaligus,
// dan hasilnya string TypeScript yang sah karena keduanya sepakat pada bentuk
// kutip ganda.
const esc = (s) => JSON.stringify(s.replace(/\s+/g, ' ').trim())
const isi = `// BERKAS INI DIHASILKAN OLEH scripts/impor-osce-ukmppd.mjs — JANGAN DISUNTING TANGAN.
//
// Rekap stasiun OSCE UKMPPD ${periodeUnik.length} periode, ${sistemUnik.length} sistem, ${bersih.length} stasiun.
//
// Nama kasus dibiarkan APA ADANYA seperti pada sumbernya, termasuk yang berupa
// dua kemungkinan dan yang menyebutkan tindakan di dalam kurung. Membakukannya
// di dalam data berarti menafsirkan, dan tafsiran yang tersimpan sebagai data
// tidak lagi dapat dibedakan dari catatan aslinya.

export interface StasiunOsce {
  /** Periode ujian apa adanya dari sumber, misalnya 'Februari 2016' atau '2026-02-26'. */
  periode: string
  /** Sesi ke berapa pada periode itu, bila tercatat. */
  sesi?: string
  sistem: string
  kasus: string
}

export const SISTEM_OSCE: readonly string[] = [
${sistemUnik.map((s) => '  ' + esc(s) + ',').join('\n')}
]

export const RIWAYAT_OSCE: readonly StasiunOsce[] = [
${bersih.map((b) => `  { periode: ${esc(b.periode)}, ${b.sesi ? `sesi: ${esc(b.sesi)}, ` : ''}sistem: ${esc(b.sistem)}, kasus: ${esc(b.kasus)} },`).join('\n')}
]
`
writeFileSync('src/lib/osceUkmppdRiwayat.ts', isi)
console.log(`ditulis src/lib/osceUkmppdRiwayat.ts — ${bersih.length} stasiun, ${periodeUnik.length} periode, ${sistemUnik.length} sistem`)
console.log('dibuang sebagai kembar:', mentah.length - bersih.length)
