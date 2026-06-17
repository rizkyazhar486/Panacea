import { Link } from 'react-router-dom'
import { useStore, PLATFORM_FEE } from '../lib/store'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import { IconBook, IconToken, IconUpload, IconShield, IconSparkle } from '../components/icons'
import type { Material, MaterialStatus } from '../lib/types'

const statusMeta: Record<MaterialStatus, { label: string; tone: 'high' | 'brand' | 'critical' }> = {
  'pending-ai': { label: 'Menunggu AI Claude', tone: 'high' },
  'pending-verifier': { label: 'Menunggu Verifikator', tone: 'high' },
  verified: { label: 'Terbit', tone: 'brand' },
  rejected: { label: 'Ditolak', tone: 'critical' },
}

function royalty(m: Material): number {
  return Math.round(m.priceTokens * (1 - PLATFORM_FEE)) * m.downloads
}

export function MyMaterials() {
  const { state, currentUser, setCurrentUser } = useStore()
  const mine = state.materials.filter((m) => m.authorId === currentUser.id)
  const totalEarn = mine.reduce((a, m) => a + royalty(m), 0)
  const totalDl = mine.reduce((a, m) => a + m.downloads, 0)
  const live = mine.filter((m) => m.status === 'verified').length

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconBook size={20} />}
          title="Materi Saya — Dasbor Kontributor"
          subtitle={`${currentUser.name} · ${currentUser.role} ${currentUser.specialty}`}
          right={
            <label className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500">Akun:</span>
              <select
                value={currentUser.id}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-sm font-semibold"
              >
                {state.contributors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          }
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Total Materi" value={`${mine.length}`} />
          <Stat label="Terbit" value={`${live}`} />
          <Stat label="Total Unduhan" value={`${totalDl}`} />
          <Stat
            label="Royalti Diperoleh"
            value={`${totalEarn} PNC`}
            accent
            sub={`setelah fee platform ${PLATFORM_FEE * 100}%`}
          />
        </div>
        {!currentUser.verified && (
          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            ⚠ Akun kontributor Anda belum diverifikasi verifikator. Materi baru tetap melalui pipeline,
            namun penerbitan menunggu verifikasi kontributor.
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle
          title="Daftar Materi & Pipeline Verifikasi"
          right={
            <Link to="/marketplace">
              <Button variant="outline">
                <IconUpload size={14} /> Unggah Materi
              </Button>
            </Link>
          }
        />
        <div className="space-y-3">
          {mine.length === 0 && (
            <p className="text-sm text-neutral-400">
              Belum ada materi. Unggah catatan/materi Anda dari halaman Marketplace.
            </p>
          )}
          {mine.map((m) => (
            <div key={m.id} className="rounded-xl border border-neutral-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="neutral">{m.category}</Badge>
                    <Badge tone="brand">{m.exam}</Badge>
                    <span className="text-xs text-neutral-400">{m.fileType}</span>
                  </div>
                  <h4 className="font-bold">{m.title}</h4>
                  <p className="text-xs text-neutral-500">{m.specialty}</p>
                </div>
                <div className="text-right">
                  <Badge tone={statusMeta[m.status].tone}>{statusMeta[m.status].label}</Badge>
                  <div className="mt-1 flex items-center justify-end gap-1 text-sm font-bold">
                    <IconToken size={14} className="text-brand" /> {m.priceTokens} PNC
                  </div>
                </div>
              </div>

              {/* Pipeline */}
              <div className="mt-3 flex items-center gap-1 text-[11px]">
                <Step ok label="Unggah" />
                <Bar ok={Boolean(m.aiReview)} />
                <Step ok={Boolean(m.aiReview)} icon="ai" label="AI Claude" sub={m.aiReview ? `${m.aiReview.score}/100` : undefined} />
                <Bar ok={Boolean(m.verifierReview)} />
                <Step
                  ok={Boolean(m.verifierReview?.approved)}
                  icon="verify"
                  label="Verifikator"
                  sub={m.verifierReview?.verifierRole}
                />
                <Bar ok={m.status === 'verified'} />
                <Step ok={m.status === 'verified'} label="Terbit" />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2 text-xs text-neutral-500">
                <span>{m.downloads}× diunduh · ★ {m.rating || '—'}</span>
                <span className="font-bold text-brand-dark">Royalti: {royalty(m)} PNC</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? 'bg-brand-50' : 'bg-neutral-50'}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={`text-2xl font-extrabold ${accent ? 'text-brand-dark' : ''}`}>{value}</div>
      {sub && <div className="text-[10px] text-neutral-400">{sub}</div>}
    </div>
  )
}

function Step({ ok, label, sub, icon }: { ok: boolean; label: string; sub?: string; icon?: 'ai' | 'verify' }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className={`grid h-7 w-7 place-items-center rounded-full ${ok ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-400'}`}
      >
        {icon === 'ai' ? <IconSparkle size={13} /> : icon === 'verify' ? <IconShield size={13} /> : '✓'}
      </span>
      <span className={`mt-0.5 ${ok ? 'font-semibold text-neutral-700' : 'text-neutral-400'}`}>{label}</span>
      {sub && <span className="text-[9px] text-neutral-400">{sub}</span>}
    </div>
  )
}

function Bar({ ok }: { ok: boolean }) {
  return <div className={`mb-3 h-0.5 flex-1 ${ok ? 'bg-brand' : 'bg-neutral-200'}`} />
}
