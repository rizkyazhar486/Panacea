import { type ReactNode } from 'react'
import { useAdaptive } from './useAdaptive'

export interface AdaptiveSplitViewProps<T> {
  items: T[]
  selectedItem: T | null
  onSelectItem: (item: T | null) => void
  renderMasterItem: (item: T, isSelected: boolean) => ReactNode
  renderDetail: (item: T) => ReactNode
  renderEmptyDetail?: () => ReactNode
  keyExtractor: (item: T) => string | number
  masterTitle?: string
  masterWidth?: string
  className?: string
}

export function AdaptiveSplitView<T>({
  items,
  selectedItem,
  onSelectItem,
  renderMasterItem,
  renderDetail,
  renderEmptyDetail,
  keyExtractor,
  masterTitle = 'Daftar',
  masterWidth = 'w-80 lg:w-96',
  className = '',
}: AdaptiveSplitViewProps<T>) {
  const { isDesktop } = useAdaptive()

  // ── DESKTOP: Dual-Pane Split View (Berdampingan) ───────────────────
  if (isDesktop) {
    return (
      <div className={`flex h-[calc(100vh-140px)] min-h-[500px] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xs dark:border-white/10 dark:bg-neutral-900 ${className}`}>
        {/* Panel Kiri: Master List */}
        <div className={`flex ${masterWidth} shrink-0 flex-col border-r border-black/5 bg-neutral-50/50 dark:border-white/10 dark:bg-neutral-900/50`}>
          {masterTitle && (
            <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                {masterTitle} ({items.length})
              </h4>
            </div>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-black/5 p-2 dark:divide-white/5">
            {items.map((item) => {
              const isSelected = selectedItem ? keyExtractor(selectedItem) === keyExtractor(item) : false
              return (
                <div
                  key={keyExtractor(item)}
                  onClick={() => onSelectItem(item)}
                  className={`cursor-pointer rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-brand/10 ring-1 ring-brand/40 dark:bg-brand/15'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {renderMasterItem(item, isSelected)}
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel Kanan: Detail View */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedItem ? (
            renderDetail(selectedItem)
          ) : renderEmptyDetail ? (
            renderEmptyDetail()
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-neutral-400">
              <span className="text-3xl mb-2">👈</span>
              <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                Pilih salah satu item di panel kiri
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Rincian klinis dan riwayat medis akan ditampilkan di sini.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── MOBILE: Drill-down Navigation (Tumpukan Halaman) ───────────────
  if (selectedItem) {
    // Mode Detail: Ada tombol ‹ Kembali ke daftar
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <button
          type="button"
          onClick={() => onSelectItem(null)}
          className="flex min-h-[40px] items-center gap-1.5 self-start rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-700 shadow-xs dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
        >
          <span>‹</span>
          <span>Kembali ke {masterTitle}</span>
        </button>

        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          {renderDetail(selectedItem)}
        </div>
      </div>
    )
  }

  // Mode Master: Daftar penuh
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {items.map((item) => (
        <div
          key={keyExtractor(item)}
          onClick={() => onSelectItem(item)}
          className="cursor-pointer transition active:scale-98"
        >
          {renderMasterItem(item, false)}
        </div>
      ))}
    </div>
  )
}
