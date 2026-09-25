// Sinkronisasi riwayat lab dengan server: "yang terakhir menang" per log utuh.
// Tanpa backend (demo GitHub Pages) atau tanpa sesi, log tetap lokal dan
// statusnya dilaporkan jujur sebagai "hanya di perangkat ini".
import { api, backendEnabled } from './api'
import { ambilLab, gantiDariServer, labDiperbaruiPada } from './lab'
import { arahSinkron } from './labSyncArah'
export { arahSinkron }

export type StatusSinkronLab = 'lokal' | 'menyinkron' | 'tersinkron' | 'gagal'
type Log = Record<string, { id: string; tanggal: string; nilai: number; rujukanBawah?: number; rujukanAtas?: number }[]>

let status: StatusSinkronLab = backendEnabled ? 'menyinkron' : 'lokal'
const pendengar = new Set<(s: StatusSinkronLab) => void>()
const setStatus = (s: StatusSinkronLab) => { status = s; pendengar.forEach((f) => f(s)) }
export const statusSinkronLab = () => status
export function dengarSinkronLab(f: (s: StatusSinkronLab) => void): () => void { pendengar.add(f); return () => pendengar.delete(f) }

/** Hanya butir yang memenuhi kontrak server yang dikirim. */
export function logUntukServer(): Log {
  const keluar: Log = {}
  for (const [jenis, daftar] of Object.entries(ambilLab())) {
    const b = daftar.filter((x) => typeof x.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(x.id) && /^\d{4}-\d{2}-\d{2}$/.test(x.tanggal) && x.nilai > 0)
    if (b.length) keluar[jenis] = b.map(({ id, tanggal, nilai, rujukanBawah, rujukanAtas }) => ({ id, tanggal, nilai, ...(rujukanBawah != null ? { rujukanBawah } : {}), ...(rujukanAtas != null ? { rujukanAtas } : {}) }))
  }
  return keluar
}

export async function sinkronLab(): Promise<StatusSinkronLab> {
  if (!backendEnabled) { setStatus('lokal'); return status }
  setStatus('menyinkron')
  try {
    const server = await api.getLabLog()
    const lokal = logUntukServer()
    const arah = arahSinkron(labDiperbaruiPada(), server.diperbaruiPada, Object.keys(lokal).length > 0)
    if (arah === 'tarik' && server.diperbaruiPada) gantiDariServer(server.log, server.diperbaruiPada)
    if (arah === 'dorong') {
      const cap = labDiperbaruiPada() ?? new Date().toISOString()
      try { await api.putLabLog(lokal, cap) } catch (e) {
        // 409: server punya salinan lebih baru dari perangkat lain — ambil itu.
        if (!/409/.test(String((e as Error).message))) throw e
        const s2 = await api.getLabLog()
        if (s2.diperbaruiPada) gantiDariServer(s2.log, s2.diperbaruiPada)
      }
    }
    setStatus('tersinkron')
  } catch (e) {
    // Sesi tidak ada/kedaluwarsa: tetap lokal, jangan klaim tersinkron.
    setStatus(/unauthorized|401/i.test(String((e as Error).message)) ? 'lokal' : 'gagal')
  }
  return status
}

let dipasang = false
let tunda = 0
let percobaan = 0
let ulang = 0
// Coba ulang setelah gagal jaringan/server: 5 s, 15 s, 60 s, lalu tiap 5 menit;
// juga segera saat peramban kembali online. Tidak mengulang saat belum login.
export const JEDA_ULANG_MS = [5_000, 15_000, 60_000, 300_000] as const
export function jedaUlang(ke: number): number { return JEDA_ULANG_MS[Math.min(Math.max(ke, 0), JEDA_ULANG_MS.length - 1)] }
function jadwalkanUlang(s: StatusSinkronLab) {
  window.clearTimeout(ulang)
  if (s !== 'gagal') { percobaan = 0; return }
  ulang = window.setTimeout(() => void sinkronLab().then(jadwalkanUlang), jedaUlang(percobaan++))
}
/** Pasang sekali: sinkron saat mulai, lalu dorong setiap perubahan lokal (debounce 1,5 s). */
export function pasangSinkronLab(): void {
  if (dipasang || typeof window === 'undefined') return
  dipasang = true
  void sinkronLab().then(jadwalkanUlang)
  window.addEventListener('panacea:lab', (e) => {
    if ((e as CustomEvent).detail?.asal !== 'lokal') return
    window.clearTimeout(tunda)
    tunda = window.setTimeout(() => void sinkronLab().then(jadwalkanUlang), 1500)
  })
  window.addEventListener('online', () => { percobaan = 0; void sinkronLab().then(jadwalkanUlang) })
}
