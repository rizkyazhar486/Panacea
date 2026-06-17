import { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import { IconShield, IconSparkle, IconCheck } from '../components/icons'
import { verifyMaterial } from '../lib/ai'
import type { Material } from '../lib/types'

const statusLabel: Record<Material['status'], { label: string; tone: 'high' | 'normal' | 'brand' | 'critical' }> = {
  'pending-ai': { label: 'Menunggu AI Claude', tone: 'high' },
  'pending-verifier': { label: 'Menunggu Verifikator', tone: 'high' },
  verified: { label: 'Terverifikasi', tone: 'brand' },
  rejected: { label: 'Ditolak', tone: 'critical' },
}

export function Verification() {
  const {
    state,
    currentUser,
    setCurrentUser,
    setMaterialAIReview,
    setMaterialVerifierReview,
  } = useStore()
  const [busyId, setBusyId] = useState('')

  const queue = state.materials.filter((m) => m.status === 'pending-ai' || m.status === 'pending-verifier')
  const canVerify = currentUser.canVerify

  async function runAI(m: Material) {
    setBusyId(m.id)
    const review = await verifyMaterial(state.settings, m)
    setMaterialAIReview(m.id, review)
    setBusyId('')
  }

  return (
    <div className="space-y-6">
      {/* Act-as / role switcher */}
      <Card>
        <SectionTitle
          icon={<IconShield size={20} />}
          title="Pusat Verifikasi"
          subtitle="Dua lapis: AI Claude (akurasi & keamanan) lalu verifikator Spesialis/Subspesialis"
          right={
            <label className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">Bertindak sebagai:</span>
              <select
                value={currentUser.id}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-sm font-semibold"
              >
                {state.contributors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.canVerify ? '(Verifikator)' : ''}
                  </option>
                ))}
              </select>
            </label>
          }
        />
        <div
          className={`rounded-xl px-3 py-2 text-sm ${
            canVerify ? 'bg-brand-50 text-brand-dark' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {canVerify
            ? `Anda ${currentUser.role} ${currentUser.specialty} — berwenang memverifikasi kontributor & materi.`
            : 'Akun Dokter umum tidak dapat menyetujui final. Beralih ke akun Spesialis/Subspesialis untuk memverifikasi.'}
        </div>
      </Card>

      {/* Material verification queue */}
      <Card>
        <SectionTitle title="Antrean Verifikasi Materi" subtitle={`${queue.length} item menunggu`} />
        <div className="space-y-4">
          {queue.length === 0 && <p className="text-sm text-neutral-400">Tidak ada antrean. 🎉</p>}
          {queue.map((m) => (
            <div key={m.id} className="rounded-xl border border-neutral-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="neutral">{m.category}</Badge>
                    <Badge tone="brand">{m.exam}</Badge>
                    <span className="text-xs text-neutral-400">{m.fileType}</span>
                  </div>
                  <h4 className="font-bold">{m.title}</h4>
                  <p className="text-sm text-neutral-500">
                    {m.description} · oleh {m.authorName}
                  </p>
                </div>
                <Badge tone={statusLabel[m.status].tone}>{statusLabel[m.status].label}</Badge>
              </div>

              {/* AI review */}
              <div className="mt-3 rounded-lg bg-neutral-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  <IconSparkle size={13} /> Verifikasi AI Claude
                </div>
                {m.aiReview ? (
                  <div className="text-sm">
                    <span className="font-bold">
                      {m.aiReview.verdict === 'approved' ? '✓ Disetujui AI' : '⚠ Perlu revisi'} · Skor{' '}
                      {m.aiReview.score}/100
                    </span>
                    <p className="mt-1 text-neutral-600">{m.aiReview.notes}</p>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => runAI(m)} disabled={busyId === m.id}>
                    <IconSparkle size={14} /> {busyId === m.id ? 'Memeriksa…' : 'Jalankan Verifikasi AI'}
                  </Button>
                )}
              </div>

              {/* Verifier action */}
              {m.status === 'pending-verifier' && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    disabled={!canVerify}
                    onClick={() =>
                      setMaterialVerifierReview(m.id, {
                        verifierName: currentUser.name,
                        verifierRole: currentUser.role === 'Subspesialis' ? 'Subspesialis' : 'Spesialis',
                        approved: true,
                        notes: 'Konten valid & layak edukasi.',
                        at: new Date().toISOString(),
                      })
                    }
                  >
                    <IconCheck size={14} /> Setujui & Terbitkan
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!canVerify}
                    onClick={() =>
                      setMaterialVerifierReview(m.id, {
                        verifierName: currentUser.name,
                        verifierRole: currentUser.role === 'Subspesialis' ? 'Subspesialis' : 'Spesialis',
                        approved: false,
                        notes: 'Perlu perbaikan sebelum diterbitkan.',
                        at: new Date().toISOString(),
                      })
                    }
                  >
                    Tolak
                  </Button>
                  {!canVerify && (
                    <span className="text-xs text-amber-600">
                      Hanya verifikator Spesialis/Subspesialis yang dapat menyetujui.
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Contributor roster */}
      <Card>
        <SectionTitle title="Kontributor & Verifikator" subtitle="Penulis harus terverifikasi sebelum materinya tampil" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="pb-2 pr-4 font-semibold">Nama</th>
                <th className="pb-2 pr-4 font-semibold">Peran</th>
                <th className="pb-2 pr-4 font-semibold">Spesialti</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.contributors.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={c.canVerify ? 'brand' : 'neutral'}>{c.role}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-500">{c.specialty}</td>
                  <td className="py-2.5">
                    {c.verified ? (
                      <span className="flex items-center gap-1 text-brand-dark">
                        <IconCheck size={14} /> Terverifikasi
                      </span>
                    ) : (
                      <span className="text-amber-600">Menunggu verifikasi</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
