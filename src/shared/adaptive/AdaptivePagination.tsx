import { useAdaptive } from './useAdaptive'

export interface AdaptivePaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize?: number
  onPageChange: (page: number) => void
  /** Dipanggil saat mode mobile untuk memuat data tambahan */
  onLoadMore?: () => void
  /** Apakah masih ada data berikutnya */
  hasMore?: boolean
  /** Status sedang memuat data tambahan */
  isLoadingMore?: boolean
  className?: string
}

export function AdaptivePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  className = '',
}: AdaptivePaginationProps) {
  const { isDesktop } = useAdaptive()

  // ── DESKTOP: Numbered Pagination Lengkap ─────────────────────────────
  if (isDesktop) {
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize

    // Logika nomor halaman dengan ellipsis
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }

    return (
      <nav
        aria-label="Navigasi Halaman"
        className={`flex items-center justify-between border-t border-black/5 bg-transparent px-4 py-3 text-xs dark:border-white/10 ${className}`}
      >
        <div className="text-neutral-500 dark:text-neutral-400">
          {totalItems ? (
            <span>
              Menampilkan <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{startItem}</strong> –{' '}
              <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{endItem}</strong> dari{' '}
              <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{totalItems}</strong> data
            </span>
          ) : (
            <span>Halaman {currentPage} dari {totalPages}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex h-8 items-center gap-1 rounded-lg border border-black/10 px-2.5 font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Halaman Sebelumnya"
          >
            ‹ Prev
          </button>

          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="grid h-8 w-8 place-items-center text-neutral-400">
                  …
                </span>
              )
            }
            const isCur = p === currentPage
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                aria-current={isCur ? 'page' : undefined}
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition ${
                  isCur
                    ? 'bg-brand text-brand-dark font-extrabold shadow-xs dark:bg-emerald-500 dark:text-neutral-950'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                {p}
              </button>
            )
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="flex h-8 items-center gap-1 rounded-lg border border-black/10 px-2.5 font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Halaman Berikutnya"
          >
            Next ›
          </button>
        </div>
      </nav>
    )
  }

  // ── MOBILE: Tombol "Muat Lebih Banyak" / Progressive Fetching ───────
  if (!hasMore && currentPage >= totalPages) {
    return (
      <div className={`py-4 text-center text-[11px] font-semibold text-neutral-400 ${className}`}>
        ✓ Semua data telah ditampilkan ({totalItems ?? totalPages} data)
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-2 py-4 px-3 ${className}`}>
      <button
        type="button"
        disabled={isLoadingMore}
        onClick={onLoadMore ? onLoadMore : () => onPageChange(currentPage + 1)}
        className="flex min-h-[44px] w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-dark shadow-xs transition active:scale-98 dark:bg-brand/15 dark:text-emerald-400"
      >
        {isLoadingMore ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-dark/20 border-t-brand-dark dark:border-emerald-400/20 dark:border-t-emerald-400" />
            <span>Memuat data berikutnya…</span>
          </>
        ) : (
          <>
            <span>Muat Lebih Banyak</span>
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] dark:bg-white/10">
              Hal. {currentPage + 1}/{totalPages}
            </span>
          </>
        )}
      </button>
    </div>
  )
}
