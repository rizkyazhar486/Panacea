// Model struktur protein resolusi residu (Level 0 atom, Level 1 residu, Level 2 rantai/protein).
//
// Prinsip: TIDAK ADA urutan atau geometri karangan. Semua koordinat berasal dari
// berkas struktur eksperimen yang disertai provenance (public/molekul/PROVENANCE.json);
// parser hanya membaca, tidak pernah melengkapi atom yang hilang.
// Konvensi: format PDB wwPDB v3.3 (kolom tetap), penomoran residu penulis (authSeq),
// kode residu tiga huruf standar IUPAC-IUB.

export interface Atom {
  serial: number; nama: string; altLoc: string; resNama: string; rantai: string
  resSeq: number; iCode: string; x: number; y: number; z: number
  occupancy: number; bFactor: number; elemen: string; het: boolean
}

export interface Residu {
  nama: string; seq: number; iCode: string; rantai: string
  atom: Atom[]
  /** Struktur sekunder dari rekaman HELIX/SHEET penyimpan (bukan hasil DSSP). */
  ss: 'helix' | 'sheet' | 'loop'
}

export interface Rantai { id: string; residu: Residu[]; seqres: string[] }

export interface DbRef { rantai: string; mulai: number; akhir: number; db: string; aksesi: string; idDb: string; dbMulai: number; dbAkhir: number }

export interface Struktur {
  idPdb: string; judul: string; organisme: string; metode: string; resolusiA: number | null
  rantai: Rantai[]; hetatm: Atom[]; dbref: DbRef[]
  heliks: { rantai: string; mulai: number; akhir: number }[]
  lembar: { rantai: string; mulai: number; akhir: number }[]
}

export const TIGA_KE_SATU: Readonly<Record<string, string>> = {
  ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C', GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
  LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P', SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
}

const kol = (b: string, a: number, z: number) => b.slice(a - 1, z).trim()

export function parsePdb(teks: string): Struktur {
  const s: Struktur = { idPdb: '', judul: '', organisme: '', metode: '', resolusiA: null, rantai: [], hetatm: [], dbref: [], heliks: [], lembar: [] }
  const seqres = new Map<string, string[]>()
  const peta = new Map<string, Rantai>()
  let modelSelesai = false
  const judul: string[] = []
  for (const b of teks.split(/\r?\n/)) {
    const rec = b.slice(0, 6)
    if (rec === 'HEADER') s.idPdb = kol(b, 63, 66)
    else if (rec === 'TITLE ') judul.push(kol(b, 11, 80))
    else if (rec === 'SOURCE' && /ORGANISM_SCIENTIFIC:/.test(b)) s.organisme = b.split('ORGANISM_SCIENTIFIC:')[1].replace(';', '').trim()
    else if (rec === 'EXPDTA') s.metode = kol(b, 11, 79)
    else if (rec === 'REMARK' && /^REMARK   2 RESOLUTION\./.test(b)) { const m = b.match(/([\d.]+)\s+ANGSTROM/); s.resolusiA = m ? Number(m[1]) : null }
    else if (rec === 'DBREF ') s.dbref.push({ rantai: kol(b, 13, 13), mulai: Number(kol(b, 15, 18)), akhir: Number(kol(b, 21, 24)), db: kol(b, 27, 32), aksesi: kol(b, 34, 41), idDb: kol(b, 43, 54), dbMulai: Number(kol(b, 56, 60)), dbAkhir: Number(kol(b, 63, 67)) })
    else if (rec === 'SEQRES') { const r = kol(b, 12, 12); seqres.set(r, [...(seqres.get(r) ?? []), ...kol(b, 20, 70).split(/\s+/).filter(Boolean)]) }
    else if (rec === 'HELIX ') s.heliks.push({ rantai: kol(b, 20, 20), mulai: Number(kol(b, 22, 25)), akhir: Number(kol(b, 34, 37)) })
    else if (rec === 'SHEET ') s.lembar.push({ rantai: kol(b, 22, 22), mulai: Number(kol(b, 23, 26)), akhir: Number(kol(b, 34, 37)) })
    else if (rec === 'ENDMDL') modelSelesai = true
    else if ((rec === 'ATOM  ' || rec === 'HETATM') && !modelSelesai) {
      const a: Atom = {
        serial: Number(kol(b, 7, 11)), nama: kol(b, 13, 16), altLoc: kol(b, 17, 17), resNama: kol(b, 18, 20), rantai: kol(b, 22, 22),
        resSeq: Number(kol(b, 23, 26)), iCode: kol(b, 27, 27), x: Number(kol(b, 31, 38)), y: Number(kol(b, 39, 46)), z: Number(kol(b, 47, 54)),
        occupancy: Number(kol(b, 55, 60) || '1'), bFactor: Number(kol(b, 61, 66) || '0'), elemen: kol(b, 77, 78) || kol(b, 13, 16).replace(/[^A-Z]/g, '').slice(0, 1), het: rec === 'HETATM',
      }
      if (![a.x, a.y, a.z].every(Number.isFinite)) throw new Error(`non-numeric coordinate at atom ${a.serial}`)
      // Lokasi alternatif: hanya konformer pertama (kosong atau 'A') dipertahankan.
      if (a.altLoc && a.altLoc !== 'A') continue
      if (a.het) { s.hetatm.push(a); continue }
      const r = peta.get(a.rantai) ?? { id: a.rantai, residu: [], seqres: [] }
      peta.set(a.rantai, r)
      let res = r.residu[r.residu.length - 1]
      if (!res || res.seq !== a.resSeq || res.iCode !== a.iCode) { res = { nama: a.resNama, seq: a.resSeq, iCode: a.iCode, rantai: a.rantai, atom: [], ss: 'loop' }; r.residu.push(res) }
      res.atom.push(a)
    }
  }
  s.judul = judul.join(' ').replace(/\s+/g, ' ')
  for (const [id, r] of peta) {
    r.seqres = seqres.get(id) ?? []
    for (const res of r.residu) {
      if (s.heliks.some((h) => h.rantai === id && res.seq >= h.mulai && res.seq <= h.akhir)) res.ss = 'helix'
      else if (s.lembar.some((h) => h.rantai === id && res.seq >= h.mulai && res.seq <= h.akhir)) res.ss = 'sheet'
    }
    s.rantai.push(r)
  }
  return s
}

export const atomDari = (r: Residu, nama: string) => r.atom.find((a) => a.nama === nama)

export function urutanSatuHuruf(r: Rantai, sumber: 'atom' | 'seqres' = 'atom'): string {
  const kode = sumber === 'seqres' ? r.seqres : r.residu.map((x) => x.nama)
  return kode.map((k) => TIGA_KE_SATU[k] ?? 'X').join('')
}

export function keFasta(s: Struktur, idRantai: string): string {
  const r = s.rantai.find((x) => x.id === idRantai)
  if (!r) throw new Error(`no chain ${idRantai}`)
  const d = s.dbref.find((x) => x.rantai === idRantai)
  const seq = urutanSatuHuruf(r, r.seqres.length ? 'seqres' : 'atom')
  const judul = `>pdb|${s.idPdb}|${idRantai}${d ? ` ${d.db}:${d.aksesi} ${d.idDb} ${d.dbMulai}-${d.dbAkhir}` : ''} ${s.organisme}`.trim()
  return `${judul}\n${seq.match(/.{1,60}/g)!.join('\n')}\n`
}

const kanan = (v: string | number, n: number) => String(v).padStart(n)
const kiri = (v: string, n: number) => v.padEnd(n)

/** Tulis ATOM kolom-tetap (wwPDB v3.3). Nama atom 1-3 karakter diawali spasi (konvensi). */
export function kePdb(s: Struktur): string {
  const baris: string[] = [`HEADER    ${kiri('', 40)}${kiri('', 9)}   ${s.idPdb}`.trimEnd()]
  for (const r of s.rantai) for (const res of r.residu) for (const a of res.atom) {
    const nama = a.nama.length < 4 ? ` ${kiri(a.nama, 3)}` : a.nama
    baris.push(`ATOM  ${kanan(a.serial, 5)} ${nama}${a.altLoc || ' '}${kanan(a.resNama, 3)} ${a.rantai}${kanan(a.resSeq, 4)}${a.iCode || ' '}   ${kanan(a.x.toFixed(3), 8)}${kanan(a.y.toFixed(3), 8)}${kanan(a.z.toFixed(3), 8)}${kanan(a.occupancy.toFixed(2), 6)}${kanan(a.bFactor.toFixed(2), 6)}          ${kanan(a.elemen, 2)}`)
  }
  baris.push('END')
  return baris.join('\n') + '\n'
}
