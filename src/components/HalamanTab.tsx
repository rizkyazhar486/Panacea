import { Suspense, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SectionTitle } from './ui'

// ─────────────────────────────────────────────────────────────────────────────
// Rangka halaman bertab.
//
// Fitur sudah terlalu banyak, dan sebagian besar sebenarnya satu topik yang
// terpecah menjadi banyak halaman. Menggabungkannya dengan tab menghilangkan
// perpindahan halaman tanpa membuang satu pun isinya.
//
// Dua keputusan yang membuat penggabungan ini tidak merusak apa pun:
//
//   * Tab memuat KOMPONEN HALAMAN YANG SUDAH ADA apa adanya. Tidak ada isi
//     yang ditulis ulang, jadi tidak ada yang bisa hilang atau menyimpang dari
//     versi aslinya.
//   * Tab aktif tersimpan di query string (?t=). Menyegarkan halaman, membuka
//     tautan yang dibagikan, dan tombol "kembali" semuanya tetap mendarat di
//     tab yang benar — sesuatu yang hilang bila tab hanya disimpan di state.
//
// Halaman lama tetap hidup dan mengalihkan ke sini, sehingga penanda halaman
// dan tautan lama tidak ada yang putus.
// ─────────────────────────────────────────────────────────────────────────────

export interface TabDef {
  id: string
  label: string
  emoji: string
  komponen: ComponentType
  /** Ditampilkan di bawah judul saat tab ini aktif. */
  ringkas?: string
}

export function HalamanTab({
  judul, subjudul, ikon, tabs,
}: {
  judul: string
  subjudul: string
  ikon: React.ReactNode
  tabs: TabDef[]
}) {
  const lokasi = useLocation()
  const navigate = useNavigate()

  const dariUrl = useMemo(() => {
    const q = new URLSearchParams(lokasi.search).get('t')
    return q && tabs.some((x) => x.id === q) ? q : tabs[0].id
  }, [lokasi.search, tabs])

  const [aktif, setAktif] = useState(dariUrl)
  useEffect(() => { setAktif(dariUrl) }, [dariUrl])

  const pilih = (id: string) => {
    setAktif(id)
    // `replace` supaya berpindah antar tab tidak menumpuk riwayat browser:
    // menekan "kembali" seharusnya keluar dari halaman, bukan menelusuri
    // setiap tab yang pernah disentuh.
    navigate(`${lokasi.pathname}?t=${id}`, { replace: true })
  }

  const tab = tabs.find((x) => x.id === aktif) ?? tabs[0]
  const Isi = tab.komponen

  return (
    <div className="space-y-4 pb-24">
      <SectionTitle icon={ikon} title={judul} subtitle={tab.ringkas ?? subjudul} />

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => pilih(t.id)}
            aria-current={t.id === aktif ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold transition ${
              t.id === aktif ? 'bg-brand text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}>
            <span className="text-[13px]">{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      {/* key memaksa pemasangan ulang saat tab berganti, sehingga setiap halaman
          menjalankan efek pemuatan datanya sendiri seperti saat dibuka langsung. */}
      <Suspense fallback={<div className="py-10 text-center text-sm text-slate-500">Memuat…</div>}>
        <div key={tab.id}><Isi /></div>
      </Suspense>
    </div>
  )
}

export default HalamanTab
