import { useRef, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Badge, Button, Field, inputClass } from '../components/ui'
import { IconStore, IconUpload, IconToken, IconBook, IconShield, IconCheck } from '../components/icons'
import { verifyMaterial } from '../lib/ai'
import { ButtonGroup } from '../components/Carousel'
import { downloadWatermarkedPdf } from '../lib/pdf'
import type { Material, MaterialCategory, ExamTrack, FileType } from '../lib/types'

const EXAMS: (ExamTrack | 'Semua')[] = ['Semua', 'USMLE', 'UKMPPD', 'Umum']
const CATS: (MaterialCategory | 'Semua')[] = ['Semua', 'Catatan', 'Materi', 'Jurnal', 'Artikel']

function fileTypeFromName(name: string): FileType {
  const n = name.toLowerCase()
  if (n.endsWith('.pdf')) return 'PDF'
  if (n.endsWith('.ppt') || n.endsWith('.pptx')) return 'PowerPoint'
  return 'Word'
}

function downloadOwned(m: Material, buyerId: string) {
  const meta = `Kategori: ${m.category} · ${m.exam} · ${m.specialty} · Penulis: ${m.authorName}`
  const body =
    `${m.description}\n\n` +
    `Materi ini telah diverifikasi AI Claude & verifikator spesialis (${m.verifierReview?.verifierRole ?? 'Spesialis'}).\n` +
    `Berkas asli: ${m.fileName} (${m.fileType}).\n\n` +
    `Dokumen berlisensi untuk pembeli dengan ID di bawah ini. Setiap halaman diberi watermark ID pembeli; ` +
    `penyalinan atau penyebaran ulang tanpa izin dapat ditindak.`
  downloadWatermarkedPdf({ title: m.title, meta, body, buyerId })
}

export function Marketplace() {
  const { state, account, buyMaterial, uploadMaterial, setMaterialAIReview, buyLongevitySub, setAuthorSubPrice, subscribeAuthor } = useStore()
  const buyerId = account?.email ?? 'guest@panaceamed.id'
  const subActive = (authorEmail: string) => {
    const exp = state.authorSubs[authorEmail]
    return !!exp && new Date(exp) > new Date()
  }
  const [exam, setExam] = useState<(typeof EXAMS)[number]>('Semua')
  const [cat, setCat] = useState<(typeof CATS)[number]>('Semua')
  const [toast, setToast] = useState('')

  const listed = state.materials.filter(
    (m) =>
      m.status === 'verified' &&
      (exam === 'Semua' || m.exam === exam) &&
      (cat === 'Semua' || m.category === cat),
  )

  function notify(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  function buy(m: Material) {
    const res = buyMaterial(m.id)
    notify(res.ok ? `Berhasil membeli “${m.title}”.` : res.reason ?? 'Gagal.')
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* AI Longevity subscription */}
      {(() => {
        const active = !!state.longevitySubExpires && new Date(state.longevitySubExpires) > new Date()
        const daysLeft = state.longevitySubExpires ? Math.max(0, Math.ceil((new Date(state.longevitySubExpires).getTime() - Date.now()) / 86400000)) : 0
        return (
          <Card className="!p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <IconShield size={20} />
                  <h3 className="text-lg font-extrabold">Langganan AI Longevity</h3>
                  {active && <Badge tone="neutral">Aktif · {daysLeft} hari</Badge>}
                </div>
                <p className="mt-1 max-w-lg text-sm text-white/85">
                  Buka Nilai Longevity bertenaga AI di menu Nutrisi & Kalori. Berlaku 30 hari, perpanjang tiap bulan.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold">Rp49.000<span className="text-sm font-medium text-white/70">/30 hari</span></div>
                <Button variant="outline" className="mt-1 border-white !text-white hover:!bg-white/15" onClick={() => { buyLongevitySub(); notify(active ? 'Langganan AI Longevity diperpanjang 30 hari.' : 'Langganan AI Longevity aktif 30 hari.') }}>
                  {active ? 'Perpanjang' : 'Langganan Sekarang'}
                </Button>
              </div>
            </div>
          </Card>
        )
      })()}

      <Card>
        <SectionTitle
          icon={<IconStore size={20} />}
          title="Pusat Referensi Medis"
          subtitle="Temukan, pelajari, dan bagikan referensi medis pilihan dari para kontributor terverifikasi. Setiap dokumen dilindungi watermark untuk keamanan dan keaslian."
          right={
            <span className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm font-bold text-white">
              <IconToken size={16} className="text-brand" /> {state.wallet.balance} PNC
            </span>
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonGroup value={exam} options={EXAMS.map((e) => ({ id: e, label: e }))} onChange={setExam} />
          <ButtonGroup value={cat} options={CATS.map((c) => ({ id: c, label: c }))} onChange={setCat} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listed.map((m) => {
          const subbed = subActive(m.authorId)
          const owned = state.ownedMaterialIds.includes(m.id) || subbed
          const subPrice = state.authorSubPrices[m.authorId] ?? 0
          return (
            <Card key={m.id} hover className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <Badge tone="brand">{m.exam}</Badge>
                <Badge tone="neutral">{m.category}</Badge>
                <span className="ml-auto rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                  {m.fileType}
                </span>
              </div>
              <h3 className="font-bold leading-tight">{m.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-neutral-500">{m.description}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
                <IconShield size={13} className="text-brand" />
                Terverifikasi AI + {m.verifierReview?.verifierRole ?? 'Spesialis'} · {m.specialty}
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                oleh {m.authorName} · ★ {m.rating || '—'} · {m.downloads}× diunduh
                {subbed && <span className="ml-1 font-semibold text-brand-dark">· langganan aktif</span>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                <span>
                  <span className="flex items-center gap-1 text-lg font-extrabold">
                    <IconToken size={16} className="text-brand" />
                    {m.priceTokens}
                    <span className="text-xs font-medium text-neutral-400">PNC</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Penulis terima {Math.max(0, m.priceTokens - 5)} · biaya platform 5 PNC
                  </span>
                </span>
                {owned ? (
                  <Button variant="outline" onClick={() => downloadOwned(m, buyerId)}>
                    <IconCheck size={14} /> Unduh PDF
                  </Button>
                ) : (
                  <Button onClick={() => buy(m)}>Beli {m.priceTokens} PNC</Button>
                )}
              </div>
              {!owned && subPrice > 0 && m.authorId !== buyerId && (
                <button
                  onClick={() => { const r = subscribeAuthor(m.authorId); notify(r.ok ? `Berlangganan ${m.authorName} — akses semua materinya 30 hari.` : r.reason ?? 'Gagal.') }}
                  className="mt-2 w-full rounded-xl border border-brand bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-dark hover:bg-brand-100"
                >
                  Langganan penulis · {subPrice} PNC/bln
                </button>
              )}
            </Card>
          )
        })}
        {listed.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3 text-center text-sm text-neutral-400">
            Tidak ada materi pada filter ini.
          </Card>
        )}
      </div>

      <UploadPanel
        onUpload={async (m) => {
          uploadMaterial(m)
          notify('Materi diunggah — menjalankan verifikasi AI Claude…')
          const review = await verifyMaterial(state.settings, m)
          setMaterialAIReview(m.id, review)
          notify(
            review.verdict === 'approved'
              ? 'Lolos verifikasi AI ✓ — menunggu verifikator spesialis.'
              : 'AI meminta revisi. Lihat tab Verifikasi.',
          )
        }}
        authorId={buyerId}
        authorName={account?.name ?? 'Saya'}
        subPrice={state.authorSubPrices[buyerId] ?? 0}
        onSubPrice={(p) => setAuthorSubPrice(buyerId, p)}
      />
    </div>
  )
}

function UploadPanel({
  onUpload,
  authorId,
  authorName,
  subPrice,
  onSubPrice,
}: {
  onUpload: (m: Material) => void
  authorId: string
  authorName: string
  subPrice: number
  onSubPrice: (price: number) => void
}) {
  const [f, setF] = useState({
    title: '',
    description: '',
    category: 'Catatan' as MaterialCategory,
    exam: 'UKMPPD' as ExamTrack,
    specialty: '',
    price: 5,
    fileName: '',
    fileType: 'PDF' as FileType,
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!f.title.trim() || !f.fileName) return
    setBusy(true)
    const m: Material = {
      id: uid(),
      title: f.title.trim(),
      description: f.description.trim() || 'Tanpa deskripsi.',
      category: f.category,
      exam: f.exam,
      specialty: f.specialty.trim() || 'Umum',
      authorId,
      authorName,
      fileType: f.fileType,
      fileName: f.fileName,
      priceTokens: Number(f.price) || 0,
      status: 'pending-ai',
      createdAt: new Date().toISOString(),
      downloads: 0,
      rating: 0,
    }
    await onUpload(m)
    setF({ ...f, title: '', description: '', specialty: '', fileName: '' })
    setBusy(false)
  }

  return (
    <Card>
      <SectionTitle
        icon={<IconUpload size={18} />}
        title="Bagikan & Verifikasi Referensi Medis"
        subtitle="Kontributor dapat membagikan materi medis untuk ditinjau oleh AI dan verifikator spesialis sebelum dipublikasikan."
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Judul">
          <input className={inputClass} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="mis. Ringkasan Tatalaksana DKA" />
        </Field>
        <Field label="Spesialti / Topik">
          <input className={inputClass} value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })} placeholder="mis. Endokrinologi" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Deskripsi">
            <textarea className={inputClass} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
        </div>
        <Field label="Kategori">
          <select className={inputClass} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as MaterialCategory })}>
            {(['Catatan', 'Materi', 'Jurnal', 'Artikel'] as MaterialCategory[]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Jalur Ujian">
          <select className={inputClass} value={f.exam} onChange={(e) => setF({ ...f, exam: e.target.value as ExamTrack })}>
            {(['USMLE', 'UKMPPD', 'Umum'] as ExamTrack[]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Harga beli satuan (PNC)">
          <input className={inputClass} type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} />
        </Field>
        <Field label="Harga langganan penulis (PNC/bln · 0 = nonaktif)">
          <input className={inputClass} type="number" min={0} value={subPrice} onChange={(e) => onSubPrice(Number(e.target.value))} />
        </Field>
        <Field label="Berkas (.docx / .pdf / .pptx)">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".doc,.docx,.pdf,.ppt,.pptx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setF((s) => ({ ...s, fileName: file.name, fileType: fileTypeFromName(file.name) }))
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <IconUpload size={14} /> Pilih Berkas
            </Button>
            <span className="truncate text-sm text-neutral-500">{f.fileName || 'Belum ada berkas'}</span>
          </div>
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} disabled={busy || !f.title.trim() || !f.fileName}>
          <IconBook size={16} /> {busy ? 'Mengunggah & verifikasi AI…' : 'Unggah & Verifikasi'}
        </Button>
        <p className="text-xs text-neutral-400">
          Mengunggah sebagai <b>{authorName}</b>. Pendapatan royalti masuk ke saldo PNC Anda setelah
          terjual.
        </p>
      </div>
    </Card>
  )
}
