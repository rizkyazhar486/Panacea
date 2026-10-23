import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Portal } from '../Portal'
import { NAV_UNTUK_PENGATURAN } from '../../data/navPengaturan'
import { ambilTersembunyi } from '../../lib/fiturTersembunyi'
import { api, backendEnabled } from '../../lib/api'
import type { Role } from '../../lib/types'
import { siapkanIndeks, cari as cariIsi, NAMA_JENIS, type Hasil } from '../../lib/mesinCari'

// ─────────────────────────────────────────────────────────────────────────────
// Pencarian global — satu kotak untuk fitur, orang dan tagar.
//
// Aplikasi ini sudah melewati 200 fitur. Menemukan sesuatu lewat menu menuntut
// pengguna menebak lebih dulu ada di grup mana — "Peregangan" itu Fitness atau
// Longevity? "Kalkulator Klinis" itu Calculators atau Clinical & AI? Tebakan
// yang salah berarti membuka dan menutup beberapa grup sebelum menyerah. Kotak
// pencarian menghapus seluruh tebakan itu.
//
// Tiga hal dicari sekaligus karena ketiganya adalah cara orang benar-benar
// mencari di aplikasi seperti ini: nama fitur, nama orang, dan tagar.
//
// Dua keputusan yang menentukan mutunya:
//
//   1. KATALOG FITUR DIMUAT SAAT DIBUKA, bukan saat aplikasi dimuat. Katalog
//      hub berisi ratusan entri; menariknya ke bundel awal akan memperlambat
//      pembukaan pertama demi fitur yang belum tentu dipakai.
//   2. FITUR YANG DISEMBUNYIKAN PENGGUNA TIDAK MUNCUL. Kalau tidak, "sembunyikan"
//      hanya berarti pindah tempat — dan hasil pencarian adalah tempat paling
//      mudah untuk membocorkannya kembali.
// ─────────────────────────────────────────────────────────────────────────────

interface HasilFeatures { to: string; label: string; grup: string; kw?: string }

interface HasilOrang { id: string; name: string; role: Role; picture?: string }

/** Skor kecocokan: awalan kata lebih tinggi daripada sekadar mengandung. */
function skor(teks: string, q: string): number {
  const t = teks.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t)) return 60
  if (t.includes(q)) return 30
  return 0
}

export function PencarianGlobal({ buka, tutup }: { buka: boolean; tutup: () => void }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [katalog, setKatalog] = useState<HasilFeatures[] | null>(null)
  const [orang, setOrang] = useState<HasilOrang[]>([])
  const [tagar, setHashtags] = useState<{ tag: string; jumlah: number }[]>([])
  const [sorot, setSorot] = useState(0)
  /* Hasil dari indeks ISI aplikasi: penyakit, obat, kalkulator, stasiun OSCE.
     Sebelum ini isi itu hanya dapat dicari dengan BERPINDAH ke halaman
     pencarian tersendiri — dan berpindah halaman untuk mencari berarti
     kehilangan tempat yang sedang dibaca. Satu kotak, tanpa pindah halaman. */
  const [isi, setIsi] = useState<Hasil[]>([])
  const [jumlahIndeks, setJumlahIndeks] = useState(0)
  const kotak = useRef<HTMLInputElement>(null)

  // Indeks isi dibangun saat kotak DIBUKA, bukan saat aplikasi dimuat: berkas
  // penyakit, tatalaksana, dan arsip OSCE besar, dan menariknya ke bundel awal
  // memperlambat pembukaan pertama bagi semua orang demi satu kotak.
  useEffect(() => {
    if (!buka) return
    let batal = false
    void siapkanIndeks().then((n) => { if (!batal) setJumlahIndeks(n) })
    return () => { batal = true }
  }, [buka])

  useEffect(() => {
    const t = q.trim()
    if (!buka || t.length < 2) { setIsi([]); return }
    setIsi(cariIsi(t, 12))
  }, [q, buka, jumlahIndeks])

  // Katalog dimuat sekali, saat pertama dibuka.
  useEffect(() => {
    if (!buka || katalog) return
    let batal = false
    void (async () => {
      const tersembunyi = new Set(ambilTersembunyi())
      const peta = new Map<string, HasilFeatures>()
      for (const n of NAV_UNTUK_PENGATURAN) {
        if (tersembunyi.has(n.to)) continue
        peta.set(n.to, { to: n.to, label: n.label.replace(/^[^\p{L}\p{N}]+/u, '').trim(), grup: n.group })
      }
      try {
        const [f, w, c] = await Promise.all([
          import('../../pages/fitness/FitnessHub'), import('../../pages/wellness/WellnessHub'), import('../../pages/clinical/ClinicalHub'),
        ])
        const tambah = (grup: string, arr: { to: string; name: string; kw?: string }[]) => {
          for (const t of arr) {
            if (tersembunyi.has(t.to)) continue
            // Label hub lebih deskriptif daripada label menu, jadi ia menang.
            peta.set(t.to, { to: t.to, label: t.name, grup, kw: t.kw })
          }
        }
        for (const g of f.GROUPS) tambah('Fitness', g.tools)
        for (const g of w.GROUPS) tambah('Longevity', g.feats)
        for (const g of c.GROUPS) tambah('Clinical & AI', g.tools)
      } catch { /* katalog hub gagal dimuat — nav saja sudah berguna */ }
      if (!batal) setKatalog([...peta.values()])
    })()
    return () => { batal = true }
  }, [buka, katalog])

  useEffect(() => { if (buka) setTimeout(() => kotak.current?.focus(), 50) }, [buka])
  useEffect(() => { setSorot(0) }, [q])

  // People: dari server, ditunda agar tiap ketukan tidak jadi satu permintaan.
  useEffect(() => {
    const t = q.trim()
    if (!buka || !backendEnabled || t.length < 2) { setOrang([]); return }
    const id = setTimeout(() => {
      void api.cariOrang(t).then((r) => setOrang(r)).catch(() => setOrang([]))
    }, 250)
    return () => clearTimeout(id)
  }, [q, buka])

  // Hashtags: dihitung dari kiriman yang memang sudah boleh dilihat pengguna ini.
  useEffect(() => {
    const t = q.trim().replace(/^#/, '')
    if (!buka || !backendEnabled || t.length < 1) { setHashtags([]); return }
    const id = setTimeout(() => {
      void api.posts().then((posts) => {
        const hitung = new Map<string, number>()
        for (const p of posts) {
          const teks = `${(p as { caption?: string }).caption ?? ''} ${(p as { activity?: string }).activity ?? ''}`
          for (const m of teks.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)) {
            const tag = m[1].toLowerCase()
            hitung.set(tag, (hitung.get(tag) ?? 0) + 1)
          }
        }
        setHashtags([...hitung.entries()]
          .filter(([tag]) => tag.includes(t.toLowerCase()))
          .sort((a, b) => b[1] - a[1]).slice(0, 6)
          .map(([tag, jumlah]) => ({ tag, jumlah })))
      }).catch(() => setHashtags([]))
    }, 300)
    return () => clearTimeout(id)
  }, [q, buka])

  const fitur = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t || !katalog) return []
    return katalog
      .map((f) => ({ f, s: Math.max(skor(f.label, t), skor(f.grup, t) * 0.4, f.kw ? skor(f.kw, t) * 0.7 : 0) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.f)
  }, [q, katalog])

  const aksi = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    const list: { id: string; label: string; desc: string; ikon: string; eksekusi: () => void }[] = []
    if ('logout'.includes(t) || 'keluar'.includes(t) || 'sign out'.includes(t)) {
      list.push({
        id: 'aksi-logout',
        label: 'Keluar dari Akun (Log Out)',
        desc: 'Akhiri sesi aktif Anda di perangkat ini',
        ikon: '🚪',
        eksekusi: () => {
          tutup()
          window.dispatchEvent(new Event('panacea:logout'))
        },
      })
    }
    if ('settings'.includes(t) || 'pengaturan'.includes(t) || 'profil'.includes(t) || 'akun'.includes(t)) {
      list.push({
        id: 'aksi-settings',
        label: 'Pengaturan Akun & Profil',
        desc: 'Kelola preferensi akun, sandi, dan data klinis',
        ikon: '⚙️',
        eksekusi: () => {
          tutup()
          nav('/settings')
        },
      })
    }
    return list
  }, [q, tutup, nav])

  const semua = useMemo(() => [
    ...aksi.map((a) => ({ jenis: 'aksi' as const, kunci: a.id, ke: '', a })),
    ...fitur.map((f) => ({ jenis: 'fitur' as const, kunci: f.to, ke: f.to, f, a: undefined })),
    ...orang.map((o) => ({ jenis: 'orang' as const, kunci: 'u' + o.id, ke: `/jelajah?orang=${encodeURIComponent(o.name)}`, o, a: undefined })),
    ...tagar.map((h) => ({ jenis: 'tagar' as const, kunci: 't' + h.tag, ke: `/jelajah?tag=${h.tag}`, h, a: undefined })),
    ...isi.map((x, i) => ({ jenis: 'isi' as const, kunci: `i${i}-${x.ke}`, ke: x.ke, x, a: undefined })),
  ], [aksi, fitur, orang, tagar, isi])

  const pergi = useCallback((ke: string) => { tutup(); setQ(''); nav(ke) }, [nav, tutup])

  const padaTombol = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { tutup(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSorot((i) => Math.min(i + 1, semua.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSorot((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && semua[sorot]) {
      e.preventDefault()
      const item = semua[sorot]
      if (item.jenis === 'aksi' && item.a) {
        item.a.eksekusi()
      } else {
        pergi(item.ke)
      }
    }
  }

  if (!buka) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 backdrop-blur-md p-3 pt-12 sm:pt-20"
        onClick={tutup} role="dialog" aria-modal="true" aria-label="Search">
        <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-black/10 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-[#0c1017]/95"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3.5 dark:border-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00BF63" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              ref={kotak}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Cari fitur, penyakit, obat, skor klinis, #tagar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={padaTombol}
              aria-label="Search features, diseases, drugs, people, or hashtags"
            />
            <div className="flex items-center gap-2">
              <kbd className="hidden rounded-md border border-black/10 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 sm:inline-block dark:border-white/10 dark:bg-white/10 dark:text-slate-400">Esc</kbd>
              <button
                type="button"
                onClick={tutup}
                aria-label="Close search"
                className="grid h-7 w-7 place-items-center rounded-full text-sm font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-[55vh] flex-1 overflow-y-auto p-3">
            {!q.trim() && (
              <div className="py-2">
                <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Kategori Populer
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Klinis & Diagnosis', icon: '🩺', q: 'diagnosis' },
                    { label: 'Katalog Obat', icon: '💊', q: 'obat' },
                    { label: 'Anatomi 3D', icon: '🫀', q: 'anatomi' },
                    { label: 'Kalkulator Medis', icon: '⚡', q: 'kalkulator' },
                  ].map((chip) => (
                    <button
                      key={chip.q}
                      type="button"
                      onClick={() => setQ(chip.q)}
                      className="flex items-center gap-1.5 rounded-xl border border-black/5 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-500/40 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 border-t border-black/5 pt-3 dark:border-white/10">
                  <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Akses Cepat Fitur Utama
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { to: '/chatbot', label: 'Ask Panacea AI Co-Physician', desc: 'AI Chatbot, Anamnesis & Konsultasi', icon: '💬' },
                      { to: '/tubuh', label: 'Canonical Body Explorer', desc: 'Penjelajah Anatomi 3D & Organ Fisiologis', icon: '🫀' },
                      { to: '/kalkulator', label: 'NEWS2 & Kalkulator Klinis', desc: 'Skor Triase & Stratifikasi Risiko Pasien', icon: '⚡' },
                    ].map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => pergi(item.to)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-100/70 dark:hover:bg-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.icon}</span>
                          <div>
                            <div className="text-[13px] font-bold text-slate-900 dark:text-white">{item.label}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Buka →</span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  Ketik nama fitur, penyakit, obat, stasiun OSCE, profil orang, atau #tagar.
                  {jumlahIndeks > 0 && <span className="block mt-0.5">{jumlahIndeks.toLocaleString('id-ID')} indeks aktif terhubung.</span>}
                </p>
              </div>
            )}

            {q.trim() && semua.length === 0 && (
              <p className="px-3 py-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
                Tidak ada hasil yang cocok dengan "{q}".
              </p>
            )}

            {aksi.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-rose-500 dark:text-rose-400">Tindakan Perintah</div>
                {aksi.map((a) => (
                  <button
                    key={a.id}
                    onClick={a.eksekusi}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                      semua[sorot]?.kunci === a.id
                        ? 'bg-rose-50 ring-1 ring-rose-500/40 dark:bg-rose-500/25 dark:ring-rose-500/50'
                        : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{a.ikon}</span>
                      <div>
                        <div className="text-[13px] font-bold text-slate-900 dark:text-white">{a.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{a.desc}</div>
                      </div>
                    </div>
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">Enter ↵</span>
                  </button>
                ))}
              </div>
            )}

            {fitur.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Fitur & Alat</div>
                {fitur.map((f) => (
                  <button
                    key={f.to}
                    onClick={() => pergi(f.to)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                      semua[sorot]?.kunci === f.to
                        ? 'bg-emerald-50 ring-1 ring-emerald-500/30 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-500/40'
                        : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-900 dark:text-white">{f.label}</span>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">{f.grup}</span>
                  </button>
                ))}
              </div>
            )}

            {orang.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Orang</div>
                {orang.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => pergi(`/jelajah?orang=${encodeURIComponent(o.name)}`)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                      semua[sorot]?.kunci === 'u' + o.id
                        ? 'bg-emerald-50 ring-1 ring-emerald-500/30 dark:bg-emerald-950/40 dark:ring-emerald-500/40'
                        : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                    }`}
                  >
                    {o.picture
                      ? <img src={o.picture} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                      : <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {o.name.slice(0, 1).toUpperCase()}
                        </span>}
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-900 dark:text-white">{o.name}</span>
                    <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{o.role}</span>
                  </button>
                ))}
              </div>
            )}

            {tagar.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Hashtags</div>
                {tagar.map((h) => (
                  <button
                    key={h.tag}
                    onClick={() => pergi(`/jelajah?tag=${h.tag}`)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                      semua[sorot]?.kunci === 't' + h.tag
                        ? 'bg-emerald-50 ring-1 ring-emerald-500/30 dark:bg-emerald-950/40 dark:ring-emerald-500/40'
                        : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-emerald-700 dark:text-emerald-400">#{h.tag}</span>
                    <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">{h.jumlah} posts</span>
                  </button>
                ))}
              </div>
            )}

            {isi.length > 0 && (() => {
              const perJenis = new Map<string, Hasil[]>()
              for (const h of isi) {
                const a = perJenis.get(h.jenis)
                if (a) a.push(h)
                else perJenis.set(h.jenis, [h])
              }
              return [...perJenis.entries()].map(([jenis, daftar]) => (
                <div key={jenis} className="mb-2">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {NAMA_JENIS[jenis as keyof typeof NAMA_JENIS]}
                  </div>
                  {daftar.map((h) => {
                    const kunci = `i${isi.indexOf(h)}-${h.ke}`
                    return (
                      <button
                        key={kunci}
                        onClick={() => pergi(h.ke)}
                        className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition ${
                          semua[sorot]?.kunci === kunci
                            ? 'bg-emerald-50 ring-1 ring-emerald-500/30 dark:bg-emerald-950/40 dark:ring-emerald-500/40'
                            : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="w-full truncate text-[13px] font-bold text-slate-900 dark:text-white">{h.judul}</span>
                        <span className="w-full truncate text-[11px] text-slate-500 dark:text-slate-400">{h.ringkas}</span>
                      </button>
                    )
                  })}
                </div>
              ))
            })()}
          </div>

          {/* Footer Bar: Keyboard shortcuts & index count */}
          <div className="hidden sm:flex items-center justify-between border-t border-black/5 bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold text-slate-400 dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-500">
            <div className="flex items-center gap-3">
              <span><kbd className="rounded border border-black/10 bg-white px-1.5 py-0.5 text-[9px] shadow-2xs dark:border-white/10 dark:bg-white/10">↑</kbd> <kbd className="rounded border border-black/10 bg-white px-1.5 py-0.5 text-[9px] shadow-2xs dark:border-white/10 dark:bg-white/10">↓</kbd> Navigasi</span>
              <span><kbd className="rounded border border-black/10 bg-white px-1.5 py-0.5 text-[9px] shadow-2xs dark:border-white/10 dark:bg-white/10">↵</kbd> Buka</span>
              <span><kbd className="rounded border border-black/10 bg-white px-1.5 py-0.5 text-[9px] shadow-2xs dark:border-white/10 dark:bg-white/10">Esc</kbd> Tutup</span>
            </div>
            {jumlahIndeks > 0 && <span>{jumlahIndeks.toLocaleString('id-ID')} data</span>}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default PencarianGlobal
