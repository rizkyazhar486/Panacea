import { readFileSync } from 'node:fs'
const list = readFileSync('src/lib/skdiDiseaseList.ts','utf8')
const rows = [...list.matchAll(/\{ system: '([^']+)', disease: '([^']+)', level: '([^']+)'/g)]
  .map(m => ({ system:m[1], disease:m[2], level:m[3] }))

const notes = readFileSync('src/lib/skdiDiseaseNotes.ts','utf8')
const aliases = readFileSync('src/lib/skdiDiseaseNoteAliases.ts','utf8')
const alias = Object.fromEntries([...aliases.matchAll(/^  '([^']+)':\s*'([^']+)'/gm)].map(m=>[m[1],m[2]]))

// Petakan tiap kunci catatan ke blok teksnya, untuk menghitung field terisi.
const blok = {}
const re = /^  '((?:[^'\\]|\\.)*)':\s*\{$/gm
const idx = []
let m
while ((m = re.exec(notes))) idx.push({ key:m[1], start:m.index })
idx.forEach((x,i)=>{ blok[x.key] = notes.slice(x.start, i+1<idx.length?idx[i+1].start:notes.length) })

const osce = readFileSync('src/lib/osceStationNotes.ts','utf8')
const oidx = []
const ore = /^  '((?:[^'\\]|\\.)*)':\s*\{$/gm
while ((m = ore.exec(osce))) oidx.push({ key:m[1], start:m.index })
oidx.forEach((x,i)=>{ blok['OSCE::'+x.key] = osce.slice(x.start, i+1<oidx.length?oidx[i+1].start:osce.length) })

const FIELD = ['definisi','etiologi','patofisiologi','anamnesis','pemeriksaanFisik','penunjang','diagnosisBanding','tatalaksana']
const byLevel = {}
const kurang = []
for (const r of rows) {
  const key = alias[r.disease] ?? r.disease
  const b = blok[key] ?? blok['OSCE::'+key]
  const punya = b ? FIELD.filter(f => new RegExp('^\\s{4}'+f+':','m').test(b)) : []
  const lvl = r.level
  byLevel[lvl] ??= { n:0, lengkap:0, jml:0 }
  byLevel[lvl].n++
  byLevel[lvl].jml += punya.length
  if (punya.length === FIELD.length) byLevel[lvl].lengkap++
  if (['1','2','3','3A','3B'].includes(lvl) && punya.length < FIELD.length)
    kurang.push({ ...r, punya:punya.length, hilang: FIELD.filter(f=>!punya.includes(f)) })
}
console.log('LEVEL  jml  lengkap  rata2 field terisi dari 8')
for (const k of Object.keys(byLevel).sort())
  console.log(k.padEnd(6), String(byLevel[k].n).padStart(4), String(byLevel[k].lengkap).padStart(8),
    '   ', (byLevel[k].jml/byLevel[k].n).toFixed(1))
console.log('\nLevel 1/2/3 yang BELUM lengkap:', kurang.length)
const perSistem = {}
for (const k of kurang) perSistem[k.system] = (perSistem[k.system]??0)+1
console.log('\nper sistem:')
for (const [s,n] of Object.entries(perSistem).sort((a,b)=>b[1]-a[1])) console.log(' ', String(n).padStart(3), s)

if (process.argv[2]) {
  const f = process.argv[2]
  console.log('\n── Level '+f+' yang belum lengkap ──')
  for (const k of kurang.filter(x=>x.level===f))
    console.log(' ', k.system.slice(0,22).padEnd(23), k.disease.slice(0,44).padEnd(45), k.punya+'/8')
}
