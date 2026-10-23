import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { useAdaptive } from './useAdaptive'

export interface AdaptiveFileUploadProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  maxSizeMb?: number
  label?: string
  helperText?: string
  className?: string
}

export function AdaptiveFileUpload({
  onFilesSelected,
  accept = 'image/*,application/pdf',
  maxSizeMb = 15,
  label = 'Unggah Hasil Laboratorium / Berkas Medis',
  helperText = 'Format PDF, JPG, atau PNG (Maks. 15MB)',
  className = '',
}: AdaptiveFileUploadProps) {
  const { isDesktop } = useAdaptive()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const valid: File[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.size <= maxSizeMb * 1024 * 1024) {
        valid.push(file)
      } else {
        alert(`Berkas "${file.name}" melebihi batas ${maxSizeMb}MB.`)
      }
    }
    if (valid.length > 0) onFilesSelected(valid)
  }

  // ── DESKTOP: Drag-and-Drop Upload Area ─────────────────────────────
  if (isDesktop) {
    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(true)
    }
    const onDragLeave = () => setIsDragging(false)
    const onDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    }

    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-brand bg-brand-50/60 dark:bg-emerald-950/20 ring-4 ring-brand/20'
            : 'border-black/15 bg-neutral-50/50 hover:border-brand/60 hover:bg-neutral-50 dark:border-white/15 dark:bg-neutral-900/50 dark:hover:border-emerald-500/60'
        } ${className}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark transition-transform group-hover:scale-110 dark:bg-brand/15 dark:text-emerald-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="mt-3 text-xs font-black text-ink dark:text-white">{label}</p>
        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          Tarik & lepas berkas ke sini, atau <span className="font-bold text-brand dark:text-emerald-400 underline">pilih dari komputer</span>
        </p>
        <span className="mt-2 text-[10px] text-neutral-400">{helperText}</span>
      </div>
    )
  }

  // ── MOBILE: Direct Action (Kamera Langsung vs Galeri Dokumen) ──────
  return (
    <div className={`flex flex-col gap-2 rounded-3xl border border-black/10 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-neutral-900 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />
      {/* Input khusus kamera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
      />

      <div className="text-center pb-1">
        <h5 className="text-xs font-black text-ink dark:text-white">{label}</h5>
        <p className="text-[10px] text-neutral-400">{helperText}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-dark transition active:scale-95 dark:bg-brand/15 dark:text-emerald-400"
        >
          <span>📷</span>
          <span>Foto Kamera</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-neutral-50 px-3 py-2 text-xs font-bold text-neutral-700 transition active:scale-95 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-200"
        >
          <span>📁</span>
          <span>Pilih Galeri/PDF</span>
        </button>
      </div>
    </div>
  )
}
