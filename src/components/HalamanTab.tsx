import { Suspense, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SectionTitle } from './ui'
import { RangkaDaftar } from './Rangka'
import '../styles/metal.css'

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
  judul, subjudul, ikon, tabs, ringkasan, kaki, theme, tabLayout = 'scroll', featuredTabIds = [],
}: {
  judul: string
  subjudul: string
  ikon: React.ReactNode
  tabs: TabDef[]
  /**
   * 'metal' mewarnai keping tab aktif dengan gaya Fitness/Training (lihat
   * styles/metal.css) — opt-in per halaman, jadi Body Hub yang juga memakai
   * komponen ini tidak ikut berubah kecuali dimintai.
   */
  theme?: 'metal'
  /** Compact mode keeps the daily destinations visible and moves the long tail
   * behind one progressive-disclosure control. Default remains the historical
   * horizontal rail so existing pages do not change. */
  tabLayout?: 'scroll' | 'compact'
  featuredTabIds?: string[]
  /**
   * Panel angka yang berlaku untuk SELURUH tab, ditampilkan di atasnya.
   *
   * Tanpa ini halaman bertab bergantung sepenuhnya pada tab pertama. Diukur di
   * peramban: /tubuh hanya 42 kata dan nyaris kosong, karena tab pertamanya
   * kebetulan yang paling jarang berisi data — padahal berat, nadi, dan tensi
   * pemakainya tersimpan dan bisa langsung ditampilkan. Halaman yang terbuka
   * kosong mengajarkan orang bahwa halaman itu memang kosong.
   */
  ringkasan?: React.ReactNode
  /**
   * Ditempel di bawah isi tab, di dalam alur yang sama.
   *
   * Ada supaya halaman pemanggil tidak perlu menempelkan blok sendiri di luar
   * rangka ini. Diukur di peramban: /latihan menempelkan tautannya sebagai
   * saudara sekandung lalu menariknya naik dengan `-mt-20` untuk memakan
   * `pb-24` di sini — hasilnya blok 358×80 px yang menindih isi tab. Slot ini
   * menghapus sebab masalahnya, bukan menambal jaraknya.
   */
  kaki?: React.ReactNode
}) {
  const lokasi = useLocation()
  const navigate = useNavigate()

  const dariUrl = useMemo(() => {
    const q = new URLSearchParams(lokasi.search).get('t')
    return q && tabs.some((x) => x.id === q) ? q : tabs[0].id
  }, [lokasi.search, tabs])

  const [aktif, setAktif] = useState(dariUrl)
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => { setAktif(dariUrl) }, [dariUrl])

  const pilih = (id: string) => {
    setAktif(id)
    // `replace` supaya berpindah antar tab tidak menumpuk riwayat browser:
    // menekan "kembali" seharusnya keluar dari halaman, bukan menelusuri
    // setiap tab yang pernah disentuh.
    navigate(`${lokasi.pathname}?t=${id}`, { replace: true })
    setMoreOpen(false)
  }

  const tab = tabs.find((x) => x.id === aktif) ?? tabs[0]
  const Isi = tab.komponen

  const compactPrimary = useMemo(() => {
    if (tabLayout !== 'compact') return tabs
    const wanted = featuredTabIds.length
      ? featuredTabIds.map((id) => tabs.find((candidate) => candidate.id === id)).filter((candidate): candidate is TabDef => Boolean(candidate))
      : tabs.slice(0, 5)
    if (!wanted.some((candidate) => candidate.id === aktif)) {
      const current = tabs.find((candidate) => candidate.id === aktif)
      if (current) return [...wanted, current].slice(0, 6)
    }
    return wanted.slice(0, 6)
  }, [aktif, featuredTabIds, tabLayout, tabs])

  const compactSecondary = useMemo(
    () => tabLayout === 'compact'
      ? tabs.filter((candidate) => !compactPrimary.some((primary) => primary.id === candidate.id))
      : [],
    [compactPrimary, tabLayout, tabs],
  )

  const renderTab = (t: TabDef, compact = false) => (
    <button
      key={t.id}
      type="button"
      onClick={() => pilih(t.id)}
      aria-current={t.id === aktif ? 'page' : undefined}
      className={`${compact ? 'halaman-tab-choice halaman-tab-choice--compact' : 'halaman-tab-choice'} flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition ${
        t.id === aktif
          ? theme === 'metal' ? 'metal-tag metal-gold !text-[12px] normal-case tracking-normal' : 'bg-brand text-ink'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-300'
      }`}
    >
      <span className="halaman-tab-emoji text-[13px]" aria-hidden>{t.emoji}</span>
      <span className="halaman-tab-label">{t.label}</span>
    </button>
  )

  return (
    <div className="halaman-tab-root space-y-6 pb-24" data-tab-layout={tabLayout}>
      <SectionTitle icon={ikon} title={judul} subtitle={tab.ringkas ?? subjudul} />

      {ringkasan}

      {tabLayout === 'compact' ? (
        <div className="halaman-tab-compact">
          <div className="halaman-tab-primary" aria-label="Primary tools">
            {compactPrimary.map((t) => renderTab(t, true))}
          </div>
          {compactSecondary.length > 0 && (
            <details
              className="halaman-tab-more"
              open={moreOpen}
              onToggle={(event) => setMoreOpen((event.currentTarget as HTMLDetailsElement).open)}
            >
              <summary>
                <span>More tools</span>
                <span aria-hidden>{moreOpen ? '−' : '+'}</span>
              </summary>
              <div className="halaman-tab-more-grid">
                {compactSecondary.map((t) => renderTab(t, true))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="halaman-tab-rail no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {tabs.map((t) => renderTab(t))}
        </div>
      )}

      {/* key memaksa pemasangan ulang saat tab berganti, sehingga setiap halaman
          menjalankan efek pemuatan datanya sendiri seperti saat dibuka langsung. */}
      {/* Rangka, bukan tulisan satu baris: tab yang dimuat malas menggantikan
          satu baris dengan isi setinggi ribuan piksel, dan lompatannya membuat
          keping tab di atasnya bergeser tepat saat jari menuju ke sana. */}
      <Suspense fallback={<RangkaDaftar jumlah={3} />}>
        <div key={tab.id}><Isi /></div>
      </Suspense>

      {kaki}
    </div>
  )
}

export default HalamanTab
