import { useEffect, useRef, useState } from 'react'
import { JENIS_LAB, periksaMasukanLab, tambahLab } from '../lib/lab'
import { uraikanLembarLab, type KandidatLab } from '../lib/imporLab'

const hariIni = () => { const d = new Date(); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

// Tempel teks ATAU foto lembar hasil lab → kandidat → centang → simpan. Foto
// melewati OCR di perangkat (src/lib/ocrLembarLab.ts) lalu masuk ke PARSER TEKS
// YANG SAMA di bawah — tidak ada jalur terpisah yang mempercayai OCR lebih dari
// tempel-teks. Tidak ada angka yang tersimpan tanpa dicentang pengguna; satuan
// berbeda tidak bisa dicentang.
export function ImporLembarLab() {
  const [teks, setTeks] = useState('')
  const [tanggal, setTanggal] = useState(hariIni)
  const [kandidat, setKandidat] = useState<KandidatLab[] | null>(null)
  const [pilih, setPilih] = useState<Record<string, boolean>>({})
  const [pesan, setPesan] = useState<string | null>(null)
  const [membacaFoto, setMembacaFoto] = useState(false)
  const inputFoto = useRef<HTMLInputElement>(null)

  useEffect(() => () => { void import('../lib/ocrLembarLab').then((m) => m.tutupWorkerOcrLab()) }, [])

  const uraiTeks = (sumber: string) => {
    const k = uraikanLembarLab(sumber)
    setKandidat(k)
    setPilih(Object.fromEntries(k.map((x) => [x.jenisId, false])))
    setPesan(k.length ? null : 'No known tests found. Check the text, or add results one by one.')
  }
  const urai = () => uraiTeks(teks)

  const bacaFoto = async (berkas: File) => {
    setMembacaFoto(true)
    setPesan(null)
    try {
      const { bacaFotoLab } = await import('../lib/ocrLembarLab')
      const h = await bacaFotoLab(berkas)
      if (!h.ok) { setPesan(h.alasan ?? 'Could not read the photo.'); return }
      setTeks(h.teks)
      uraiTeks(h.teks)
    } finally {
      setMembacaFoto(false)
      if (inputFoto.current) inputFoto.current.value = ''
    }
  }
  const simpan = () => {
    if (!kandidat) return
    const dipilih = kandidat.filter((k) => pilih[k.jenisId] && !k.masalah)
    if (!dipilih.length) { setPesan('Tick the results that match your report.'); return }
    const gagal: string[] = []
    for (const k of dipilih) {
      const jenis = JENIS_LAB.find((j) => j.id === k.jenisId)!
      const h = periksaMasukanLab(jenis, String(k.nilai), tanggal, hariIni())
      if (!h.ok) { gagal.push(`${k.nama}: ${h.alasan}`); continue }
      tambahLab(k.jenisId, tanggal, h.nilai, { bawah: k.rujukanBawah, atas: k.rujukanAtas })
    }
    setPesan(gagal.length ? `Saved ${dipilih.length - gagal.length}; not saved — ${gagal.join(' · ')}` : `Saved ${dipilih.length} result${dipilih.length > 1 ? 's' : ''} for ${tanggal}.`)
    if (!gagal.length) { setKandidat(null); setTeks('') }
  }

  return (
    <details className="mt-3 border-t border-neutral-100 pt-2 dark:border-white/10" data-lab-import>
      <summary className="t-kecil cursor-pointer font-bold text-brand">Paste or scan your lab report</summary>
      <div className="mt-2 space-y-1.5">
        <textarea value={teks} onChange={(e) => setTeks(e.target.value)} rows={4} aria-label="Lab report text"
          placeholder="Copy the results table from your lab PDF or portal and paste it here"
          className="t-kecil w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white" />
        <div className="flex items-center gap-1.5">
          <label className="t-mikro shrink-0 text-neutral-500" htmlFor="imp-tgl">Blood taken on</label>
          <input id="imp-tgl" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
            className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2 py-1.5 text-ink dark:border-white/12 dark:text-white" />
          <button type="button" onClick={urai} className="t-kecil shrink-0 rounded-xl bg-brand px-3 py-1.5 font-bold text-white">Read</button>
        </div>
        <div className="flex items-center gap-1.5">
          <input ref={inputFoto} type="file" accept="image/*" capture="environment" data-ocr-photo-input
            className="sr-only" aria-label="Photo of your lab report"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void bacaFoto(f) }} />
          <button type="button" data-ocr-scan-button disabled={membacaFoto} onClick={() => inputFoto.current?.click()}
            className="t-kecil min-h-[44px] w-full rounded-xl border border-dashed border-brand/50 px-3 py-1.5 font-bold text-brand disabled:opacity-60">
            {membacaFoto ? 'Reading photo on this device…' : '📷 Scan a photo of your lab report'}
          </button>
        </div>
        {kandidat && kandidat.length > 0 && (
          <>
            <ul className="divide-y divide-neutral-100 dark:divide-white/10" aria-label="Results found">
              {kandidat.map((k) => (
                <li key={k.jenisId} className="t-kecil flex min-h-[44px] items-center gap-2" data-candidate={k.jenisId} data-problem={k.masalah ?? 'none'}>
                  <input type="checkbox" disabled={!!k.masalah} checked={!!pilih[k.jenisId]} aria-label={`Import ${k.nama}`}
                    onChange={(e) => setPilih((p) => ({ ...p, [k.jenisId]: e.target.checked }))} />
                  <span className="min-w-0 flex-1">
                    <b className="text-ink dark:text-white">{k.nama}</b> {k.nilai} {k.satuanDiLembar ?? ''}
                    {k.rujukanBawah !== undefined && <span className="t-mikro text-neutral-400"> · range {k.rujukanBawah}–{k.rujukanAtas}</span>}
                    {k.masalah === 'satuan-berbeda' && <span className="t-mikro block font-bold text-amber-600 dark:text-amber-300">Unit differs from {JENIS_LAB.find((j) => j.id === k.jenisId)?.satuan} — add it by hand after converting.</span>}
                    {k.masalah === 'satuan-tidak-terbaca' && <span className="t-mikro block font-bold text-amber-600 dark:text-amber-300">Unit not found on this line — add it by hand.</span>}
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={simpan} className="t-kecil min-h-[44px] w-full rounded-xl bg-brand font-bold text-white">Save ticked results</button>
          </>
        )}
        {pesan && <p role="status" className="t-mikro font-bold text-neutral-500">{pesan}</p>}
        <p className="t-mikro text-neutral-400">Text and photos are read on this device only, never uploaded; nothing is saved until you tick it and press Save.</p>
      </div>
    </details>
  )
}

export default ImporLembarLab
