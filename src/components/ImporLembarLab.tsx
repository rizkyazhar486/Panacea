import { useMemo, useRef, useState } from 'react'
import { JENIS_LAB, periksaMasukanLab, tambahLab } from '../lib/lab'
import { PERINTAH_BACA_LEMBAR_LAB, uraikanLembarLab, type KandidatLab } from '../lib/imporLab'
import { api, backendEnabled } from '../lib/api'
import { calculateOcrPhotoAccuracy, ocrMetricPercent } from '../lib/evaluation/ocrPhotoAccuracy'
import { BatasKlaimKesehatan } from './BatasKlaimKesehatan'

const hariIni = () => { const d = new Date(); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

const MAX_GAMBAR_BYTES = 12 * 1024 * 1024

// Tempel teks lembar hasil lab → kandidat → centang → simpan. Tidak ada angka
// yang tersimpan tanpa dicentang pengguna; satuan berbeda tidak bisa dicentang.
// Foto opsional: vision OCR hanya mengisi teks draf; uraian + centang tetap lokal.
export function ImporLembarLab() {
  const [teks, setTeks] = useState('')
  const [tanggal, setTanggal] = useState(hariIni)
  const [kandidat, setKandidat] = useState<KandidatLab[] | null>(null)
  const [pilih, setPilih] = useState<Record<string, boolean>>({})
  const [pesan, setPesan] = useState<string | null>(null)
  const [bacaFoto, setBacaFoto] = useState(false)
  const [teksOcrMentah, setTeksOcrMentah] = useState('')
  const [groundTruthOcr, setGroundTruthOcr] = useState('')
  const fotoRef = useRef<HTMLInputElement>(null)

  const auditOcr = useMemo(
    () => teksOcrMentah && groundTruthOcr.trim()
      ? calculateOcrPhotoAccuracy(teksOcrMentah, groundTruthOcr)
      : null,
    [groundTruthOcr, teksOcrMentah],
  )

  const uraiDari = (sumber: string) => {
    const k = uraikanLembarLab(sumber)
    setKandidat(k)
    setPilih(Object.fromEntries(k.map((x) => [x.jenisId, false])))
    setPesan(k.length ? null : 'No known tests found. Check the text, or add results one by one.')
  }
  const urai = () => uraiDari(teks)
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

  async function bacaGambar(file?: File) {
    if (!file) return
    if (!backendEnabled) {
      setPesan('Reading a photo needs the signed-in server. Paste the table text instead, or enter results one by one.')
      return
    }
    if (file.size > MAX_GAMBAR_BYTES) {
      setPesan(`Image too large (${(file.size / 1048576).toFixed(0)} MB, max 12 MB). Crop to the results table and try again.`)
      return
    }
    const gambar = /^image\//.test(file.type) || /\.(jpe?g|png|webp|heic)$/i.test(file.name)
    if (!gambar) {
      setPesan('Choose a photo or screenshot of the lab results table (.jpg, .png, .webp).')
      return
    }
    setBacaFoto(true)
    setTeksOcrMentah('')
    setGroundTruthOcr('')
    setPesan('Reading photo…')
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res(String(fr.result))
        fr.onerror = () => rej(new Error('read_failed'))
        fr.readAsDataURL(file)
      })
      let teksBaca = ''
      try {
        const r = await api.aiVision(dataUrl, PERINTAH_BACA_LEMBAR_LAB)
        teksBaca = (r.text ?? '').trim()
      } catch (e) {
        const msg = String((e as Error)?.message ?? '')
        throw new Error(/503|not_configured/.test(msg) ? 'ai_not_configured' : 'ai_failed')
      }
      if (!teksBaca) {
        setPesan('No text could be read from that photo. Crop to the results table, or paste the text instead.')
        return
      }
      setTeksOcrMentah(teksBaca)
      setTeks(teksBaca)
      uraiDari(teksBaca)
      setPesan('Draft from photo — review every line, tick only what matches your report, then Save. Nothing is stored until you confirm.')
    } catch (e) {
      const m = (e as Error)?.message
      setPesan(m === 'ai_not_configured'
        ? 'Photo reading needs AI on the server, which is not enabled. Paste the table text instead.'
        : m === 'ai_failed'
          ? 'Could not read that photo. Try again, or paste the table text instead.'
          : 'Failed to read the photo.')
    } finally {
      setBacaFoto(false)
      if (fotoRef.current) fotoRef.current.value = ''
    }
  }

  return (
    <details className="mt-3 border-t border-neutral-100 pt-2 dark:border-white/10" data-lab-import>
      <summary className="t-kecil cursor-pointer font-bold text-brand">Paste from your lab report</summary>
      <div className="mt-2 space-y-1.5">
        <BatasKlaimKesehatan permukaan="lab.import-draft" />
        <textarea value={teks} onChange={(e) => setTeks(e.target.value)} rows={4} aria-label="Lab report text"
          placeholder="Copy the results table from your lab PDF or portal and paste it here"
          className="t-kecil w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white" />
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="t-mikro shrink-0 text-neutral-500" htmlFor="imp-tgl">Blood taken on</label>
          <input id="imp-tgl" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
            className="t-kecil min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2 py-1.5 text-ink dark:border-white/12 dark:text-white" />
          <button type="button" onClick={urai} className="t-kecil shrink-0 rounded-xl bg-brand px-3 py-1.5 font-bold text-white">Read</button>
          <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp,image/*,.jpg,.jpeg,.png,.webp" className="hidden" data-lab-photo-input
            onChange={(e) => { void bacaGambar(e.target.files?.[0]) }} />
          <button type="button" disabled={bacaFoto} data-lab-photo-button
            onClick={() => fotoRef.current?.click()}
            className="t-kecil shrink-0 rounded-xl border border-neutral-200 px-3 py-1.5 font-bold text-neutral-600 disabled:opacity-50 dark:border-white/12 dark:text-neutral-300">
            {bacaFoto ? 'Reading…' : 'Photo'}
          </button>
        </div>
        {teksOcrMentah && (
          <details className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/12" data-ocr-photo-accuracy>
            <summary className="t-kecil cursor-pointer font-bold text-ink dark:text-white">OCR accuracy audit · original photo</summary>
            <div className="mt-2 space-y-2">
              <p className="t-mikro text-neutral-500">
                For a measured accuracy score, manually transcribe the same photo below as ground truth.
                The reference stays in this browser and is not sent back to the OCR service. Provider confidence is not treated as accuracy.
              </p>
              <textarea
                value={groundTruthOcr}
                onChange={(e) => setGroundTruthOcr(e.target.value)}
                rows={4}
                aria-label="Human verified OCR ground truth"
                placeholder="Human-verified transcription from this exact photo"
                className="t-kecil w-full rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-ink dark:border-white/12 dark:text-white"
              />
              {auditOcr ? (
                <div className="grid gap-2 sm:grid-cols-3" aria-label="OCR accuracy metrics">
                  <div className="rounded-xl border border-neutral-200 p-2 dark:border-white/10">
                    <div className="t-mikro font-bold text-neutral-500">Character accuracy</div>
                    <div className="t-kecil mt-1 font-black text-ink dark:text-white">{ocrMetricPercent(auditOcr.character.accuracy)}%</div>
                    <div className="t-mikro text-neutral-400">CER {ocrMetricPercent(auditOcr.character.errorRate)}% · {auditOcr.character.errors}/{auditOcr.character.referenceCount} edits</div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-2 dark:border-white/10">
                    <div className="t-mikro font-bold text-neutral-500">Word accuracy</div>
                    <div className="t-kecil mt-1 font-black text-ink dark:text-white">{ocrMetricPercent(auditOcr.word.accuracy)}%</div>
                    <div className="t-mikro text-neutral-400">WER {ocrMetricPercent(auditOcr.word.errorRate)}% · {auditOcr.word.errors}/{auditOcr.word.referenceCount} edits</div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-2 dark:border-white/10">
                    <div className="t-mikro font-bold text-neutral-500">Numeric-token accuracy</div>
                    <div className="t-kecil mt-1 font-black text-ink dark:text-white">
                      {auditOcr.numericToken ? `${ocrMetricPercent(auditOcr.numericToken.accuracy)}%` : 'N/A'}
                    </div>
                    <div className="t-mikro text-neutral-400">
                      {auditOcr.numericToken
                        ? `${auditOcr.numericToken.errors}/${auditOcr.numericToken.referenceCount} numeric edits`
                        : 'No numeric tokens in reference'}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="t-mikro font-bold text-neutral-400">Enter the human reference transcription to calculate CER, WER, and numeric-token accuracy.</p>
              )}
              <p className="t-mikro text-neutral-400">
                CER = (substitutions + deletions + insertions) / reference characters; WER uses reference words.
                Displayed accuracy = max(0, 1 − error rate). Numeric-token accuracy is reported separately because digit errors can be clinically important.
              </p>
            </div>
          </details>
        )}
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
        <p className="t-mikro text-neutral-400">Paste stays on this device. A photo is sent to the server only to draft text — crop names or extra PHI first. Nothing is saved until you tick it and press Save. Photo reading is a technical draft, not a clinically validated import.</p>
      </div>
    </details>
  )
}

export default ImporLembarLab
