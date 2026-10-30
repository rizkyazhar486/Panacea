import { useState, useRef, useEffect, useId, type ReactNode, type KeyboardEvent } from 'react'

export interface SearchableSelectOption<T extends string | number = string> {
  value: T
  label: string
  icon?: ReactNode
  hint?: string
}

export interface SearchableSelectProps<T extends string | number = string> {
  id?: string
  name?: string
  value: T
  onChange: (value: T) => void
  options: SearchableSelectOption<T>[] | readonly SearchableSelectOption<T>[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  triggerClassName?: string
  disabled?: boolean
  'aria-label'?: string
}

export function SearchableSelect<T extends string | number = string>({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  searchPlaceholder = 'Cari...',
  className = '',
  triggerClassName = '',
  disabled = false,
  'aria-label': ariaLabel,
}: SearchableSelectProps<T>) {
  const [buka, setBuka] = useState(false)
  const [kataKunci, setKataKunci] = useState('')
  const [fokusIndeks, setFokusIndeks] = useState(0)

  const wadahRef = useRef<HTMLDivElement>(null)
  const inputCariRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const defaultId = useId()
  const componentId = id || defaultId

  // Saring opsi berdasarkan kata kunci
  const opsiTersaring = options.filter((item) => {
    const kueri = kataKunci.trim().toLowerCase()
    if (!kueri) return true
    return (
      item.label.toLowerCase().includes(kueri) ||
      String(item.value).toLowerCase().includes(kueri) ||
      (item.hint && item.hint.toLowerCase().includes(kueri))
    )
  })

  // Temukan opsi terpilih saat ini
  const opsiTerpilih = options.find((item) => item.value === value)

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wadahRef.current && !wadahRef.current.contains(event.target as Node)) {
        setBuka(false)
      }
    }
    if (buka) {
      document.addEventListener('mousedown', handleClickOutside)
      // Fokus ke input pencarian otomatis saat terbuka
      setTimeout(() => inputCariRef.current?.focus(), 50)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [buka])

  // Reset kata kunci & fokus saat dropdown ditutup
  useEffect(() => {
    if (!buka) {
      setKataKunci('')
      setFokusIndeks(0)
    }
  }, [buka])

  // Navigasi keyboard
  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return

    if (!buka) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setBuka(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setBuka(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFokusIndeks((prev) => (prev < opsiTersaring.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFokusIndeks((prev) => (prev > 0 ? prev - 1 : Math.max(0, opsiTersaring.length - 1)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const aktif = opsiTersaring[fokusIndeks]
      if (aktif) {
        onChange(aktif.value)
        setBuka(false)
      }
    }
  }

  return (
    <div ref={wadahRef} className={`relative min-w-0 ${className}`}>
      {name && <input type="hidden" name={name} value={String(value)} />}

      {/* Trigger Button */}
      <button
        id={componentId}
        type="button"
        disabled={disabled}
        onClick={() => setBuka((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={buka}
        aria-label={ariaLabel || (opsiTerpilih ? opsiTerpilih.label : placeholder)}
        className={`flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-[12px] font-bold text-ink shadow-sm transition hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-emerald-400/40 dark:focus:ring-emerald-400/20 ${triggerClassName}`}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {opsiTerpilih?.icon && <span className="shrink-0">{opsiTerpilih.icon}</span>}
          <span className="truncate">
            {opsiTerpilih ? opsiTerpilih.label : <span className="font-normal text-neutral-400">{placeholder}</span>}
          </span>
        </span>
        <span
          className={`shrink-0 text-[10px] text-neutral-400 transition-transform duration-200 ${
            buka ? 'rotate-180 text-brand dark:text-emerald-400' : ''
          }`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {/* Dropdown Floating Panel */}
      {buka && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[200px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-neutral-900/95">
          {/* Kolom Pencarian */}
          <div className="relative mb-1 px-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">
              🔍
            </span>
            <input
              ref={inputCariRef}
              type="text"
              value={kataKunci}
              onChange={(e) => {
                setKataKunci(e.target.value)
                setFokusIndeks(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 pl-7 pr-7 text-[11px] font-semibold text-ink placeholder:text-neutral-400 focus:border-brand focus:bg-white focus:outline-none dark:border-white/10 dark:bg-neutral-800 dark:text-white dark:focus:border-emerald-400 dark:focus:bg-neutral-800"
            />
            {kataKunci && (
              <button
                type="button"
                onClick={() => setKataKunci('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 hover:text-ink dark:hover:text-white"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* Daftar Opsi */}
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-56 overflow-y-auto overscroll-contain py-1 text-xs"
          >
            {opsiTersaring.length === 0 ? (
              <li className="px-3 py-4 text-center text-[11px] font-medium text-neutral-400">
                Tidak ada opsi cocok "{kataKunci}"
              </li>
            ) : (
              opsiTersaring.map((item, idx) => {
                const terpilih = item.value === value
                const fokus = idx === fokusIndeks

                return (
                  <li
                    key={String(item.value)}
                    role="option"
                    aria-selected={terpilih}
                    onClick={() => {
                      onChange(item.value)
                      setBuka(false)
                    }}
                    onMouseEnter={() => setFokusIndeks(idx)}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                      terpilih
                        ? 'bg-brand/10 text-brand-dark dark:bg-emerald-950/60 dark:text-emerald-300'
                        : fokus
                        ? 'bg-neutral-100 text-ink dark:bg-white/10 dark:text-white'
                        : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      <span className="truncate">{item.label}</span>
                      {item.hint && (
                        <span className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500">
                          {item.hint}
                        </span>
                      )}
                    </span>
                    {terpilih && (
                      <span className="shrink-0 font-bold text-brand dark:text-emerald-400" aria-hidden>
                        ✓
                      </span>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
