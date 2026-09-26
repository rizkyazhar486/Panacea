// Kernel Kopling Multi-Skala — inti "VisSim-OS" Panacea (tahap 1, CPU/TypeScript).
//
// Tujuan: skala biologis (molekul, sel, jaringan, organ) berjalan sebagai modul yang
// saling mempengaruhi DUA ARAH, tanpa pernah bicara langsung satu sama lain.
// Semua pertukaran lewat kernel (hub-and-spoke) sehingga solver dapat diganti.
//
// Kontrak kemampuan (CapabilityContract) setiap modul:
//   - produces / consumes: nama medan + satuan (ketidakcocokan satuan = gagal tertutup);
//   - dt: langkah waktu sendiri (penjadwalan multi-laju);
//   - step(): fungsi murni state -> {state, outputs}.
// Setiap pesan membawa sigma (ketidakpastian 1-SD), provenance (modul, versi,
// langkah, id induk) sehingga tiap nilai turunan dapat dilacak ke asalnya.
//
// BATAS ILMIAH: kernel ini infrastruktur. Model contoh di contohKatupJaringan.ts
// adalah SIMULASI ILUSTRATIF dengan parameter tak terkalibrasi — bukan prediksi
// klinis, bukan anatomi/fisiologi pasien, bukan bukti kebaruan ilmiah.

export type Skala = 'molecular' | 'subcellular' | 'cellular' | 'tissue' | 'organ' | 'systemic'

/** Medan skalar pada grid 2D (baris-mayor), dengan ketidakpastian per sel. */
export interface Medan {
  nama: string
  satuan: string
  lebar: number
  tinggi: number
  nilai: Float64Array
  sigma: Float64Array
}

export interface Provenans {
  id: string
  modul: string
  versi: string
  langkah: number
  waktu: number
  induk: string[]
}

export interface Pesan { medan: Medan; provenans: Provenans }

export interface DeklarasiMedan { nama: string; satuan: string }

export interface KontrakKemampuan<S> {
  id: string
  versi: string
  skala: Skala
  dt: number
  produces: readonly DeklarasiMedan[]
  consumes: readonly DeklarasiMedan[]
  awal: () => S
  /** Murni: tidak boleh mengubah input. `masukan` hanya medan yang dideklarasikan di consumes. */
  step: (state: S, masukan: Readonly<Record<string, Medan>>, dt: number, waktu: number) => { state: S; keluaran: Medan[] }
  /** Opsional: sel yang layak diperhalus (mis. gradien/ketidakpastian tinggi). */
  mintaPerhalus?: (state: S, keluaran: readonly Medan[]) => number[]
}

export interface CatatanPerhalus { modul: string; langkah: number; waktu: number; sel: number[] }

export interface HasilJalan {
  waktu: number
  pesanTerakhir: Record<string, Pesan>
  riwayat: { waktu: number; medan: string; rerata: number; sigmaRerata: number }[]
  perhalus: CatatanPerhalus[]
  jejak: Provenans[]
}

export function medanBaru(nama: string, satuan: string, lebar: number, tinggi: number, isi = 0, sigma = 0): Medan {
  const n = lebar * tinggi
  return { nama, satuan, lebar, tinggi, nilai: new Float64Array(n).fill(isi), sigma: new Float64Array(n).fill(sigma) }
}

export const rerata = (a: Float64Array) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)

// FNV-1a 32-bit: id provenance deterministik (tanpa jam dinding, tanpa acak).
function sidik(teks: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < teks.length; i++) { h ^= teks.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

/**
 * Validasi komposisi modul sebelum berjalan: setiap medan yang dikonsumsi harus
 * diproduksi TEPAT satu modul lain dengan satuan identik. Gagal tertutup.
 */
export function validasiKomposisi(modul: readonly KontrakKemampuan<unknown>[]): string[] {
  const galat: string[] = []
  const produsen = new Map<string, { modul: string; satuan: string }[]>()
  const ids = new Set<string>()
  for (const m of modul) {
    if (ids.has(m.id)) galat.push(`duplicate module id ${m.id}`)
    ids.add(m.id)
    if (!(m.dt > 0) || !Number.isFinite(m.dt)) galat.push(`${m.id}: dt must be a positive finite number`)
    for (const p of m.produces) produsen.set(p.nama, [...(produsen.get(p.nama) ?? []), { modul: m.id, satuan: p.satuan }])
  }
  for (const [nama, daftar] of produsen) if (daftar.length > 1) galat.push(`field ${nama} produced by more than one module (${daftar.map((d) => d.modul).join(', ')})`)
  for (const m of modul) {
    for (const c of m.consumes) {
      const p = produsen.get(c.nama)?.[0]
      if (!p) galat.push(`${m.id}: consumes ${c.nama} but no module produces it`)
      else if (p.satuan !== c.satuan) galat.push(`${m.id}: unit mismatch for ${c.nama} (${c.satuan} vs ${p.satuan} from ${p.modul})`)
      else if (p.modul === m.id) galat.push(`${m.id}: consumes its own field ${c.nama}`)
    }
  }
  return galat
}

/**
 * Jalankan kopling multi-laju sampai `tAkhir`. Tiap modul melangkah bila jatuh
 * tempo; masukan = pesan TERBARU dari kernel (bukan dari modul lain langsung).
 * Medan awal yang dikonsumsi sebelum ada produsen: diambil dari `awalMedan`.
 */
export function jalankanKopling(
  modul: readonly KontrakKemampuan<any>[],
  tAkhir: number,
  awalMedan: readonly Medan[] = [],
): HasilJalan {
  const galat = validasiKomposisi(modul)
  if (galat.length) throw new Error(`invalid multiscale composition: ${galat.join('; ')}`)
  const state = new Map<string, unknown>(modul.map((m) => [m.id, m.awal()]))
  const berikut = new Map<string, number>(modul.map((m) => [m.id, 0]))
  const langkah = new Map<string, number>(modul.map((m) => [m.id, 0]))
  const pesan: Record<string, Pesan> = {}
  const riwayat: HasilJalan['riwayat'] = []
  const perhalus: CatatanPerhalus[] = []
  const jejak: Provenans[] = []
  // Kondisi awal juga punya provenance, agar setiap rantai dapat ditelusuri sampai awal.
  for (const m of awalMedan) {
    const prov: Provenans = { id: sidik(`awal:${m.nama}`), modul: 'initial-condition', versi: '1', langkah: 0, waktu: 0, induk: [] }
    pesan[m.nama] = { medan: m, provenans: prov }
    jejak.push(prov)
  }
  const EPS = 1e-9
  let waktu = 0
  for (let guard = 0; guard < 1_000_000; guard++) {
    // Modul jatuh tempo paling awal; seri diputus oleh urutan deklarasi (deterministik).
    let tMin = Infinity
    for (const m of modul) tMin = Math.min(tMin, berikut.get(m.id)!)
    if (tMin > tAkhir + EPS) break
    waktu = tMin
    for (const m of modul) {
      if (Math.abs(berikut.get(m.id)! - tMin) > EPS) continue
      const masukan: Record<string, Medan> = {}
      const induk: string[] = []
      for (const c of m.consumes) {
        const p = pesan[c.nama]
        if (!p) throw new Error(`${m.id}: no value yet for consumed field ${c.nama} (provide an initial condition)`)
        masukan[c.nama] = p.medan
        induk.push(p.provenans.id)
      }
      const n = langkah.get(m.id)! + 1
      const hasil = m.step(state.get(m.id), masukan, m.dt, waktu)
      state.set(m.id, hasil.state)
      langkah.set(m.id, n)
      for (const k of hasil.keluaran) {
        const deklarasi = m.produces.find((p) => p.nama === k.nama)
        if (!deklarasi) throw new Error(`${m.id}: produced undeclared field ${k.nama}`)
        if (deklarasi.satuan !== k.satuan) throw new Error(`${m.id}: field ${k.nama} unit ${k.satuan} differs from declared ${deklarasi.satuan}`)
        for (let i = 0; i < k.nilai.length; i++) if (!Number.isFinite(k.nilai[i]) || !Number.isFinite(k.sigma[i]) || k.sigma[i] < 0) throw new Error(`${m.id}: non-finite value or negative sigma in ${k.nama}`)
        const prov: Provenans = { id: sidik(`${m.id}:${m.versi}:${n}:${k.nama}:${induk.join(',')}`), modul: m.id, versi: m.versi, langkah: n, waktu, induk }
        pesan[k.nama] = { medan: k, provenans: prov }
        jejak.push(prov)
        riwayat.push({ waktu, medan: k.nama, rerata: rerata(k.nilai), sigmaRerata: rerata(k.sigma) })
      }
      const sel = m.mintaPerhalus?.(hasil.state, hasil.keluaran) ?? []
      if (sel.length) perhalus.push({ modul: m.id, langkah: n, waktu, sel })
      berikut.set(m.id, berikut.get(m.id)! + m.dt)
    }
  }
  return { waktu, pesanTerakhir: pesan, riwayat, perhalus, jejak }
}

/** Telusuri rantai provenance sebuah pesan sampai kondisi awal. */
export function rantaiProvenans(hasil: HasilJalan, id: string): Provenans[] {
  const peta = new Map(hasil.jejak.map((p) => [p.id, p]))
  const keluar: Provenans[] = []
  const antre = [id]
  const dilihat = new Set<string>()
  while (antre.length) {
    const x = antre.shift()!
    if (dilihat.has(x)) continue
    dilihat.add(x)
    const p = peta.get(x)
    if (!p) continue
    keluar.push(p)
    antre.push(...p.induk)
  }
  return keluar
}
