import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DECISIONS,
  validateReviewInput,
  fetchTaskReview,
  submitReview,
  submitWithdrawal,
  type Decision,
  type HumanReviewEntry,
  type TaskLabel,
  type ReviewRecord,
  TASK_ID_REGEX,
  MAX_TEXT,
} from '../domains/human-review/humanReviewClient'
import { getTaskCatalogItem, KNOWN_TASKS, DEFAULT_CHECKLIST } from '../domains/human-review/humanReviewCatalog'

const DEFAULT_COMMIT_SHA = 'b3b3f510762a6e3f74113e972f057cff85717090'

export function HumanReview() {
  const { taskId: paramTaskId } = useParams<{ taskId?: string }>()
  const navigate = useNavigate()

  // State identitas tugas
  const [taskIdInput, setTaskIdInput] = useState(paramTaskId || 'T-HR-02')
  const activeTaskId = (paramTaskId || taskIdInput).trim().toUpperCase()
  const [versionInput, setVersionInput] = useState(DEFAULT_COMMIT_SHA.slice(0, 8))

  // State data peninjauan dari server
  const [entries, setEntries] = useState<HumanReviewEntry[]>([])
  const [currentLabel, setCurrentLabel] = useState<TaskLabel>({ status: 'none' })
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // State formulir peninjauan (semua default false/kosong)
  const [scope, setScope] = useState<string>('')
  const [checklist, setChecklist] = useState<Array<{ item: string; checked: boolean }>>(
    DEFAULT_CHECKLIST.map((item) => ({ item, checked: false }))
  )
  const [isAttributed, setIsAttributed] = useState<boolean>(true)
  const [reviewerName, setReviewerName] = useState<string>('')
  const [reviewerRole, setReviewerRole] = useState<string>('')
  const [decision, setDecision] = useState<Decision | null>(null)
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false)

  // State aksi pengiriman
  const [saving, setSaving] = useState<boolean>(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Muat metadata tugas dari katalog
  const catalogItem = getTaskCatalogItem(activeTaskId)

  // Sinkronkan rekomendasi lingkup saat tugas berubah jika lingkup masih kosong
  useEffect(() => {
    if (!scope && catalogItem?.scopeRecommendation) {
      setScope(catalogItem.scopeRecommendation)
    }
  }, [activeTaskId, catalogItem?.scopeRecommendation, scope])

  // Muat data review dari API
  const loadReviews = useCallback(async (tId: string, ver: string) => {
    if (!TASK_ID_REGEX.test(tId)) {
      setFetchError('Format Task ID tidak valid. Contoh format yang sah: ENG-F2-01 atau T-HR-02.')
      setLoading(false)
      return
    }

    setLoading(true)
    setFetchError(null)
    const result = await fetchTaskReview(tId, ver)
    if (result.ok && result.data) {
      setEntries(result.data.entries)
      setCurrentLabel(result.data.label)
    } else {
      setFetchError(result.error || 'Gagal memuat catatan review.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadReviews(activeTaskId, versionInput)
  }, [activeTaskId, versionInput, loadReviews])

  const handleChecklistToggle = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitSuccess(null)

    if (!decision) {
      setFormError('Silakan pilih salah satu keputusan (Approve, Request Changes, Defer, atau Not Applicable).')
      return
    }

    if (!termsAccepted) {
      setFormError('Anda wajib menyetujui ketentuan peninjauan sukarela secara eksplisit.')
      return
    }

    const payload = {
      taskId: activeTaskId,
      version: versionInput,
      decision,
      scope,
      reviewer: isAttributed ? { name: reviewerName, role: reviewerRole, attributed: true } : { attributed: false },
      checklist,
      termsAccepted,
    }

    // Validasi lokal sebelum kirim
    const check = validateReviewInput(payload)
    if (!check.valid) {
      setFormError(check.reason)
      return
    }

    setSaving(true)
    const res = await submitReview(payload)
    setSaving(false)

    if (res.ok && res.review) {
      setSubmitSuccess('Review sukarela Anda berhasil dicatat secara append-only.')
      // Muat ulang daftar review terbaru
      loadReviews(activeTaskId, versionInput)
      // Reset isian keputusan dan centang untuk mencegah submit ulang tak sengaja
      setDecision(null)
      setTermsAccepted(false)
    } else {
      setFormError(res.error || 'Pengiriman review gagal.')
    }
  }

  const handleWithdraw = async (reviewId: string) => {
    if (!window.confirm('Tarik review ini? Catatan penarikan akan dicatat secara permanen tanpa menghapus riwayat sebelumnya.')) {
      return
    }
    setSaving(true)
    const res = await submitWithdrawal(reviewId, activeTaskId)
    setSaving(false)
    if (res.ok) {
      setSubmitSuccess('Review berhasil ditarik.')
      loadReviews(activeTaskId, versionInput)
    } else {
      setFormError(res.error || 'Gagal menarik review.')
    }
  }

  const isFormValid =
    decision !== null &&
    termsAccepted === true &&
    scope.trim().length > 0 &&
    (!isAttributed || (reviewerName.trim().length > 0 && reviewerRole.trim().length > 0))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-full overflow-x-hidden font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigasi & Judul */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              T-HR-02 · Optional Human Verification
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Peninjauan Manusia Sukarela
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Antarmuka resmi verifikasi manusia sukarela per{' '}
              <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded text-xs">
                HUMAN_VERIFICATION_OPTIONAL §5
              </code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 transition"
          >
            ← Kembali ke Beranda
          </button>
        </div>

        {/* Banner Prinsip Keamanan & Ketentuan Kritis (§3) */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 text-xs space-y-2 text-slate-300">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Invarian Keamanan Peninjauan
          </div>
          <p>
            Peninjauan ini bersifat <strong>sukarela</strong> dan tidak pernah menjadi syarat wajib untuk kemajuan teknis engineering.
            Review ini <strong>tidak memberikan otoritas klinis, lisensi alat medis, persetujuan hukum, atau izin pasien</strong>.
            Agen AI <strong>dilarang keras membuat atau menandatangani review atas nama manusia</strong> (§3.5).
            Semua riwayat dicatat secara <em>append-only</em>.
          </p>
        </div>

        {/* Pemilih Tugas & Commit SHA */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-select" className="block text-xs font-semibold text-slate-300 mb-1">
              Pilih / Ketik Task ID
            </label>
            <div className="flex gap-2">
              <input
                id="task-select"
                type="text"
                value={taskIdInput}
                onChange={(e) => setTaskIdInput(e.target.value.toUpperCase())}
                placeholder="misal: ENG-D7-02 atau T-HR-02"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => navigate(`/review/${taskIdInput}`)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition"
              >
                Muat
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-500">Tugas Cepat:</span>
              {Object.keys(KNOWN_TASKS).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setTaskIdInput(k)
                    navigate(`/review/${k}`)
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    activeTaskId === k
                      ? 'bg-emerald-800 text-emerald-100 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="version-input" className="block text-xs font-semibold text-slate-300 mb-1">
              Commit SHA / Versi Kode yang Ditinjau
            </label>
            <input
              id="version-input"
              type="text"
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value.toLowerCase())}
              placeholder="7-40 hex SHA"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Review terikat secara permanen pada versi ini. Bila kode pada task ini berubah, status label akan otomatis menjadi <em>stale</em>.
            </p>
          </div>
        </div>

        {/* Kartu Informasi Tugas & Bukti Read-Only */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                {catalogItem.taskId}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 text-xs">
                Jalur: {catalogItem.lane}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 text-xs">
                Horizon: {catalogItem.horizon}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{catalogItem.title}</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{catalogItem.description}</p>
          </div>

          {catalogItem.evidenceLinks?.length > 0 && (
            <div className="border-t border-slate-800/80 pt-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tautan Bukti Terverifikasi (Read-Only)
              </h3>
              <div className="flex flex-wrap gap-2">
                {catalogItem.evidenceLinks.map((link, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <code className="text-emerald-400 font-mono text-[11px]">{link.label}</code>
                    <span className="text-[10px] text-slate-500">({link.href})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kartu Status Label Hasil Review Saat Ini */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Status Peninjauan Saat Ini
          </h3>
          {loading ? (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              Memuat data review dari server...
            </div>
          ) : fetchError ? (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              {fetchError}
            </div>
          ) : (
            <div className="space-y-2">
              {currentLabel.status === 'none' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Belum ada catatan review untuk task ini.
                </div>
              )}
              {currentLabel.status === 'reviewed' && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-300 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Terverifikasi Manusia (Current Version)
                  </div>
                  <p>{currentLabel.text}</p>
                </div>
              )}
              {currentLabel.status === 'stale' && (
                <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Status Usang (Stale Review — Versi Kode Berubah)
                  </div>
                  <p>{currentLabel.text}</p>
                </div>
              )}
              {currentLabel.status === 'anonymous-feedback-only' && (
                <div className="p-3 rounded-lg bg-sky-950/60 border border-sky-800/80 text-sky-200 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-sky-300 mb-1">
                    Masukan Anonim Tercatat ({currentLabel.count} entri)
                  </div>
                  <p>
                    Masukan dicatat sebagai umpan balik anonim. Tidak menghasilkan label atribusi publik per kebijakan §3.2.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formulir Peninjauan Manusia */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
            Kirim Peninjauan Baru untuk {activeTaskId}
          </h2>

          {/* Alert Error Formulir */}
          {formError && (
            <div role="alert" className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
              <strong>Peringatan Validasi:</strong> {formError}
            </div>
          )}

          {/* Alert Sukses */}
          {submitSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs">
              {submitSuccess}
            </div>
          )}

          {/* Lingkup Peninjauan (Scope) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="review-scope" className="text-xs font-semibold text-slate-300">
                Lingkup Peninjauan (Scope) <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[10px] ${scope.length > MAX_TEXT ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                {scope.length} / {MAX_TEXT} karakter
              </span>
            </div>
            <textarea
              id="review-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={3}
              placeholder="Jelaskan secara persis apa yang Anda periksa (misal: keterbacaan teks kontras di layar ponsel 390px)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Peninjauan Anda <em>hanya</em> mencakup apa yang tertulis di sini (§3.3). Jangan mencantumkan data pasien atau nomor rekam medis.
            </p>
          </div>

          {/* Checklist Pengujian (Semua Default Unchecked) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Daftar Uji (Centang hanya apa yang benar-benar Anda uji sendiri; tidak ada centang otomatis)
            </label>
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {checklist.map((item, index) => (
                <label
                  key={index}
                  className="flex items-start gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleChecklistToggle(index)}
                    className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={item.checked ? 'text-emerald-300 font-medium' : 'text-slate-300'}>
                    {item.item}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Atribusi Peninjau */}
          <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-3">
            <span className="block text-xs font-semibold text-slate-300">
              Atribusi Peninjau (§3.2)
            </span>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="attribution-mode"
                  checked={isAttributed}
                  onChange={() => setIsAttributed(true)}
                  className="text-emerald-600"
                />
                <span className="text-slate-300 font-medium">Review Teratribusi (Nama & Peran)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="attribution-mode"
                  checked={!isAttributed}
                  onChange={() => setIsAttributed(false)}
                  className="text-emerald-600"
                />
                <span className="text-slate-300 font-medium">Masukan Anonim</span>
              </label>
            </div>

            {isAttributed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label htmlFor="reviewer-name" className="block text-[11px] text-slate-400 mb-1">
                    Nama Peninjau <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="reviewer-name"
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="misal: Dr. Budi Santoso"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="reviewer-role" className="block text-[11px] text-slate-400 mb-1">
                    Peran / Spesialisasi Peninjau <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="reviewer-role"
                    type="text"
                    value={reviewerRole}
                    onChange={(e) => setReviewerRole(e.target.value)}
                    placeholder="misal: Dokter Spesialis Bedah / QA Engineer"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-sky-400">
                Masukan anonim disimpan sebagai umpan balik internal dan tidak menampilkan nama atau mengangkat label verifikasi publik.
              </p>
            )}
          </div>

          {/* Tombol Keputusan (Approve, Request Changes, Defer, Not Applicable) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Keputusan Peninjauan <span className="text-rose-400">*</span> (Pilih salah satu)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DECISIONS.map((d) => {
                const isSelected = decision === d
                let colorClasses = 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                if (isSelected) {
                  if (d === 'approve') colorClasses = 'border-emerald-500 bg-emerald-950/80 text-emerald-200 font-bold'
                  else if (d === 'request_changes') colorClasses = 'border-amber-500 bg-amber-950/80 text-amber-200 font-bold'
                  else if (d === 'defer') colorClasses = 'border-sky-500 bg-sky-950/80 text-sky-200 font-bold'
                  else colorClasses = 'border-slate-500 bg-slate-800 text-white font-bold'
                }
                const labelText = d === 'approve'
                  ? 'Approve'
                  : d === 'request_changes'
                  ? 'Request Changes'
                  : d === 'defer'
                  ? 'Defer'
                  : 'Not Applicable'

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDecision(d)}
                    className={`px-3 py-2.5 rounded-lg border text-xs text-center transition ${colorClasses}`}
                  >
                    {labelText}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Keterbukaan Ketentuan & Centang Persetujuan Eksplisit */}
          <div className="space-y-3 pt-2">
            <details className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-400">
              <summary className="font-semibold text-slate-300 cursor-pointer select-none">
                Buka Ketentuan Lengkap Peninjauan (§3 HUMAN_VERIFICATION_OPTIONAL)
              </summary>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-[11px] text-slate-400 leading-relaxed">
                <li><strong>Sukarela:</strong> Melewatkan review ini diizinkan dan tidak berdampak pada status engineering.</li>
                <li><strong>Teratribusi / Anonim:</strong> Memerlukan nama dan peran untuk atribusi; tanpa itu dicatat sebagai masukan anonim.</li>
                <li><strong>Terbatas Cakupan:</strong> Hanya membuktikan apa yang tertulis dalam butir checklist yang dicentang.</li>
                <li><strong>Bukan Otoritas:</strong> Bukan lisensi, persetujuan klinis, izin pasien, atau persetujuan hukum.</li>
                <li><strong>Tanpa Centang Otomatis:</strong> Agen AI dilarang keras membuat atau menandatangani review ini.</li>
                <li><strong>Terikat Versi:</strong> Terikat pada SHA commit; usang (stale) bila kode diperbarui.</li>
                <li><strong>Jujur:</strong> Klaim profesional adalah pendapat peninjau, bukan sertifikasi legal Panacea.</li>
                <li><strong>Privasi:</strong> Dilarang memuat NIK, rekam medis, atau data pasien.</li>
                <li><strong>Penarikan:</strong> Peninjau dapat menarik review kapan saja (dicatat append-only).</li>
              </ol>
            </details>

            <label htmlFor="terms-accept" className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
              <input
                id="terms-accept"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span className={termsAccepted ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
                Saya memahami bahwa review ini bersifat sukarela, terbatas pada cakupan di atas, dan bukan merupakan lisensi alat medis, persetujuan hukum, atau validasi klinis formal. <span className="text-rose-400">*</span>
              </span>
            </label>
          </div>

          {/* Tombol Simpan / Aksi */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {!isFormValid && 'Lengkapi keputusan, persetujuan, dan lingkup untuk mengirim'}
            </span>
            <button
              type="submit"
              disabled={!isFormValid || saving}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                isFormValid && !saving
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {saving ? 'Menyimpan...' : 'Kirim Peninjauan Sukarela'}
            </button>
          </div>
        </form>

        {/* Riwayat Peninjauan Permanen (Append-Only Log) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Riwayat Peninjauan Permanen (Append-Only Log)
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Total Entri: {entries.length}
            </span>
          </div>

          {entries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Belum ada riwayat review tersimpan untuk task {activeTaskId}.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                if (entry.type === 'withdrawal') {
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[10px] bg-rose-900 px-1.5 py-0.5 rounded mr-2">
                          Penarikan
                        </span>
                        <span>Menarik review <code className="font-mono text-white">{entry.supersedes}</code></span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono">
                        {entry.createdAt.slice(0, 19).replace('T', ' ')} UTC
                      </span>
                    </div>
                  )
                }

                const isDecisionApprove = entry.decision === 'approve'
                const isDecisionRequest = entry.decision === 'request_changes'

                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            isDecisionApprove
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isDecisionRequest
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {entry.decision.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-white">
                          {entry.reviewer.attributed
                            ? `${entry.reviewer.name} (${entry.reviewer.role})`
                            : 'Masukan Anonim'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          v:{entry.version.slice(0, 7)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {entry.createdAt.slice(0, 19).replace('T', ' ')} UTC
                        </span>
                        {entry.reviewer.attributed && (
                          <button
                            type="button"
                            onClick={() => handleWithdraw(entry.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline"
                          >
                            Tarik
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                      <strong>Cakupan:</strong> {entry.scope}
                    </div>

                    {entry.checklist?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {entry.checklist.map((c, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded ${
                              c.checked
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                                : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {c.checked ? '✓ ' : '— '}{c.item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default HumanReview
