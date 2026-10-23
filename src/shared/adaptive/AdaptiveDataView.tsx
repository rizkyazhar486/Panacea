import { type ReactNode } from 'react'
import { useAdaptive } from './useAdaptive'
import { AdaptivePagination, type AdaptivePaginationProps } from './AdaptivePagination'

export interface ColumnDef<T> {
  header: ReactNode
  render: (item: T, index: number) => ReactNode
  className?: string
  headerClassName?: string
  width?: string
}

export interface AdaptiveDataViewProps<T> {
  data: T[]
  keyExtractor: (item: T, index: number) => string | number
  /** Definisi kolom untuk tampilan Desktop Table */
  columns: ColumnDef<T>[]
  /** Render fungsi kartu untuk tampilan Mobile Stacked Cards */
  renderCard: (item: T, index: number) => ReactNode
  /** Konfigurasi pagination adaptif (opsional) */
  pagination?: Omit<AdaptivePaginationProps, 'className'>
  /** Status sedang memuat */
  isLoading?: boolean
  /** Komponen kustom saat data kosong */
  emptyState?: ReactNode
  /** Komponen kustom saat loading */
  loadingState?: ReactNode
  /** Kelas kontainer luar */
  className?: string
  /** Judul tabel (aksesibilitas) */
  ariaLabel?: string
}

export function AdaptiveDataView<T>({
  data,
  keyExtractor,
  columns,
  renderCard,
  pagination,
  isLoading = false,
  emptyState,
  loadingState,
  className = '',
  ariaLabel = 'Tabel Data Klinis',
}: AdaptiveDataViewProps<T>) {
  const { isDesktop } = useAdaptive()

  // ── LOADING STATE ──────────────────────────────────────────────────
  if (isLoading) {
    if (loadingState) return <>{loadingState}</>
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12 text-neutral-400">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-brand dark:border-neutral-700 dark:border-t-emerald-400" />
        <span className="text-xs font-semibold">Memuat data klinis…</span>
      </div>
    )
  }

  // ── EMPTY STATE ────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    if (emptyState) return <>{emptyState}</>
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 p-8 text-center text-neutral-400 dark:border-white/10">
        <span className="text-2xl mb-1">📋</span>
        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Belum ada data tersedia</span>
        <span className="text-[11px] text-neutral-400 mt-0.5">Data yang baru ditambahkan akan muncul di sini.</span>
      </div>
    )
  }

  // ── DESKTOP VIEW: TABEL TABULAR LENGKAP ────────────────────────────
  if (isDesktop) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs dark:border-white/10 dark:bg-neutral-900 ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label={ariaLabel}>
            <thead className="border-b border-black/5 bg-neutral-50/80 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:border-white/10 dark:bg-neutral-800/50 dark:text-neutral-400">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-4 py-3.5 ${col.headerClassName ?? ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-white/[0.02]"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-4 py-3 text-neutral-700 dark:text-neutral-200 ${col.className ?? ''}`}
                    >
                      {col.render(item, rowIdx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && <AdaptivePagination {...pagination} />}
      </div>
    )
  }

  // ── MOBILE VIEW: KARTU BERTUMPUK (STACKED CARDS) ──────────────────
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-2.5">
        {data.map((item, idx) => (
          <div key={keyExtractor(item, idx)} className="w-full">
            {renderCard(item, idx)}
          </div>
        ))}
      </div>

      {pagination && <AdaptivePagination {...pagination} />}
    </div>
  )
}
