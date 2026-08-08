import { useCallback, useEffect, useState } from 'react'
import { Card, SectionTitle, Button, inputClass } from '../components/ui'
import { KolomAngka } from '../components/KolomAngka'
import { IconShield } from '../components/icons'
import { api, backendEnabled } from '../lib/api'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Tinjauan pemilik — verifikasi akun dan putusan atas laporan.
//
// Halaman ini memutuskan siapa yang boleh berkenalan dengan siapa, dan berapa
// kredit kepercayaan yang dipotong. Karena itu dua hal dibuat sengaja tidak
// nyaman:
//
//   1. POIN PEMOTONGAN HARUS DIKETIK, tidak ada tombol pintas "tolak berat".
//      Angka yang dipilih dari daftar cenderung dipilih tanpa dipikir; angka
//      yang harus diketik memaksa pemilik menimbang beratnya sekali lagi.
//   2. AKIBATNYA DITAMPILKAN SEBELUM DIPUTUSKAN. Pemilik melihat kredit
//      sekarang dan kredit sesudahnya, termasuk peringatan bila putusan itu
//      akan menjatuhkan akun di bawah ambang penghapusan.
// ─────────────────────────────────────────────────────────────────────────────

const AMBANG = { bahaya: 80, hapus: 70 }

// Cerminan PLATFORM_SOSIAL di server. Host dibaca dari hasil parse URL, bukan
// dengan `includes` — "instagram.com.jahat.id" mengandung "instagram.com".
const HOST_PLATFORM: Record<string, string[]> = {
  linkedin: ['linkedin.com'],
  facebook: ['facebook.com', 'fb.com', 'm.facebook.com'],
  instagram: ['instagram.com'],
}

function platformSosial(url: string): string | null {
  let host: string
  try { host = new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
  for (const [id, daftar] of Object.entries(HOST_PLATFORM)) {
    if (daftar.some((h) => host === h || host.endsWith('.' + h))) return id
  }
  return null
}

export function TinjauConnect() {
  const { account } = useStore()
  const [ajuan, setAjuan] = useState<any[]>([])
  const [laporan, setLaporan] = useState<any[]>([])
  const [poin, setPoin] = useState<Record<string, number | undefined>>({})
  const [alasanTolak, setAlasanTolak] = useState<Record<string, string>>({})
  const [galat, setGalat] = useState('')
  const [muat, setMuat] = useState(true)

  const segarkan = useCallback(async () => {
    if (!backendEnabled) { setMuat(false); return }
    try {
      const r = await api.connectTinjau()
      setAjuan(r.ajuan ?? []); setLaporan(r.laporan ?? []); setGalat('')
    } catch (e) {
      setGalat((e as Error)?.message === 'forbidden'
        ? 'Halaman ini hanya untuk pemilik.'
        : 'Gagal memuat antrean.')
    } finally { setMuat(false) }
  }, [])

  useEffect(() => { void segarkan() }, [segarkan])

  async function putusVerifikasi(email: string, setuju: boolean) {
    try {
      await api.connectPutusVerifikasi(email, setuju, alasanTolak[email])
      await segarkan()
    } catch { setGalat('Gagal menyimpan putusan.') }
  }

  async function putusLaporan(id: string, terlapor: string) {
    const p = poin[id] ?? 0
    try {
      await api.connectPutusLaporan(id, p)
      await segarkan()
    } catch { setGalat('Gagal menyimpan putusan.') }
    void terlapor
  }

  if (!account) return null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <SectionTitle icon={<IconShield />} title="Tinjauan Connect"
        subtitle="Verifikasi akun dan putusan atas laporan — hanya pemilik" />

      {galat && <Card className="!border-rose-500/30 !bg-rose-500/5"><p className="text-[12px] text-rose-400">{galat}</p></Card>}
      {muat && <Card><p className="text-[13px] text-slate-400">Memuat…</p></Card>}

      {/* Ajuan verifikasi */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
          Ajuan verifikasi ({ajuan.length})
        </div>
        {ajuan.length === 0 && !muat && (
          <p className="mt-2 text-[12px] text-slate-400">Tidak ada ajuan menunggu.</p>
        )}
        <div className="mt-2 space-y-2">
          {ajuan.map((a) => (
            <div key={a.email} className="rounded-xl bg-white/5 p-3">
              <div className="text-[13px] font-black text-white">{a.data.nama}, {a.data.umur}</div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
                <span>Pekerjaan: {a.data.pekerjaan}</span>
                <span>Status: {a.data.status}</span>
                <span>Pendidikan: {a.data.pendidikanTerakhir}</span>
                <span>Lahir: {a.data.tempatLahir}, {a.data.tanggalLahir}</span>
                <span className="col-span-2">Tinggal: {a.data.tempatTinggal}</span>
                <span className="col-span-2">Telepon: ••••••••{a.data.teleponAkhir} · tidak diverifikasi</span>
              </div>

              {/* Yang dipakai memutuskan: selfie berpose vs foto media sosial. */}
              <div className="mt-2 rounded-lg bg-black/20 p-2">
                <div className="text-[10px] font-black uppercase text-slate-400">Bukti identitas</div>
                <a href={a.data.selfieUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-1 block text-[11px] font-bold text-brand underline">Buka selfie berpose (jari huruf P) →</a>
                {(a.data.sosialMedia ?? []).map((s: string) => {
                  const p = platformSosial(s)
                  return (
                    <a key={s} href={s} target="_blank" rel="noopener noreferrer"
                      className="mt-1 flex items-baseline gap-1.5 text-[11px] text-sky-400 underline">
                      {/* Platform diberi label agar tautan yang host-nya tidak sesuai
                          langsung terlihat, tanpa perlu membaca URL panjangnya. */}
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase no-underline ${
                        p ? 'bg-sky-500/15 text-sky-300' : 'bg-rose-500/15 text-rose-300'}`}>
                        {p ?? 'tidak dikenal'}
                      </span>
                      <span className="truncate">{s}</span>
                    </a>
                  )
                })}
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  Cocokkan wajah di selfie dengan foto di akun media sosialnya. Perhatikan juga
                  riwayat unggahan dan tanggal bergabung — akun yang baru dibuat kemarin tidak
                  membuktikan apa pun.
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-amber-400/80">
                  Nomor telepon tidak dibuktikan lewat kode SMS — ia hanya diketik pemohon. Jadi
                  nomor itu bukan bukti identitas, dan sistem hanya memastikan nomor yang sama
                  tidak dipakai dua akun. Penahan akun ganda yang sebenarnya adalah penilaian Anda
                  di halaman ini.
                </p>
              </div>

              <input className={`${inputClass} mt-2`} placeholder="Alasan bila ditolak (dilihat pengguna)"
                value={alasanTolak[a.email] ?? ''} aria-label={`Alasan tolak ${a.data.nama}`}
                onChange={(e) => setAlasanTolak((s) => ({ ...s, [a.email]: e.target.value }))} />
              <div className="mt-2 flex gap-2">
                <Button onClick={() => void putusVerifikasi(a.email, true)}>Setujui</Button>
                <button onClick={() => void putusVerifikasi(a.email, false)}
                  className="rounded-xl bg-white/5 px-3 py-2 text-[12px] font-bold text-rose-400">Tolak</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Laporan */}
      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
          Laporan menunggu ({laporan.length})
        </div>
        {laporan.length === 0 && !muat && (
          <p className="mt-2 text-[12px] text-slate-400">Tidak ada laporan menunggu.</p>
        )}
        <div className="mt-2 space-y-2">
          {laporan.map((l) => {
            const p = poin[l.id] ?? 0
            return (
              <div key={l.id} className="rounded-xl bg-white/5 p-3">
                <div className="text-[12px] font-bold text-white">{l.alasan}</div>
                {l.catatan && <p className="mt-0.5 text-[11px] text-slate-400">{l.catatan}</p>}
                <div className="mt-1 text-[10px] text-slate-500">
                  Dilaporkan: {l.terlaporEmail} · oleh {l.pelaporEmail} · {l.pada.slice(0, 10)}
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="w-28">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Poin dipotong</div>
                    <KolomAngka nilai={poin[l.id]} onNilai={(n) => setPoin((s) => ({ ...s, [l.id]: n }))}
                      ariaLabel={`Poin untuk laporan ${l.id}`} />
                  </div>
                  <Button onClick={() => void putusLaporan(l.id, l.terlaporEmail)}>
                    {p > 0 ? `Potong ${p}` : 'Tolak laporan'}
                  </Button>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  Poin 0 berarti laporan ditolak tanpa hukuman. Pemotongan yang membawa kredit ke
                  bawah {AMBANG.hapus} menjadwalkan penghapusan akun dalam tujuh hari.
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Setiap putusan tercatat di log audit beserta email pemilik yang memutuskannya. Kredit yang
          terlanjur dipotong bisa dipulihkan, dan pemulihan yang membawa kredit kembali ke atas
          {' '}{AMBANG.hapus} otomatis membatalkan jadwal penghapusan.
        </p>
      </Card>
    </div>
  )
}

export default TinjauConnect
