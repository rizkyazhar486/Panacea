// Fantom CT SINTETIS untuk uji — bukan data pasien, bukan anatomi.
// Udara -1000 HU di luar, elipsoid "jaringan lunak" 40 HU, silinder "tulang"
// 900 HU di dalamnya. Ditulis sebagai DICOM Part 10 Explicit VR Little Endian
// tak termampat, supaya melewati pengurai yang sama dengan berkas sungguhan.

const EKSPLISIT = '1.2.840.10008.1.2.1'
const PANJANG_32 = new Set(['OB', 'OW', 'SQ', 'UN', 'UT', 'OF'])

function unsur(grup: number, elemen: number, vr: string, nilai: Uint8Array): Uint8Array {
  const pad = nilai.length % 2 ? new Uint8Array([...nilai, vr === 'UI' ? 0 : 0x20]) : nilai
  const panjang32 = PANJANG_32.has(vr)
  const kepala = new Uint8Array(panjang32 ? 12 : 8)
  const dv = new DataView(kepala.buffer)
  dv.setUint16(0, grup, true); dv.setUint16(2, elemen, true)
  kepala[4] = vr.charCodeAt(0); kepala[5] = vr.charCodeAt(1)
  if (panjang32) dv.setUint32(8, pad.length, true)
  else dv.setUint16(6, pad.length, true)
  return new Uint8Array([...kepala, ...pad])
}
const teks = (s: string) => new TextEncoder().encode(s)
const us = (n: number) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b }
const ul = (n: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b }

export interface OpsiFantom { sisi?: number; irisan?: number; jarakPikselMm?: number; tebalMm?: number; tanpaJarakPiksel?: boolean }

/** Satu irisan fantom (indeks z) sebagai ArrayBuffer DICOM. */
export function irisanFantom(z: number, o: OpsiFantom = {}): ArrayBuffer {
  const n = o.sisi ?? 64, jumlah = o.irisan ?? 48, px = o.jarakPikselMm ?? 4, tebal = o.tebalMm ?? 4
  const hu = new Int16Array(n * n)
  const cz = (z - (jumlah - 1) / 2) / (jumlah / 2)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const cx = (x - (n - 1) / 2) / (n / 2), cy = (y - (n - 1) / 2) / (n / 2)
    let v = -1000
    if ((cx / 0.8) ** 2 + (cy / 0.6) ** 2 + (cz / 0.85) ** 2 <= 1) v = 40
    if (cx * cx + cy * cy <= 0.18 ** 2 && Math.abs(cz) <= 0.6) v = 900
    hu[y * n + x] = v
  }
  const seri = '2.25.1000000000000000000000000000000001'
  const dataset = [
    unsur(0x0008, 0x0018, 'UI', teks(`${seri}.${z + 1}`)),
    unsur(0x0008, 0x0060, 'CS', teks('CT')),
    unsur(0x0008, 0x103e, 'LO', teks('SYNTHETIC PHANTOM - NOT PATIENT DATA')),
    unsur(0x0018, 0x0050, 'DS', teks(String(tebal))),
    unsur(0x0020, 0x000d, 'UI', teks('2.25.2000000000000000000000000000000002')),
    unsur(0x0020, 0x000e, 'UI', teks(seri)),
    unsur(0x0020, 0x0013, 'IS', teks(String(z + 1))),
    unsur(0x0020, 0x0032, 'DS', teks(`0\\0\\${(z * tebal).toFixed(1)}`)),
    unsur(0x0020, 0x0037, 'DS', teks('1\\0\\0\\0\\1\\0')),
    unsur(0x0020, 0x0052, 'UI', teks('2.25.3000000000000000000000000000000003')),
    unsur(0x0028, 0x0002, 'US', us(1)),
    unsur(0x0028, 0x0004, 'CS', teks('MONOCHROME2')),
    unsur(0x0028, 0x0010, 'US', us(n)),
    unsur(0x0028, 0x0011, 'US', us(n)),
    ...(o.tanpaJarakPiksel ? [] : [unsur(0x0028, 0x0030, 'DS', teks(`${px}\\${px}`))]),
    unsur(0x0028, 0x0100, 'US', us(16)),
    unsur(0x0028, 0x0101, 'US', us(16)),
    unsur(0x0028, 0x0102, 'US', us(15)),
    unsur(0x0028, 0x0103, 'US', us(1)),
    unsur(0x0028, 0x1052, 'DS', teks('0')),
    unsur(0x0028, 0x1053, 'DS', teks('1')),
    unsur(0x7fe0, 0x0010, 'OW', new Uint8Array(hu.buffer)),
  ]
  const metaIsi = [unsur(0x0002, 0x0010, 'UI', teks(EKSPLISIT))]
  const panjangMeta = metaIsi.reduce((a, b) => a + b.length, 0)
  const bagian = [new Uint8Array(128), teks('DICM'), unsur(0x0002, 0x0000, 'UL', ul(panjangMeta)), ...metaIsi, ...dataset]
  const total = bagian.reduce((a, b) => a + b.length, 0)
  const out = new Uint8Array(total); let o2 = 0
  for (const b of bagian) { out.set(b, o2); o2 += b.length }
  return out.buffer
}
